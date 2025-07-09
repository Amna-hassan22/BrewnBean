// Login Page Authentication Script
// Dynamic API URL based on environment
function getAPIBaseURL() {
    // Check if we're in development (localhost)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000/api';
    }
    
    // Production environment - replace with your actual Vercel backend URL
    return 'https://your-backend-app.vercel.app/api';
}

const API_BASE_URL = getAPIBaseURL();

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const otpForm = document.getElementById('otpForm');
    const otpLoginBtn = document.getElementById('otpLoginBtn');
    const backToLoginBtn = document.getElementById('backToLoginBtn');
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
    const resendOtpBtn = document.getElementById('resendOtpBtn');
    
    // Show/hide sections
    const loginSection = document.getElementById('loginSection');
    const otpSection = document.getElementById('otpSection');
    const otpVerificationSection = document.getElementById('otpVerificationSection');
    
    // Regular login form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            showLoading('loginBtn');
            
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Store authentication data
                localStorage.setItem('authToken', data.data.token);
                localStorage.setItem('user', JSON.stringify(data.data.user));
                
                showNotification('Login successful!', 'success');
                
                // Redirect to home page
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                showNotification(data.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showNotification('Network error. Please try again.', 'error');
        } finally {
            hideLoading('loginBtn', '<i class="fas fa-sign-in-alt"></i> Sign In');
        }
    });
    
    // Switch to OTP login
    otpLoginBtn.addEventListener('click', function() {
        loginSection.style.display = 'none';
        otpSection.style.display = 'block';
    });
    
    // Back to regular login
    backToLoginBtn.addEventListener('click', function() {
        otpSection.style.display = 'none';
        loginSection.style.display = 'block';
        otpVerificationSection.style.display = 'none';
    });
    
    // Send OTP form submission
    otpForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('otpEmail').value;
        
        try {
            showLoading('sendOtpBtn');
            
            const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showNotification('OTP sent successfully!', 'success');
                otpVerificationSection.style.display = 'block';
                
                // For demo purposes, show the OTP (remove in production)
                if (data.data.otp) {
                    showNotification(`Demo OTP: ${data.data.otp}`, 'info');
                }
            } else {
                showNotification(data.message || 'Failed to send OTP', 'error');
            }
        } catch (error) {
            console.error('Send OTP error:', error);
            showNotification('Network error. Please try again.', 'error');
        } finally {
            hideLoading('sendOtpBtn', '<i class="fas fa-paper-plane"></i> Send OTP');
        }
    });
    
    // Verify OTP
    verifyOtpBtn.addEventListener('click', async function() {
        const email = document.getElementById('otpEmail').value;
        const otp = document.getElementById('otpCode').value;
        
        if (!otp || otp.length !== 6) {
            showNotification('Please enter a valid 6-digit OTP', 'error');
            return;
        }
        
        try {
            showLoading('verifyOtpBtn');
            
            const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, otp })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Store authentication data
                localStorage.setItem('authToken', data.data.token);
                localStorage.setItem('user', JSON.stringify(data.data.user));
                
                showNotification('OTP verified! Login successful!', 'success');
                
                // Redirect to home page
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                showNotification(data.message || 'OTP verification failed', 'error');
            }
        } catch (error) {
            console.error('Verify OTP error:', error);
            showNotification('Network error. Please try again.', 'error');
        } finally {
            hideLoading('verifyOtpBtn', '<i class="fas fa-check"></i> Verify OTP');
        }
    });
    
    // Resend OTP
    resendOtpBtn.addEventListener('click', async function() {
        const email = document.getElementById('otpEmail').value;
        
        try {
            showLoading('resendOtpBtn');
            
            const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showNotification('OTP resent successfully!', 'success');
                
                // For demo purposes, show the OTP (remove in production)
                if (data.data.otp) {
                    showNotification(`Demo OTP: ${data.data.otp}`, 'info');
                }
            } else {
                showNotification(data.message || 'Failed to resend OTP', 'error');
            }
        } catch (error) {
            console.error('Resend OTP error:', error);
            showNotification('Network error. Please try again.', 'error');
        } finally {
            hideLoading('resendOtpBtn', '<i class="fas fa-redo"></i> Resend OTP');
        }
    });
});

// Helper functions
function showLoading(buttonId) {
    const button = document.getElementById(buttonId);
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
}

function hideLoading(buttonId, originalText) {
    const button = document.getElementById(buttonId);
    button.disabled = false;
    button.innerHTML = originalText;
}

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
        max-width: 400px;
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
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Add CSS for animations
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
            password: formData.get('password'),
            remember: formData.get('remember') === 'on'
        };

        this.showLoading(true);
        this.clearAlerts();

        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                this.showAlert('Login successful! Redirecting...', 'success');
                
                // Store auth data
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('userData', JSON.stringify(result.user));
                
                if (data.remember) {
                    localStorage.setItem('rememberLogin', 'true');
                }

                // Redirect to dashboard or home
                setTimeout(() => {
                    window.location.href = this.getRedirectUrl();
                }, 1500);
            } else {
                this.showAlert(result.message || 'Login failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showAlert('Network error. Please check your connection.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showOtpSection() {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('otpSection').style.display = 'block';
    }

    showLoginSection() {
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('otpSection').style.display = 'none';
        document.getElementById('otpVerificationSection').style.display = 'none';
    }

    async sendOtp() {
        const phone = document.getElementById('otpPhone').value;
        
        if (!phone) {
            this.showAlert('Please enter your phone number', 'error');
            return;
        }

        this.showLoading(true);
        this.clearAlerts();

        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/send-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone })
            });

            const result = await response.json();

            if (response.ok) {
                this.currentOtpSession = result.sessionId;
                document.getElementById('otpVerificationSection').style.display = 'block';
                document.getElementById('otpForm').style.display = 'none';
                this.showAlert('OTP sent successfully!', 'success');
                this.startOtpTimer();
            } else {
                this.showAlert(result.message || 'Failed to send OTP. Please try again.', 'error');
            }
        } catch (error) {
            console.error('OTP send error:', error);
            this.showAlert('Network error. Please check your connection.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async verifyOtp() {
        const otpInputs = document.querySelectorAll('.otp-input');
        const otp = Array.from(otpInputs).map(input => input.value).join('');

        if (otp.length !== 6) {
            this.showAlert('Please enter the complete 6-digit OTP', 'error');
            return;
        }

        this.showLoading(true);
        this.clearAlerts();

        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    otp,
                    sessionId: this.currentOtpSession,
                    phone: document.getElementById('otpPhone').value
                })
            });

            const result = await response.json();

            if (response.ok) {
                this.showAlert('OTP verified! Logging you in...', 'success');
                
                // Store auth data
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('userData', JSON.stringify(result.user));

                // Redirect
                setTimeout(() => {
                    window.location.href = this.getRedirectUrl();
                }, 1500);
            } else {
                this.showAlert(result.message || 'Invalid OTP. Please try again.', 'error');
                // Clear OTP inputs
                otpInputs.forEach(input => input.value = '');
                otpInputs[0].focus();
            }
        } catch (error) {
            console.error('OTP verification error:', error);
            this.showAlert('Network error. Please check your connection.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async resendOtp() {
        const phone = document.getElementById('otpPhone').value;
        
        this.showLoading(true);
        this.clearAlerts();

        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/resend-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone })
            });

            const result = await response.json();

            if (response.ok) {
                this.currentOtpSession = result.sessionId;
                this.showAlert('OTP resent successfully!', 'success');
                this.startOtpTimer();
            } else {
                this.showAlert(result.message || 'Failed to resend OTP', 'error');
            }
        } catch (error) {
            console.error('OTP resend error:', error);
            this.showAlert('Network error. Please check your connection.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    startOtpTimer() {
        let timeLeft = 30;
        const resendLink = document.getElementById('resendOtp');
        const originalText = resendLink.textContent;
        
        resendLink.style.pointerEvents = 'none';
        resendLink.style.color = '#999';
        
        const timer = setInterval(() => {
            resendLink.textContent = `Resend OTP (${timeLeft}s)`;
            timeLeft--;
            
            if (timeLeft < 0) {
                clearInterval(timer);
                resendLink.textContent = originalText;
                resendLink.style.pointerEvents = 'auto';
                resendLink.style.color = '#8B4513';
            }
        }, 1000);
    }

    checkExistingAuth() {
        const token = localStorage.getItem('authToken');
        if (token) {
            // Verify token validity
            this.verifyToken(token);
        }
    }

    async verifyToken(token) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/verify-token`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                // User is already logged in, redirect
                window.location.href = this.getRedirectUrl();
            } else {
                // Token is invalid, clear storage
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
            }
        } catch (error) {
            console.error('Token verification error:', error);
        }
    }

    getRedirectUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect');
        return redirect || 'index.html';
    }

    showAlert(message, type) {
        const container = document.getElementById('alertContainer');
        container.innerHTML = `
            <div class="alert alert-${type}">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
                ${message}
            </div>
        `;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            container.innerHTML = '';
        }, 5000);
    }

    clearAlerts() {
        document.getElementById('alertContainer').innerHTML = '';
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        const loginSection = document.getElementById('loginSection');
        const otpSection = document.getElementById('otpSection');
        
        if (show) {
            loading.style.display = 'block';
            loginSection.style.display = 'none';
            otpSection.style.display = 'none';
        } else {
            loading.style.display = 'none';
            // Show the appropriate section
            if (document.getElementById('otpVerificationSection').style.display === 'block') {
                otpSection.style.display = 'block';
            } else {
                loginSection.style.display = 'block';
            }
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuthLogin();
});
