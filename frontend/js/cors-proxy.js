/**
 * CORS Proxy Module
 * Provides a wrapper around fetch to handle CORS issues
 */
const CORSProxy = (() => {
    /**
     * Fetch wrapper that adds Access-Control-Allow-Origin header
     * 
     * @param {String} url - The URL to fetch
     * @param {Object} options - Fetch options
     * @returns {Promise} - Fetch promise
     */
    function fetchWithCORS(url, options = {}) {
        // Use the local fetch as-is, but log the request for debugging
        console.log('Making fetch request to:', url, options);
        
        // For file:// protocol, we need to use a CORS proxy
        if (window.location.protocol === 'file:') {
            // In this case, we're using local files, so normal fetch won't work due to CORS
            // Display this information to the user
            const authStatus = document.getElementById('auth-status');
            if (authStatus) {
                authStatus.textContent = 'CORS Error: Cannot access API from file:// protocol. Please use a local HTTP server.';
                authStatus.className = 'status-message error show';
            }
            
            // Return a rejected promise
            return Promise.reject(new Error('Cannot fetch from file:// protocol. Please use a local HTTP server.'));
        }
        
        // Add credentials to include cookies if needed
        const fetchOptions = {
            ...options,
            mode: 'cors'
            // Removed credentials: 'include' as it can cause CORS issues
        };
        
        // Add custom headers if needed
        if (!fetchOptions.headers) {
            fetchOptions.headers = {};
        }
        
        return fetch(url, fetchOptions)
            .catch(error => {
                console.error('Fetch error:', error);
                // Show more helpful error message
                if (error.message.includes('Failed to fetch')) {
                    throw new Error('Network error. Make sure the API server is running at ' + CONFIG.API_BASE_URL);
                }
                throw error;
            });
    }
    
    // Public API
    return {
        fetch: fetchWithCORS
    };
})();

// Export for use in other modules
window.CORSProxy = CORSProxy; 