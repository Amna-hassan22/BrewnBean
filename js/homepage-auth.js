// Homepage Authentication Manager
// This script handles authentication UI updates for the homepage
// Version: 2.0 - Fixed and Enhanced

// Dynamic API URL based on environment
function getAPIBaseURL() {
    // Check if we're in development (localhost)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000/api';
    }
    
    // Production environment - replace with your actual Vercel backend URL
    // You need to deploy your backend to Vercel or another hosting service
    return 'https://your-backend-app.vercel.app/api';
}

const API_BASE_URL = getAPIBaseURL();

// Global state
let isBackendAvailable = false;
let authState = {
    isLoggedIn: false,
    user: null,
    token: null
};

// Initialize authentication state on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Homepage Auth Manager: Initializing...');
    initializeAuth();
});

// Initialize authentication system
function initializeAuth() {
    try {
        // Load saved auth state
        loadAuthState();
        
        // Update UI
        updateAuthUI();
        
        // Check backend availability (non-blocking)
        checkBackendAvailability();
        
        // Set up event listeners
        setupEventListeners();
        
        console.log('Homepage Auth Manager: Initialized successfully');
    } catch (error) {
        console.error('Homepage Auth Manager: Initialization error:', error);
        // Still update UI even if there's an error
        updateAuthUI();
    }
}

// Load authentication state from localStorage
function loadAuthState() {
    try {
        const token = localStorage.getItem('authToken');
        const userString = localStorage.getItem('user');
        
        if (token && userString) {
            const user = JSON.parse(userString);
            if (user && user.name) {
                authState = {
                    isLoggedIn: true,
                    user: user,
                    token: token
                };
                console.log('Auth state loaded:', user.name);
            }
        }
    } catch (error) {
        console.error('Error loading auth state:', error);
        // Clear corrupted data
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        authState = { isLoggedIn: false, user: null, token: null };
    }
}

// Update navigation based on authentication state
function updateAuthUI() {
    try {
        const authNav = document.getElementById('authNav');
        const registerNav = document.getElementById('registerNav');
        const userNav = document.getElementById('userNav');
        const logoutNav = document.getElementById('logoutNav');
        const profileBtn = document.getElementById('profileBtn');

        if (authState.isLoggedIn && authState.user) {
            // User is logged in
            if (authNav) authNav.style.display = 'none';
            if (registerNav) registerNav.style.display = 'none';
            if (userNav) {
                userNav.style.display = 'block';
                userNav.classList.add('logged-in-indicator');
            }
            if (logoutNav) logoutNav.style.display = 'block';
            
            // Hide demo login button
            const demoLoginSection = document.getElementById('demoLoginSection');
            if (demoLoginSection) {
                demoLoginSection.style.display = 'none';
            }
            
            // Update profile button text with user name
            if (profileBtn) {
                profileBtn.innerHTML = `<i class="fas fa-user"></i> ${authState.user.name}`;
                profileBtn.title = `Welcome, ${authState.user.name}! Click to view your profile.`;
            }
            
            // Show welcome message
            showWelcomeMessage();
            
            console.log('UI updated for logged in user:', authState.user.name);
        } else {
            // User is not logged in
            if (authNav) authNav.style.display = 'block';
            if (registerNav) registerNav.style.display = 'block';
            if (userNav) {
                userNav.style.display = 'none';
                userNav.classList.remove('logged-in-indicator');
            }
            if (logoutNav) logoutNav.style.display = 'none';
            
            // Show demo login button
            const demoLoginSection = document.getElementById('demoLoginSection');
            if (demoLoginSection) {
                demoLoginSection.style.display = 'block';
            }
            
            // Hide welcome message
            hideWelcomeMessage();
            
            console.log('UI updated for logged out user');
        }
    } catch (error) {
        console.error('Error updating auth UI:', error);
    }
}

// Show welcome message for logged in users
function showWelcomeMessage() {
    try {
        // Remove existing welcome message if any
        hideWelcomeMessage();
        
        // Create welcome message element
        const welcomeMessage = document.createElement('div');
        welcomeMessage.id = 'welcomeMessage';
        welcomeMessage.innerHTML = `
            <div class="welcome-container">
                <div class="welcome-content">
                    <i class="fas fa-check-circle"></i>
                    <span>Welcome back, ${authState.user.name}! You are logged in.</span>
                    <button onclick="hideWelcomeMessage()" class="close-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Add styles
        welcomeMessage.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(45deg, #4CAF50, #45a049);
            color: white;
            padding: 12px 0;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            animation: slideDown 0.5s ease-out;
        `;
        
        // Add animation styles to head
        if (!document.querySelector('#welcomeStyles')) {
            const style = document.createElement('style');
            style.id = 'welcomeStyles';
            style.textContent = `
                @keyframes slideDown {
                    from { transform: translateY(-100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                
                @keyframes slideUp {
                    from { transform: translateY(0); opacity: 1; }
                    to { transform: translateY(-100%); opacity: 0; }
                }
                
                .welcome-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 20px;
                }
                
                .welcome-content {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    font-size: 16px;
                    font-weight: 500;
                }
                
                .welcome-content i.fa-check-circle {
                    color: #90EE90;
                    font-size: 18px;
                }
                
                .close-btn {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 16px;
                    cursor: pointer;
                    padding: 5px;
                    margin-left: 10px;
                    border-radius: 50%;
                    transition: background-color 0.3s;
                }
                
                .close-btn:hover {
                    background-color: rgba(255,255,255,0.2);
                }
                
                @media (max-width: 768px) {
                    .welcome-content {
                        font-size: 14px;
                        padding: 0 10px;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Add to page
        document.body.insertBefore(welcomeMessage, document.body.firstChild);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            hideWelcomeMessage();
        }, 5000);
        
    } catch (error) {
        console.error('Error showing welcome message:', error);
    }
}

// Hide welcome message
function hideWelcomeMessage() {
    try {
        const welcomeMessage = document.getElementById('welcomeMessage');
        if (welcomeMessage) {
            welcomeMessage.style.animation = 'slideUp 0.5s ease-out';
            setTimeout(() => {
                welcomeMessage.remove();
            }, 500);
        }
    } catch (error) {
        console.error('Error hiding welcome message:', error);
    }
}

// Check if backend is available
async function checkBackendAvailability() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`, {
            method: 'GET',
            timeout: 5000
        });
        
        if (response.ok) {
            isBackendAvailable = true;
            console.log('Backend is available');
        } else {
            isBackendAvailable = false;
            console.log('Backend is not responding properly');
        }
    } catch (error) {
        isBackendAvailable = false;
        console.log('Backend is not available, running in offline mode');
    }
}

// Setup event listeners
function setupEventListeners() {
    try {
        // Login button click
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', handleLoginClick);
        }
        
        // Register button click
        const registerBtn = document.getElementById('registerBtn');
        if (registerBtn) {
            registerBtn.addEventListener('click', handleRegisterClick);
        }
        
        // Profile button click
        const profileBtn = document.getElementById('profileBtn');
        if (profileBtn) {
            profileBtn.addEventListener('click', handleProfileClick);
        }
        
        // Logout button click
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogoutClick);
        }
        
        console.log('Event listeners set up successfully');
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

// Handle login button click
function handleLoginClick(event) {
    event.preventDefault();
    console.log('Login button clicked');
    
    // For now, just redirect to login page
    window.location.href = 'login.html';
}

// Handle register button click
function handleRegisterClick(event) {
    event.preventDefault();
    console.log('Register button clicked');
    
    // For now, just redirect to register page
    window.location.href = 'register.html';
}

// Handle profile button click
function handleProfileClick(event) {
    event.preventDefault();
    console.log('Profile button clicked');
    
    // For now, just redirect to profile page
    window.location.href = 'profile.html';
}

// Handle logout button click
function handleLogoutClick(event) {
    event.preventDefault();
    console.log('Logout button clicked');
    logout();
}

// Logout function
async function logout() {
    try {
        console.log('Logging out user...');
        
        // If backend is available, try to logout via API
        if (isBackendAvailable && authState.token) {
            try {
                await fetch(`${API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authState.token}`,
                        'Content-Type': 'application/json'
                    }
                });
                console.log('Backend logout successful');
            } catch (error) {
                console.log('Backend logout failed, continuing with local logout');
            }
        }
        
        // Clear local storage
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        
        // Update local state
        authState = {
            isLoggedIn: false,
            user: null,
            token: null
        };
        
        // Update UI
        updateAuthUI();
        
        // Show logout message
        showNotification('Logged out successfully', 'success');
        
        console.log('User logged out successfully');
        
    } catch (error) {
        console.error('Logout error:', error);
        
        // Still clear local storage even if API call fails
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        authState = { isLoggedIn: false, user: null, token: null };
        updateAuthUI();
        
        showNotification('Logged out (with errors)', 'warning');
    }
}

// Demo login function (for testing)
function demoLogin(userName = 'Demo User', userEmail = 'demo@brewbean.com') {
    try {
        const user = {
            name: userName,
            email: userEmail,
            id: 'demo123'
        };
        
        const token = 'demo-token-' + Date.now();
        
        // Save to localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Update local state
        authState = {
            isLoggedIn: true,
            user: user,
            token: token
        };
        
        // Update UI
        updateAuthUI();
        
        // Hide demo login button
        const demoLoginSection = document.getElementById('demoLoginSection');
        if (demoLoginSection) {
            demoLoginSection.style.display = 'none';
        }
        
        // Show success message
        showNotification(`Welcome ${userName}!`, 'success');
        
        console.log('Demo login successful for:', userName);
        
    } catch (error) {
        console.error('Demo login error:', error);
        showNotification('Demo login failed', 'error');
    }
}

// Show notification function
function showNotification(message, type = 'info') {
    try {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.auth-notification');
        existingNotifications.forEach(notification => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `auth-notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${getIconForType(type)}"></i>
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentNode.parentNode.remove()">×</button>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 12px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            max-width: 350px;
            backdrop-filter: blur(10px);
        `;
        
        // Set background color based on type
        notification.style.background = getColorForType(type);
        
        // Add to page
        document.body.appendChild(notification);
        
        // Remove after 4 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 4000);
        
    } catch (error) {
        console.error('Error showing notification:', error);
    }
}

// Helper function to get icon for notification type
function getIconForType(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

// Helper function to get color for notification type
function getColorForType(type) {
    switch (type) {
        case 'success': return 'linear-gradient(135deg, #28a745, #20c997)';
        case 'error': return 'linear-gradient(135deg, #dc3545, #e74c3c)';
        case 'warning': return 'linear-gradient(135deg, #ffc107, #fd7e14)';
        default: return 'linear-gradient(135deg, #17a2b8, #20c997)';
    }
}

// Make functions globally accessible
window.updateAuthUI = updateAuthUI;
window.hideWelcomeMessage = hideWelcomeMessage;
window.showWelcomeMessage = showWelcomeMessage;
window.demoLogin = demoLogin;

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        margin-left: auto;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.8;
        transition: opacity 0.2s;
    }
    
    .notification-close:hover {
        opacity: 1;
    }
`;

// Only add styles if not already added
if (!document.querySelector('#homepage-auth-styles')) {
    style.id = 'homepage-auth-styles';
    document.head.appendChild(style);
}

console.log('Homepage Auth Manager: Script loaded successfully');
