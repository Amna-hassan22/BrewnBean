// Brew&Bean API Integration Script
// Add this script to your HTML pages to connect with the backend API

class BrewBeanAPI {
  constructor() {
    // Dynamic API URL based on environment
    this.baseURL = this.getAPIBaseURL();
    this.token = localStorage.getItem('authToken');
  }

  // Get API base URL based on environment
  getAPIBaseURL() {
    // Check if we're in development (localhost)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    
    // Production environment - replace with your actual Vercel backend URL
    // You need to deploy your backend to Vercel or another hosting service
    return 'https://your-backend-app.vercel.app/api';
  }

  // Helper method to make API requests
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Add auth token if available
    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Authentication methods
  async register(userData) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    if (response.success) {
      this.token = response.data.token;
      localStorage.setItem('authToken', this.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
  }

  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (response.success) {
      this.token = response.data.token;
      localStorage.setItem('authToken', this.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('cart');
  }

  // Product methods
  async getProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/products?${queryString}` : '/products';
    return await this.request(endpoint);
  }

  async getProduct(id) {
    return await this.request(`/products/${id}`);
  }

  async getProductsByCategory(category, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/products/category/${category}?${queryString}` : `/products/category/${category}`;
    return await this.request(endpoint);
  }

  async getFeaturedProducts() {
    return await this.request('/products/featured');
  }

  async getPopularProducts() {
    return await this.request('/products/popular');
  }

  async searchProducts(query, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/products/search/${query}?${queryString}` : `/products/search/${query}`;
    return await this.request(endpoint);
  }

  // Cart methods
  async getCart() {
    return await this.request('/cart');
  }

  async addToCart(productId, quantity = 1) {
    return await this.request('/cart/add', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity })
    });
  }

  async updateCartItem(productId, quantity) {
    return await this.request('/cart/update', {
      method: 'PUT',
      body: JSON.stringify({ productId, quantity })
    });
  }

  async removeFromCart(productId) {
    return await this.request(`/cart/remove/${productId}`, {
      method: 'DELETE'
    });
  }

  async clearCart() {
    return await this.request('/cart/clear', {
      method: 'DELETE'
    });
  }

  async getCartCount() {
    return await this.request('/cart/count');
  }

  // Order methods
  async createOrder(orderData) {
    return await this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  async getOrders(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/orders?${queryString}` : '/orders';
    return await this.request(endpoint);
  }

  async getOrder(id) {
    return await this.request(`/orders/${id}`);
  }

  async cancelOrder(id, reason) {
    return await this.request(`/orders/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason })
    });
  }

  // Utility methods
  isAuthenticated() {
    return !!this.token;
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
}

// Initialize API instance
const api = new BrewBeanAPI();

// Enhanced cart functionality for your existing HTML pages
class EnhancedCart {
  constructor() {
    this.api = api;
    this.loadCart();
  }

  async loadCart() {
    try {
      if (this.api.isAuthenticated()) {
        // Load cart from backend if user is logged in
        const response = await this.api.getCart();
        if (response.success) {
          this.updateCartUI(response.data.cart);
        }
      } else {
        // Load cart from localStorage for guest users
        this.loadLocalCart();
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      this.loadLocalCart(); // Fallback to local cart
    }
  }

  loadLocalCart() {
    const savedCart = localStorage.getItem('brewBeanCart');
    if (savedCart) {
      const cart = JSON.parse(savedCart);
      this.updateCartUI(cart);
    }
  }

  async addToCart(productName, price, productId = null) {
    try {
      if (this.api.isAuthenticated() && productId) {
        // Add to backend cart
        const response = await this.api.addToCart(productId, 1);
        if (response.success) {
          this.updateCartUI(response.data.cart);
          this.showToast('Item added to cart!');
          return;
        }
      }
      
      // Fallback to local cart
      this.addToLocalCart(productName, price);
    } catch (error) {
      console.error('Error adding to cart:', error);
      this.addToLocalCart(productName, price);
    }
  }

  addToLocalCart(productName, price) {
    let cart = JSON.parse(localStorage.getItem('brewBeanCart') || '[]');
    
    const existingItem = cart.find(item => item.name === productName);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: Date.now(),
        name: productName,
        price: price,
        quantity: 1
      });
    }
    
    localStorage.setItem('brewBeanCart', JSON.stringify(cart));
    this.updateLocalCartUI(cart);
    this.showToast('Item added to cart!');
  }

  updateCartUI(cart) {
    // Update cart count
    const cartCountElement = document.getElementById('cartCount');
    if (cartCountElement) {
      cartCountElement.textContent = cart.totalItems || 0;
    }

    // Update cart modal if it exists
    this.updateCartModal(cart);
  }

  updateLocalCartUI(cart) {
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    
    // Update cart count
    const cartCountElement = document.getElementById('cartCount');
    if (cartCountElement) {
      cartCountElement.textContent = totalItems;
    }

    // Update cart modal if it exists
    this.updateLocalCartModal(cart);
  }

  updateCartModal(cart) {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    if (!cartItems) return;

    if (!cart.items || cart.items.length === 0) {
      cartItems.innerHTML = '<p style="text-align: center; color: #666; margin: 2rem 0;">Your cart is empty</p>';
      if (cartTotal) cartTotal.style.display = 'none';
      return;
    }

    let cartHTML = '';
    cart.items.forEach(item => {
      const itemTotal = item.price * item.quantity;
      cartHTML += `
        <div class="cart-item">
          <div class="cart-item-info">
            <div class="cart-item-name">${item.product?.name || item.name}</div>
            <div class="cart-item-price">₹${item.price} x ${item.quantity} = ₹${itemTotal}</div>
          </div>
          <button onclick="enhancedCart.removeFromCart('${item.product?._id || item.id}')" 
                  style="background: #ff4444; color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer;">×</button>
        </div>
      `;
    });

    cartItems.innerHTML = cartHTML;
    
    if (cartTotal) {
      cartTotal.innerHTML = `Total: ₹${cart.totalAmount}`;
      cartTotal.style.display = 'block';
    }
  }

  updateLocalCartModal(cart) {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    if (!cartItems) return;

    if (cart.length === 0) {
      cartItems.innerHTML = '<p style="text-align: center; color: #666; margin: 2rem 0;">Your cart is empty</p>';
      if (cartTotal) cartTotal.style.display = 'none';
      return;
    }

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
          <button onclick="enhancedCart.removeFromLocalCart('${item.id}')" 
                  style="background: #ff4444; color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer;">×</button>
        </div>
      `;
    });

    cartItems.innerHTML = cartHTML;
    
    if (cartTotal) {
      cartTotal.innerHTML = `Total: ₹${total}`;
      cartTotal.style.display = 'block';
    }
  }

  async removeFromCart(itemId) {
    try {
      if (this.api.isAuthenticated()) {
        const response = await this.api.removeFromCart(itemId);
        if (response.success) {
          this.updateCartUI(response.data.cart);
          return;
        }
      }
      
      this.removeFromLocalCart(itemId);
    } catch (error) {
      console.error('Error removing from cart:', error);
      this.removeFromLocalCart(itemId);
    }
  }

  removeFromLocalCart(itemId) {
    let cart = JSON.parse(localStorage.getItem('brewBeanCart') || '[]');
    cart = cart.filter(item => item.id !== itemId);
    localStorage.setItem('brewBeanCart', JSON.stringify(cart));
    this.updateLocalCartUI(cart);
  }

  showToast(message) {
    // Create or update toast notification
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
      `;
      document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.style.opacity = '1';
    
    setTimeout(() => {
      toast.style.opacity = '0';
    }, 3000);
  }

  // Enhanced checkout function
  async checkout() {
    if (!this.api.isAuthenticated()) {
      alert('Please login to complete your order.');
      // Redirect to login or show login modal
      return;
    }

    try {
      const cartResponse = await this.api.getCart();
      if (!cartResponse.success || !cartResponse.data.cart.items.length) {
        alert('Your cart is empty!');
        return;
      }

      // Here you would typically show a checkout form
      // For now, we'll create a simple order
      const orderData = {
        items: cartResponse.data.cart.items.map(item => ({
          product: item.product._id,
          quantity: item.quantity
        })),
        shippingAddress: {
          name: 'Customer Name',
          phone: '+919876543210',
          street: '123 Main Street',
          city: 'Delhi',
          state: 'Delhi',
          postalCode: '110001'
        },
        paymentMethod: 'cash_on_delivery'
      };

      const orderResponse = await this.api.createOrder(orderData);
      if (orderResponse.success) {
        alert(`Order placed successfully! Order ID: ${orderResponse.data.order.orderNumber}`);
        this.loadCart(); // Refresh cart
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Error processing order. Please try again.');
    }
  }
}

// Initialize enhanced cart
const enhancedCart = new EnhancedCart();

// Enhanced product loading functions
async function loadProducts(category = null, containerId = 'productContainer') {
  try {
    let response;
    if (category) {
      response = await api.getProductsByCategory(category);
    } else {
      response = await api.getProducts();
    }

    if (response.success) {
      displayProducts(response.data.products, containerId);
    }
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

function displayProducts(products, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const productsHTML = products.map(product => `
    <div class="coffee-card">
      ${product.isFeatured ? '<div class="popular-badge">Featured</div>' : ''}
      ${product.isPopular ? '<div class="popular-badge">Popular</div>' : ''}
      <div class="coffee-image">
        <img src="${product.images[0]?.url || '/images/placeholder.jpg'}" 
             alt="${product.name}" style="width: 100%; height: 100%;">
      </div>
      <div class="coffee-info">
        <h3 class="coffee-name">${product.name}</h3>
        <p class="coffee-description">${product.description}</p>
        <div class="coffee-details">
          <span class="coffee-price">₹${product.price}</span>
          <div class="coffee-rating">
            <div class="stars">
              ${generateStars(product.rating.average)}
            </div>
            <span class="rating-text">(${product.rating.average.toFixed(1)})</span>
          </div>
        </div>
        <div class="coffee-actions">
          <button class="btn btn-primary" onclick="buyNow('${product.name}', ${product.price}, '${product._id}')">Buy Now</button>
          <button class="btn btn-secondary" onclick="enhancedCart.addToCart('${product.name}', ${product.price}, '${product._id}')">Add to Cart</button>
        </div>
      </div>
    </div>
  `).join('');

  container.innerHTML = productsHTML;
}

function generateStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  let starsHTML = '';
  
  // Full stars
  for (let i = 0; i < fullStars; i++) {
    starsHTML += '<i class="fas fa-star"></i>';
  }
  
  // Half star
  if (hasHalfStar) {
    starsHTML += '<i class="fas fa-star-half-alt"></i>';
  }
  
  // Empty stars
  for (let i = 0; i < emptyStars; i++) {
    starsHTML += '<i class="far fa-star"></i>';
  }
  
  return starsHTML;
}

// Enhanced buy now function
async function buyNow(name, price, productId = null) {
  await enhancedCart.addToCart(name, price, productId);
  // Show cart modal if it exists
  const cartModal = document.getElementById('cartModal');
  if (cartModal) {
    cartModal.classList.add('show');
  }
}

// Login/Register functions
async function showLoginForm() {
  // You can create a modal for this or redirect to a login page
  const email = prompt('Enter your email:');
  const password = prompt('Enter your password:');
  
  if (email && password) {
    try {
      const response = await api.login(email, password);
      if (response.success) {
        alert('Login successful!');
        location.reload(); // Refresh to update UI
      }
    } catch (error) {
      alert('Login failed: ' + error.message);
    }
  }
}

async function showRegisterForm() {
  // You can create a modal for this or redirect to a register page
  const name = prompt('Enter your name:');
  const email = prompt('Enter your email:');
  const password = prompt('Enter your password:');
  const phone = prompt('Enter your phone number:');
  
  if (name && email && password) {
    try {
      const response = await api.register({ name, email, password, phone });
      if (response.success) {
        alert('Registration successful!');
        location.reload(); // Refresh to update UI
      }
    } catch (error) {
      alert('Registration failed: ' + error.message);
    }
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  // Load cart on page load
  enhancedCart.loadCart();
  
  // Update UI based on authentication status
  const user = api.getCurrentUser();
  if (user) {
    // Update UI for logged-in user
    console.log('Welcome back,', user.name);
  }
});

// Export for global use
window.BrewBeanAPI = BrewBeanAPI;
window.api = api;
window.enhancedCart = enhancedCart;
