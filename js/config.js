// Configuration file for Brew&Bean Frontend
// This file handles environment-specific configurations

window.BrewBeanConfig = {
    // Get API base URL based on environment
    getAPIBaseURL: function() {
        // Check if we're in development (localhost)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:5000/api';
        }
        
        // Production environment - replace with your actual backend URL
        // You need to deploy your backend to Vercel or another hosting service
        // For now, this will fallback to demo mode
        return 'https://your-backend-app.vercel.app/api';
    },
    
    // Get current environment
    getEnvironment: function() {
        return (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
            ? 'development' 
            : 'production';
    },
    
    // Check if backend is available
    isBackendAvailable: async function() {
        try {
            const response = await fetch(this.getAPIBaseURL() + '/health');
            return response.ok;
        } catch (error) {
            console.warn('Backend not available, falling back to demo mode:', error);
            return false;
        }
    },
    
    // API endpoints
    endpoints: {
        auth: {
            login: '/auth/login',
            register: '/auth/register',
            logout: '/auth/logout',
            profile: '/auth/profile',
            otp: '/auth/otp'
        },
        products: {
            list: '/products',
            search: '/products/search',
            category: '/products/category'
        },
        cart: {
            get: '/cart',
            add: '/cart/add',
            remove: '/cart/remove',
            update: '/cart/update',
            clear: '/cart/clear'
        },
        orders: {
            create: '/orders',
            list: '/orders',
            details: '/orders'
        }
    }
};

// Initialize configuration
console.log('BrewBean Config initialized for:', window.BrewBeanConfig.getEnvironment());
console.log('API Base URL:', window.BrewBeanConfig.getAPIBaseURL());
