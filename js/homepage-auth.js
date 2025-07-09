// Homepage Authentication Manager
// This script handles authentication UI updates for the homepage

const API_BASE_URL = 'http://localhost:5000/api';

// Initialize authentication state on page load
document.addEventListener('DOMContentLoaded', function() {
    updateAuthUI();
});

// Update navigation based on authentication state
function updateAuthUI() {
    const token = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    const authNav = document.getElementById('authNav');
    const registerNav = document.getElementById('registerNav');
    const userNav = document.getElementById('userNav');
    const logoutNav = document.getElementById('logoutNav');

    if (token && user.name) {
        // User is logged in
        if (authNav) authNav.style.display = 'none';
        if (registerNav) registerNav.style.display = 'none';
        if (userNav) userNav.style.display = 'block';
        if (logoutNav) logoutNav.style.display = 'block';
        
        // Update profile button text
        const profileBtn = document.getElementById('profileBtn');
        if (profileBtn) {
            profileBtn.innerHTML = `<i class="fas fa-user"></i> ${user.name}`;
        }
    } else {
        // User is not logged in
        if (authNav) authNav.style.display = 'block';
        if (registerNav) registerNav.style.display = 'block';
        if (userNav) userNav.style.display = 'none';
        if (logoutNav) logoutNav.style.display = 'none';
    }
}

// Logout function
async function logout() {
    try {
        // Clear local storage (no need for backend API call for now)
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        
        // Update UI
        updateAuthUI();
        
        // Show logout message
        showNotification('Logged out successfully', 'success');
        
    } catch (error) {
        console.error('Logout error:', error);
        // Still clear local storage even if API call fails
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        updateAuthUI();
    }
}

// Show notification function
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    
    // Set background color based on type
    if (type === 'success') {
        notification.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
    } else if (type === 'error') {
        notification.style.background = 'linear-gradient(135deg, #dc3545, #e74c3c)';
    } else {
        notification.style.background = 'linear-gradient(135deg, #17a2b8, #20c997)';
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

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
`;
document.head.appendChild(style);
