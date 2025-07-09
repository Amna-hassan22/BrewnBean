// Registration Page Authentication Script
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
    const registerForm = document.getElementById('registerForm');
    
    // Initialize registration handler
    const authHandler = {
        init() {
            this.bindEvents();
            this.setupPasswordStrength();
            this.checkExistingAuth();
        },

        bindEvents() {
            // Registration form
            document.getElementById('registrationForm')?.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegistration();
            });

            // Real-time validation
            document.getElementById('email')?.addEventListener('blur', () => {
                this.validateEmail();
            });

            document.getElementById('phone')?.addEventListener('blur', () => {
                this.validatePhone();
            });

            document.getElementById('confirmPassword')?.addEventListener('input', () => {
                this.validatePasswordMatch();
            });
        },

        setupPasswordStrength() {
        const passwordField = document.getElementById('password');
        const strengthText = document.getElementById('strengthText');
        const strengthBar = document.getElementById('strengthBar');

        passwordField?.addEventListener('input', (e) => {
            const password = e.target.value;
            const strength = this.calculatePasswordStrength(password);
            
            strengthText.textContent = strength.text;
            strengthBar.className = `strength-bar ${strength.class}`;
        });
    }

    calculatePasswordStrength(password) {
        let score = 0;
        let feedback = [];

        if (password.length >= 8) score += 1;
        else feedback.push('at least 8 characters');

        if (/[a-z]/.test(password)) score += 1;
        else feedback.push('lowercase letter');

        if (/[A-Z]/.test(password)) score += 1;
        else feedback.push('uppercase letter');

        if (/\d/.test(password)) score += 1;
        else feedback.push('number');

        if (/[^a-zA-Z\d]/.test(password)) score += 1;
        else feedback.push('special character');

        if (score < 3) {
            return { text: 'Weak', class: 'strength-weak' };
        } else if (score < 5) {
            return { text: 'Medium', class: 'strength-medium' };
        } else {
            return { text: 'Strong', class: 'strength-strong' };
        }
    }

    async validateEmail() {
        const email = document.getElementById('email').value;
        if (!email) return;

        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/check-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const result = await response.json();
            
            if (!result.available) {
                this.showFieldError('email', 'This email is already registered');
                return false;
            } else {
                this.clearFieldError('email');
                return true;
            }
        } catch (error) {
            console.error('Email validation error:', error);
            return true; // Don't block registration on network error
        }
    }

    validatePhone() {
        const phone = document.getElementById('phone').value;
        const phoneRegex = /^[0-9]{10}$/;
        
        if (phone && !phoneRegex.test(phone)) {
            this.showFieldError('phone', 'Please enter a valid 10-digit phone number');
            return false;
        } else {
            this.clearFieldError('phone');
            return true;
        }
    }

    validatePasswordMatch() {
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (confirmPassword && password !== confirmPassword) {
            this.showFieldError('confirmPassword', 'Passwords do not match');
            return false;
        } else {
            this.clearFieldError('confirmPassword');
            return true;
        }
    }

    async handleRegistration() {
        const form = document.getElementById('registrationForm');
        const formData = new FormData(form);
        
        // Validate all fields
        const isEmailValid = await this.validateEmail();
        const isPhoneValid = this.validatePhone();
        const isPasswordMatch = this.validatePasswordMatch();
        
        if (!isEmailValid || !isPhoneValid || !isPasswordMatch) {
            this.showAlert('Please fix the errors above before continuing', 'error');
            return;
        }

        const data = {
            name: `${formData.get('firstName')} ${formData.get('lastName')}`,
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            phone: `${formData.get('countryCode')}${formData.get('phone')}`,
            password: formData.get('password'),
            dateOfBirth: formData.get('dateOfBirth'),
            gender: formData.get('gender'),
            newsletter: formData.get('newsletter') === 'on',
            terms: formData.get('terms') === 'on'
        };

        // Validate required fields
        if (!data.terms) {
            this.showAlert('You must agree to the Terms of Service to continue', 'error');
            return;
        }

        this.showLoading(true);
        this.clearAlerts();

        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                // Show success section
                document.getElementById('registrationSection').style.display = 'none';
                document.getElementById('verificationSection').style.display = 'block';
                
                // Send welcome email
                this.sendWelcomeEmail(data.email, data.firstName);
                
                // Track registration event
                this.trackRegistration(data);
            } else {
                this.showAlert(result.message || 'Registration failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showAlert('Network error. Please check your connection.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async sendWelcomeEmail(email, firstName) {
        try {
            await fetch(`${this.apiBaseUrl}/auth/send-welcome-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, firstName })
            });
        } catch (error) {
            console.error('Welcome email error:', error);
        }
    }

    trackRegistration(userData) {
        // Track registration for analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'sign_up', {
                method: 'email'
            });
        }
        
        // Store registration completion
        sessionStorage.setItem('registrationCompleted', 'true');
    }

    checkExistingAuth() {
        const token = localStorage.getItem('authToken');
        if (token) {
            // User is already logged in, redirect
            window.location.href = 'index.html';
        }
    }

    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        let errorElement = field.parentNode.querySelector('.field-error');
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            errorElement.style.color = '#dc3545';
            errorElement.style.fontSize = '0.8rem';
            errorElement.style.marginTop = '0.25rem';
            field.parentNode.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        field.style.borderColor = '#dc3545';
    }

    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        const errorElement = field.parentNode.querySelector('.field-error');
        
        if (errorElement) {
            errorElement.remove();
        }
        
        field.style.borderColor = '#e0e0e0';
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
        const registrationSection = document.getElementById('registrationSection');
        
        if (show) {
            loading.style.display = 'block';
            registrationSection.style.display = 'none';
        } else {
            loading.style.display = 'none';
            registrationSection.style.display = 'block';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuthRegister();
});
