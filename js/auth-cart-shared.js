// Shared Authentication and Cart Functions for Brew&Bean
// This file provides common functionality for all pages

// Global variables
let cart = [];
let cartCount = 0;
let currentPageType = 'general';

// Initialize page functionality
function initializePage(pageType = 'general') {
    currentPageType = pageType;
    document.addEventListener('DOMContentLoaded', function() {
        updateAuthUI();
        loadCart(pageType);
        setupAuthForm();
        setupEventListeners();
    });
}

// Authentication Functions
function updateAuthUI() {
    const token = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const authNav = document.getElementById('authNav');

    if (token && user.name) {
        authNav.innerHTML = `
            <span style="color: #FFD700; margin-right: 1rem;">Welcome, ${user.name}!</span>
            <a href="#" onclick="logout()" style="color: #fff;">Logout</a>
        `;
    } else {
        authNav.innerHTML = '<a href="#" onclick="toggleAuthModal()">Login</a>';
    }
}

function toggleAuthModal() {
    const authModal = document.getElementById('authModal');
    authModal.classList.toggle('show');
}

function setupAuthForm() {
    const authForm = document.getElementById('authForm');
    if (!authForm) return;
    
    const authTitle = document.getElementById('authTitle');
    const authSubmit = document.getElementById('authSubmit');
    const authSwitchText = document.getElementById('authSwitchText');
    const nameGroup = document.getElementById('nameGroup');
    const phoneGroup = document.getElementById('phoneGroup');
    
    let isLogin = true;

    // Switch between login/register
    document.addEventListener('click', function(e) {
        if (e.target.id === 'authSwitchLink') {
            e.preventDefault();
            isLogin = !isLogin;
            
            if (isLogin) {
                authTitle.textContent = 'Login';
                authSubmit.textContent = 'Login';
                authSwitchText.innerHTML = 'Don\'t have an account? <a href="#" id="authSwitchLink">Register here</a>';
                nameGroup.style.display = 'none';
                phoneGroup.style.display = 'none';
            } else {
                authTitle.textContent = 'Register';
                authSubmit.textContent = 'Register';
                authSwitchText.innerHTML = 'Already have an account? <a href="#" id="authSwitchLink">Login here</a>';
                nameGroup.style.display = 'block';
                phoneGroup.style.display = 'block';
            }
        }
    });

    // Form submission
    authForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(authForm);
        const data = Object.fromEntries(formData);
        
        try {
            let result;
            if (isLogin) {
                result = await BrewBeanAPI.auth.login(data.email, data.password);
            } else {
                result = await BrewBeanAPI.auth.register(data.name, data.email, data.password, data.phone);
            }
            
            if (result.success) {
                localStorage.setItem('authToken', result.data.token);
                localStorage.setItem('user', JSON.stringify(result.data.user));
                updateAuthUI();
                toggleAuthModal();
                showToast(isLogin ? 'Login successful!' : 'Registration successful!');
                authForm.reset();
                
                // Sync cart with server
                await syncCartWithServer();
            }
        } catch (error) {
            showToast('Authentication failed: ' + error.message);
        }
    });
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    updateAuthUI();
    showToast('Logged out successfully!');
    
    // Clear cart
    cart = [];
    cartCount = 0;
    updateCartUI();
}

// Cart Functions
async function loadCart(pageType = 'general') {
    const cartKey = `${pageType}Cart`;
    const savedCart = localStorage.getItem(cartKey);
    if (savedCart) {
        cart = JSON.parse(savedCart);
        cartCount = cart.reduce((total, item) => total + item.quantity, 0);
        updateCartUI();
    }
    
    await syncCartWithServer();
}

async function syncCartWithServer() {
    const token = localStorage.getItem('authToken');
    if (token) {
        try {
            const serverCart = await BrewBeanAPI.cart.getCart();
            if (serverCart.success && serverCart.data.items.length > 0) {
                cart = serverCart.data.items.map(item => ({
                    name: item.product.name,
                    price: item.product.price,
                    quantity: item.quantity,
                    productId: item.product._id
                }));
                cartCount = cart.reduce((total, item) => total + item.quantity, 0);
                updateCartUI();
                saveCart();
            }
        } catch (error) {
            console.log('Failed to sync with server cart:', error.message);
        }
    }
}

function saveCart(pageType = null) {
    const cartKey = `${pageType || currentPageType}Cart`;
    localStorage.setItem(cartKey, JSON.stringify(cart));
}

async function addToCart(name, price, category = 'coffee') {
    const token = localStorage.getItem('authToken');
    
    if (token) {
        try {
            const products = await BrewBeanAPI.products.getByCategory(category);
            const product = products.data.find(p => p.name === name);
            
            if (product) {
                await BrewBeanAPI.cart.addItem(product._id, 1);
                await syncCartWithServer();
                showToast('Item added to cart!');
                animateCartIcon();
                return;
            }
        } catch (error) {
            console.log('Failed to add to server cart, using local cart:', error.message);
        }
    }
    
    // Fallback to local cart
    addToLocalCart(name, price);
    animateCartIcon();
}

function addToLocalCart(name, price) {
    const existingItem = cart.find(item => item.name === name);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name, price, quantity: 1 });
    }
    
    cartCount++;
    updateCartUI();
    saveCart();
    showToast('Item added to cart!');
}

function animateCartIcon() {
    const cartIcon = document.querySelector('.cart-icon');
    cartIcon.classList.add('pulse');
    setTimeout(() => cartIcon.classList.remove('pulse'), 300);
}

async function removeFromCart(name) {
    const token = localStorage.getItem('authToken');
    
    if (token) {
        try {
            const item = cart.find(item => item.name === name);
            if (item && item.productId) {
                await BrewBeanAPI.cart.removeItem(item.productId);
                await syncCartWithServer();
                return;
            }
        } catch (error) {
            console.log('Failed to remove from server cart, using local cart:', error.message);
        }
    }
    
    // Local cart removal
    const itemIndex = cart.findIndex(item => item.name === name);
    if (itemIndex > -1) {
        const item = cart[itemIndex];
        cartCount -= item.quantity;
        cart.splice(itemIndex, 1);
        updateCartUI();
        saveCart();
    }
}

function updateCartUI() {
    const cartCountElement = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const cartActions = document.getElementById('cartActions');
    
    if (!cartCountElement) return;
    
    cartCountElement.textContent = cartCount;
    
    if (cart.length === 0) {
        if (cartItems) cartItems.innerHTML = '<p style="text-align: center; color: #666; margin: 2rem 0;">Your cart is empty</p>';
        if (cartTotal) cartTotal.style.display = 'none';
        if (cartActions) cartActions.style.display = 'none';
    } else {
        let cartHTML = '';
        let total = 0;
        
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            cartHTML += `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">₹${item.price} x ${item.quantity} = ₹${itemTotal}</div>
                    </div>
                    <button onclick="removeFromCart('${item.name}')" style="background: #ff4444; color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer;">×</button>
                </div>
            `;
        });
        
        if (cartItems) cartItems.innerHTML = cartHTML;
        if (cartTotal) {
            cartTotal.innerHTML = `Total: ₹${total}`;
            cartTotal.style.display = 'block';
        }
        if (cartActions) cartActions.style.display = 'block';
    }
}

function toggleCart() {
    const cartModal = document.getElementById('cartModal');
    cartModal.classList.toggle('show');
}

function buyNow(name, price, category = 'coffee') {
    addToCart(name, price, category);
    toggleCart();
}

async function checkout() {
    if (cart.length === 0) {
        showToast('Your cart is empty!');
        return;
    }
    
    const token = localStorage.getItem('authToken');
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (token) {
        try {
            const orderData = {
                items: cart.map(item => ({
                    product: item.productId || item.name,
                    quantity: item.quantity,
                    price: item.price
                })),
                total: total
            };
            
            const result = await BrewBeanAPI.orders.create(orderData);
            if (result.success) {
                showToast('Order placed successfully!');
                cart = [];
                cartCount = 0;
                updateCartUI();
                saveCart();
                toggleCart();
                return;
            }
        } catch (error) {
            console.log('Failed to create order on server:', error.message);
        }
    }
    
    // Demo checkout
    showToast(`Thank you for your order! Total: ₹${total} (Demo Mode)`);
    cart = [];
    cartCount = 0;
    updateCartUI();
    saveCart();
    toggleCart();
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
}

function setupEventListeners() {
    // Close modals when clicking outside
    document.addEventListener('click', function(event) {
        const cartModal = document.getElementById('cartModal');
        const authModal = document.getElementById('authModal');
        
        if (event.target === cartModal) {
            cartModal.classList.remove('show');
        }
        
        if (event.target === authModal) {
            authModal.classList.remove('show');
        }
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Export for global use
window.BrewBeanShared = {
    initializePage,
    updateAuthUI,
    toggleAuthModal,
    logout,
    addToCart,
    removeFromCart,
    updateCartUI,
    toggleCart,
    buyNow,
    checkout,
    showToast
};
