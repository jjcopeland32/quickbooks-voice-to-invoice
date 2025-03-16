/**
 * Authentication Module
 * Handles user registration, login, token management and QuickBooks connection
 */
const Auth = (() => {
    // Private variables
    const TOKEN_KEY = 'qb_voice_auth_token';
    const USER_KEY = 'qb_voice_user';
    let currentUser = null;
    
    /**
     * Initialize the authentication system
     */
    function init() {
        console.log('Auth module initializing...');
        
        // Set up event listeners for login/signup buttons
        const loginBtn = document.getElementById('login-btn');
        const signupBtn = document.getElementById('signup-btn');
        const showLoginLink = document.getElementById('show-login');
        const showSignupLink = document.getElementById('show-signup');
        
        if (loginBtn) {
            console.log('Found login button, attaching event listener');
            loginBtn.addEventListener('click', showLoginForm);
        } else {
            console.warn('Login button not found');
        }
        
        if (signupBtn) {
            console.log('Found signup button, attaching event listener');
            signupBtn.addEventListener('click', showSignupForm);
        } else {
            console.warn('Signup button not found');
        }
        
        if (showLoginLink) {
            console.log('Found show login link, attaching event listener');
            showLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                showLoginForm();
            });
        } else {
            console.warn('Show login link not found');
        }
        
        if (showSignupLink) {
            console.log('Found show signup link, attaching event listener');
            showSignupLink.addEventListener('click', (e) => {
                e.preventDefault();
                showSignupForm();
            });
        } else {
            console.warn('Show signup link not found');
        }
        
        // Set up form submission handlers
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        
        console.log('Login form found:', !!loginForm, 'ID:', loginForm ? loginForm.id : 'none');
        console.log('Signup form found:', !!signupForm, 'ID:', signupForm ? signupForm.id : 'none');
        
        if (loginForm) {
            console.log('Attaching submit handler to login form');
            loginForm.addEventListener('submit', handleLogin);
        }
        
        if (signupForm) {
            console.log('Attaching submit handler to signup form');
            signupForm.addEventListener('submit', handleSignup);
        }
        
        // Set up logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
        
        // Set up QuickBooks connect button
        const connectQbBtn = document.getElementById('connect-qb-btn');
        if (connectQbBtn) {
            connectQbBtn.addEventListener('click', connectToQuickBooks);
        }
        
        // Check if user is already logged in
        checkAuthStatus();
        
        console.log('Authentication module initialized');
    }
    
    /**
     * Show the login form
     */
    function showLoginForm() {
        document.getElementById('login-form-container').classList.remove('hidden');
        document.getElementById('signup-form-container').classList.add('hidden');
        document.getElementById('login-btn').classList.add('hidden');
        document.getElementById('signup-btn').classList.add('hidden');
        
        // Hide features card and show login form if they exist
        const featuresCard = document.getElementById('features-card');
        if (featuresCard) {
            featuresCard.style.display = 'none';
        }
    }
    
    /**
     * Show the signup form
     */
    function showSignupForm() {
        document.getElementById('signup-form-container').classList.remove('hidden');
        document.getElementById('login-form-container').classList.add('hidden');
        document.getElementById('login-btn').classList.add('hidden');
        document.getElementById('signup-btn').classList.add('hidden');
        
        // Hide features card if it exists
        const featuresCard = document.getElementById('features-card');
        if (featuresCard) {
            featuresCard.style.display = 'none';
        }
    }
    
    /**
     * Handle login form submission
     */
    function handleLogin(e) {
        e.preventDefault();
        console.log('Login form submitted');
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const statusElement = document.getElementById('login-auth-status');
        
        // Simple validation
        if (!email || !password) {
            showAuthMessage(statusElement, 'Please fill in all fields', 'error');
            return;
        }
        
        // Show loading state
        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.innerHTML = '<svg class="spinner" width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" stroke-dasharray="30 30" stroke-dashoffset="0"><animateTransform attributeName="transform" type="rotate" begin="0s" dur="1s" from="0 12 12" to="360 12 12" repeatCount="indefinite"/></circle></svg> Signing in...';
        
        // Make API call to login
        console.log('Making login request to:', CONFIG.API_BASE_URL + '/api/auth/login');
        fetch(CONFIG.API_BASE_URL + '/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            mode: 'cors',
            body: JSON.stringify({ email, password })
        })
        .then(response => {
            console.log('Login response status:', response.status);
            
            // Check content type to ensure it's JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.error('Received non-JSON response:', contentType);
                throw new Error('Server returned an invalid response format. Please try again later or contact support.');
            }
            
            return response.json().then(data => {
                if (!response.ok) {
                    const errorMsg = data.error?.message || data.error || 'Invalid email or password';
                    throw new Error(errorMsg);
                }
                return data;
            }).catch(error => {
                // Handle JSON parsing errors
                if (error instanceof SyntaxError) {
                    console.error('JSON parsing error:', error);
                    throw new Error('Server returned an invalid response. Please try again later or contact support.');
                }
                throw error;
            });
        })
        .then(data => {
            console.log('Login response data:', data);
            // Save token and user data (handle nested data structure)
            const token = data.token || (data.data && data.data.token);
            const user = data.user || (data.data && data.data.user);
            
            console.log('Extracted token and user:', { token, user });
            
            if (!token) {
                throw new Error('No token received from server');
            }
            
            setToken(token);
            setUser(user);
            
            // Show success message
            showAuthMessage(statusElement, 'Login successful!', 'success');
            
            // Navigate to dashboard
            setTimeout(() => {
                showDashboard();
            }, 1000);
        })
        .catch(error => {
            console.error('Login error:', error);
            
            let errorMessage = error.message;
            
            // Log additional debugging info
            if (errorMessage.includes('Invalid response') || errorMessage.includes('invalid response format')) {
                console.error('API Response Error: The server might be down or returning HTML instead of JSON');
                // You can send this error to a monitoring service here
            }
            
            showAuthMessage(statusElement, errorMessage, 'error');
            
            // Reset button
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        });
    }
    
    /**
     * Handle signup form submission
     */
    function handleSignup(e) {
        e.preventDefault();
        console.log('Signup form submitted');
        
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const firstName = document.getElementById('signup-firstName').value;
        const lastName = document.getElementById('signup-lastName').value;
        const statusElement = document.getElementById('signup-auth-status');
        
        console.log('Signup form submitted with:', { email, firstName, lastName, password: '***' });
        
        // Simple validation
        if (!email || !password || !firstName) {
            console.error('Validation failed: Missing required fields');
            showAuthMessage(statusElement, 'Please fill in all required fields', 'error');
            return;
        }
        
        if (password.length < 8) {
            console.error('Validation failed: Password too short');
            showAuthMessage(statusElement, 'Password must be at least 8 characters long', 'error');
            return;
        }
        
        // Show loading state
        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.innerHTML = '<svg class="spinner" width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" stroke-dasharray="30 30" stroke-dashoffset="0"><animateTransform attributeName="transform" type="rotate" begin="0s" dur="1s" from="0 12 12" to="360 12 12" repeatCount="indefinite"/></circle></svg> Creating account...';
        
        // Make API call to register user
        fetch(CONFIG.API_BASE_URL + '/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            mode: 'cors',
            body: JSON.stringify({ 
                email, 
                password, 
                firstName, 
                lastName 
            })
        })
        .then(response => {
            console.log('Signup response status:', response.status);
            
            // Check content type to ensure it's JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.error('Received non-JSON response:', contentType);
                throw new Error('Server returned an invalid response format. Please try again later or contact support.');
            }
            
            return response.json().then(data => {
                if (!response.ok) {
                    const errorMsg = data.error?.message || data.error || 'Registration failed';
                    throw new Error(errorMsg);
                }
                return data;
            }).catch(error => {
                // Handle JSON parsing errors
                if (error instanceof SyntaxError) {
                    console.error('JSON parsing error:', error);
                    throw new Error('Server returned an invalid response. Please try again later or contact support.');
                }
                throw error;
            });
        })
        .then(data => {
            console.log('Signup response data:', data);
            
            // Save token and user data (handle nested data structure)
            const token = data.token || (data.data && data.data.token);
            const user = data.user || (data.data && data.data.user);
            
            console.log('Extracted token and user:', { token, user });
            
            if (!token) {
                throw new Error('No token received from server');
            }
            
            setToken(token);
            setUser(user);
            
            // Show success message
            showAuthMessage(statusElement, 'Account created successfully!', 'success');
            
            // Navigate to dashboard
            setTimeout(() => {
                showDashboard();
            }, 1000);
        })
        .catch(error => {
            console.error('Signup error:', error);
            
            let errorMessage = error.message;
            
            // Log additional debugging info
            if (errorMessage.includes('Invalid response') || errorMessage.includes('invalid response format')) {
                console.error('API Response Error: The server might be down or returning HTML instead of JSON');
                // You can send this error to a monitoring service here
            }
            
            showAuthMessage(statusElement, errorMessage, 'error');
            
            // Reset button
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        });
    }
    
    /**
     * Show authentication status message
     */
    function showAuthMessage(element, message, type) {
        if (!element) return;
        
        element.textContent = message;
        element.className = 'status-message';
        element.classList.add(type);
        element.classList.add('show');
        
        // Hide message after some time
        setTimeout(() => {
            element.classList.remove('show');
        }, 5000);
    }
    
    /**
     * Check authentication status on page load
     */
    function checkAuthStatus() {
        const token = getToken();
        const user = getUser();
        
        if (token && user) {
            // Validate token with backend - Using direct fetch instead of CORSProxy
            fetch(CONFIG.API_BASE_URL + '/api/auth/me', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                mode: 'cors' // Explicitly set CORS mode
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Token invalid');
                }
                return response.json();
            })
            .then(data => {
                if (data.user) {
                    currentUser = user;
                    showDashboard();
                    updateProfileUI();
                } else {
                    logout();
                }
            })
            .catch(error => {
                console.error('Token verification error:', error);
                logout();
            });
        }
    }
    
    /**
     * Show the dashboard and hide authentication forms
     */
    function showDashboard() {
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('dashboard-section').classList.remove('hidden');
        
        // Check QuickBooks connection status
        checkQuickBooksStatus();
    }
    
    /**
     * Update UI elements with user profile information
     */
    function updateProfileUI() {
        if (!currentUser) return;
        
        // Add username to the header if available
        const userNameElement = document.getElementById('user-name');
        if (userNameElement && currentUser.firstName) {
            userNameElement.textContent = `${currentUser.firstName} ${currentUser.lastName || ''}`;
        }
    }
    
    /**
     * Check QuickBooks connection status
     */
    function checkQuickBooksStatus() {
        const token = getToken();
        
        if (!token) return;
        
        fetch('/api/quickbooks/status', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to check QuickBooks status');
            }
            return response.json();
        })
        .then(data => {
            updateQuickBooksStatusUI(data.connected);
        })
        .catch(error => {
            console.error('Error checking QuickBooks status:', error);
            updateQuickBooksStatusUI(false);
        });
    }
    
    /**
     * Update the QuickBooks connection status in the UI
     */
    function updateQuickBooksStatusUI(isConnected) {
        const statusIndicator = document.getElementById('qbo-status');
        const connectBtn = document.getElementById('connect-qb-btn');
        const disconnectBtn = document.getElementById('disconnect-qb-btn');
        
        if (statusIndicator) {
            if (isConnected) {
                statusIndicator.classList.remove('not-connected');
                statusIndicator.classList.add('connected');
                statusIndicator.querySelector('.status-text').textContent = 'Connected';
            } else {
                statusIndicator.classList.remove('connected');
                statusIndicator.classList.add('not-connected');
                statusIndicator.querySelector('.status-text').textContent = 'Not Connected';
            }
        }
        
        if (connectBtn && disconnectBtn) {
            if (isConnected) {
                connectBtn.classList.add('hidden');
                disconnectBtn.classList.remove('hidden');
            } else {
                connectBtn.classList.remove('hidden');
                disconnectBtn.classList.add('hidden');
            }
        }
    }
    
    /**
     * Initiate connection to QuickBooks
     */
    function connectToQuickBooks() {
        const token = getToken();
        
        if (!token) {
            alert('You must be logged in to connect to QuickBooks');
            return;
        }
        
        // Redirect to the OAuth initiation endpoint
        window.location.href = `/auth/qbo?token=${token}`;
    }
    
    /**
     * Logout the current user
     */
    function logout() {
        // Clear storage
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        currentUser = null;
        
        // Reset UI
        document.getElementById('dashboard-section').classList.add('hidden');
        document.getElementById('invoice-section').classList.add('hidden');
        document.getElementById('auth-section').classList.remove('hidden');
        document.getElementById('login-form-container').classList.add('hidden');
        document.getElementById('signup-form-container').classList.add('hidden');
        
        // Show the buttons if they exist
        const loginBtn = document.getElementById('login-btn');
        const signupBtn = document.getElementById('signup-btn');
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (signupBtn) signupBtn.classList.remove('hidden');
        
        // Show features card if it exists
        const featuresCard = document.getElementById('features-card');
        if (featuresCard) {
            featuresCard.style.display = 'block';
        }
    }
    
    /**
     * Set the auth token in localStorage
     */
    function setToken(token) {
        localStorage.setItem(TOKEN_KEY, token);
    }
    
    /**
     * Get the auth token from localStorage
     */
    function getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }
    
    /**
     * Set the user object in localStorage
     */
    function setUser(user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        currentUser = user;
    }
    
    /**
     * Get the user object from localStorage
     */
    function getUser() {
        const userData = localStorage.getItem(USER_KEY);
        if (userData) {
            return JSON.parse(userData);
        }
        return null;
    }
    
    // Public API
    return {
        init,
        getToken,
        getUser,
        logout,
        connectToQuickBooks
    };
})();

// Export for use in other modules
window.Auth = Auth;

// Initialize auth module when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
}); 