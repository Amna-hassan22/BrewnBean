// Environment-specific API URL handler
// Include this script before any other API-related scripts

// Override the API_BASE_URL based on environment
(function() {
    // Function to get the correct API URL
    function getAPIURL() {
        const hostname = window.location.hostname;
        
        // Development environment
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:5000/api';
        }
        
        // Production environment
        // Replace 'your-backend-app' with your actual Vercel backend URL
        return 'https://your-backend-app.vercel.app/api';
    }
    
    // Set global API URL
    window.API_BASE_URL = getAPIURL();
    
    // Also create a global configuration object
    window.BrewBeanAPI = window.BrewBeanAPI || {};
    window.BrewBeanAPI.baseURL = getAPIURL();
    
    console.log('Environment detected:', window.location.hostname);
    console.log('API Base URL set to:', window.API_BASE_URL);
})();
