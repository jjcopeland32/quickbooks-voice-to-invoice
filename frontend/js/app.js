/**
 * Main Application Module
 * Initializes all components and handles global events
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('App initializing...');
    
    // Initialize authentication module
    if (typeof Auth !== 'undefined') {
        console.log('Initializing Auth module...');
        Auth.init();
    } else {
        console.error('Auth module not found. Authentication functionality will not work.');
    }
    
    // Initialize voice recognition module
    if (typeof Voice !== 'undefined') {
        console.log('Initializing Voice module...');
        Voice.init();
    } else {
        console.log('Voice module not found. Voice recognition functionality will not work.');
    }
    
    // Initialize invoice form module
    if (typeof InvoiceForm !== 'undefined') {
        console.log('Initializing InvoiceForm module...');
        InvoiceForm.init();
    } else {
        console.log('InvoiceForm module not found. Invoice form functionality will not work.');
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Check for errors in URL
    checkForErrors();
    
    // Add a reset button to the page for emergency reset
    addResetButton();
    
    console.log('App initialization complete');
});

// Export for use in other modules
window.App = {
    version: '1.0.0'
};

/**
 * Add a reset button to the page for emergency reset
 */
function addResetButton() {
    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset Application';
    resetButton.style.position = 'fixed';
    resetButton.style.bottom = '10px';
    resetButton.style.right = '10px';
    resetButton.style.zIndex = '9999';
    resetButton.style.backgroundColor = '#ff5555';
    resetButton.style.color = 'white';
    resetButton.style.border = 'none';
    resetButton.style.padding = '5px 10px';
    resetButton.style.borderRadius = '5px';
    resetButton.style.cursor = 'pointer';
    resetButton.style.display = 'none'; // Hidden by default
    
    // Show the reset button when Alt key is pressed
    document.addEventListener('keydown', (e) => {
        if (e.altKey) {
            resetButton.style.display = 'block';
        }
    });
    
    document.addEventListener('keyup', (e) => {
        if (!e.altKey) {
            resetButton.style.display = 'none';
        }
    });
    
    resetButton.addEventListener('click', () => {
        // Clear localStorage
        localStorage.clear();
        
        // Reset UI state
        const authSection = document.getElementById('auth-section');
        const dashboardSection = document.getElementById('dashboard-section');
        const invoiceSection = document.getElementById('invoice-section');
        const loginForm = document.getElementById('login-form-element');
        const signupForm = document.getElementById('signup-form-element');
        const loginBtn = document.getElementById('login-btn');
        const signupBtn = document.getElementById('signup-btn');
        
        if (authSection) authSection.classList.remove('hidden');
        if (dashboardSection) dashboardSection.classList.add('hidden');
        if (invoiceSection) invoiceSection.classList.add('hidden');
        if (loginForm) loginForm.classList.add('hidden');
        if (signupForm) signupForm.classList.add('hidden');
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (signupBtn) signupBtn.classList.remove('hidden');
        
        // Reload the page
        window.location.reload();
    });
    
    document.body.appendChild(resetButton);
}

/**
 * Set up event listeners for the application
 */
function setupEventListeners() {
    // Connect to QuickBooks button
    const connectQbBtn = document.getElementById('connect-qb-btn');
    if (connectQbBtn) {
        connectQbBtn.addEventListener('click', () => {
            Auth.connectToQuickBooks();
        });
    }
    
    // Disconnect from QuickBooks button
    const disconnectQbBtn = document.getElementById('disconnect-qb-btn');
    if (disconnectQbBtn) {
        disconnectQbBtn.addEventListener('click', () => {
            // Implement disconnect functionality
            console.log('Disconnect from QuickBooks clicked');
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            Auth.logout();
        });
    }
    
    // Alert modal buttons
    const modalOkButton = document.getElementById('modal-ok-btn');
    const closeModalButton = document.querySelector('.close-modal');
    
    if (modalOkButton) {
        modalOkButton.addEventListener('click', () => {
            closeModal();
        });
    }
    
    if (closeModalButton) {
        closeModalButton.addEventListener('click', () => {
            closeModal();
        });
    }
}

/**
 * Check for error parameters in the URL
 * Used for handling OAuth errors
 */
function checkForErrors() {
    const urlParams = new URLSearchParams(window.location.search);
    const errorMessage = urlParams.get('message');
    
    if (errorMessage) {
        // Show error message
        const errorSection = document.getElementById('error-section');
        const errorMessageElement = document.getElementById('error-message');
        
        if (errorSection && errorMessageElement) {
            errorMessageElement.textContent = decodeURIComponent(errorMessage);
            errorSection.classList.remove('hidden');
            
            // Hide other sections
            document.getElementById('auth-section').classList.add('hidden');
            document.getElementById('invoice-section').classList.add('hidden');
            document.getElementById('result-section').classList.add('hidden');
        }
        
        // Remove error from URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
    }
    
    // Check for action parameter (for PWA shortcuts)
    const action = urlParams.get('action');
    if (action === 'new-invoice' && Auth.getToken()) {
        // If user is logged in and action is new-invoice, show invoice form
        setTimeout(() => {
            InvoiceForm.showInvoiceForm();
        }, 1000);
    }
}

/**
 * Register the service worker for PWA functionality
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('Service Worker registered with scope:', registration.scope);
                    
                    // Check for service worker updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        
                        // When the new service worker is installed, show update notification
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                showUpdateNotification();
                            }
                        });
                    });
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
                
            // Handle service worker updates
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                // Reload the page when the service worker is updated
                window.location.reload();
            });
        });
    }
}

/**
 * Show a notification when a service worker update is available
 */
function showUpdateNotification() {
    // Create a toast notification for the update
    const toastContainer = document.createElement('div');
    toastContainer.className = 'update-toast';
    toastContainer.innerHTML = `
        <div class="update-toast-content">
            <p>A new version is available!</p>
            <button id="update-btn">Update Now</button>
        </div>
    `;
    
    document.body.appendChild(toastContainer);
    
    // Add event listener to update button
    document.getElementById('update-btn').addEventListener('click', () => {
        // Send message to service worker to skip waiting
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
        
        // Remove the notification
        toastContainer.remove();
    });
}

/**
 * Show alert modal
 * @param {string} title - Alert title
 * @param {string} message - Alert message
 */
function showAlert(title, message) {
    const alertModal = document.getElementById('alert-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    
    if (alertModal && modalTitle && modalMessage) {
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        alertModal.style.display = 'block';
    }
}

/**
 * Close alert modal
 */
function closeModal() {
    const alertModal = document.getElementById('alert-modal');
    if (alertModal) {
        alertModal.style.display = 'none';
    }
} 