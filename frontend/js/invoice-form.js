/**
 * Invoice Form Module
 * Handles the multi-step invoice creation form, validation, and submission
 */
const InvoiceForm = (() => {
    // Private variables
    const totalSteps = 5;
    let currentStep = 1;
    let formData = {};
    
    /**
     * Initialize the invoice form
     */
    function init() {
        // Set up event listeners for form navigation
        const nextBtn = document.getElementById('next-btn');
        const prevBtn = document.getElementById('prev-btn');
        const submitBtn = document.getElementById('submit-btn');
        
        if (nextBtn) {
            nextBtn.addEventListener('click', goToNextStep);
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', goToPreviousStep);
        }
        
        if (submitBtn) {
            submitBtn.addEventListener('click', submitInvoice);
        }
        
        // Initialize form data object
        formData = {
            customerName: '',
            serviceDescription: '',
            amount: '',
            dueDate: '',
            notes: ''
        };
        
        // Set up "Create New Invoice" button
        const newInvoiceBtn = document.getElementById('new-invoice-btn');
        if (newInvoiceBtn) {
            newInvoiceBtn.addEventListener('click', showInvoiceForm);
        }
        
        // Handle field input changes to update formData
        setupFieldListeners();
        
        console.log('Invoice form initialized');
    }
    
    /**
     * Set up listeners for input fields
     */
    function setupFieldListeners() {
        const fields = ['customerName', 'serviceDescription', 'amount', 'dueDate', 'notes'];
        
        fields.forEach(field => {
            const input = document.getElementById(field);
            if (input) {
                input.addEventListener('input', (e) => {
                    formData[field] = e.target.value;
                    updateNextButtonState();
                });
            }
        });
    }
    
    /**
     * Update the state of the Next button based on current field validation
     */
    function updateNextButtonState() {
        const nextBtn = document.getElementById('next-btn');
        if (!nextBtn) return;
        
        let isValid = false;
        
        switch (currentStep) {
            case 1:
                isValid = formData.customerName.trim().length > 0;
                break;
            case 2:
                isValid = formData.serviceDescription.trim().length > 0;
                break;
            case 3:
                isValid = /^\d+(\.\d{1,2})?$/.test(formData.amount.trim());
                break;
            case 4:
                // Simple date validation - can be improved
                isValid = /^\d{4}-\d{2}-\d{2}$/.test(formData.dueDate.trim());
                break;
            case 5:
                // Notes are optional
                isValid = true;
                break;
        }
        
        nextBtn.disabled = !isValid;
        
        // Also update submit button if we're on the last step
        if (currentStep === totalSteps) {
            const submitBtn = document.getElementById('submit-btn');
            if (submitBtn) {
                submitBtn.disabled = !isValid;
            }
        }
    }
    
    /**
     * Show the invoice creation form and hide other sections
     */
    function showInvoiceForm() {
        // Hide dashboard section
        const dashboardSection = document.getElementById('dashboard-section');
        if (dashboardSection) {
            dashboardSection.classList.add('hidden');
        }
        
        // Show invoice section
        const invoiceSection = document.getElementById('invoice-section');
        if (invoiceSection) {
            invoiceSection.classList.remove('hidden');
        }
        
        // Reset to first step
        setStep(1);
    }
    
    /**
     * Go to the next step in the form
     */
    function goToNextStep() {
        if (currentStep < totalSteps) {
            setStep(currentStep + 1);
        } else {
            // On the last step, show the submit button
            const nextBtn = document.getElementById('next-btn');
            const submitBtn = document.getElementById('submit-btn');
            
            if (nextBtn) nextBtn.classList.add('hidden');
            if (submitBtn) submitBtn.classList.remove('hidden');
        }
    }
    
    /**
     * Go to the previous step in the form
     */
    function goToPreviousStep() {
        if (currentStep > 1) {
            setStep(currentStep - 1);
            
            // Hide submit button and show next button if moving back from last step
            if (currentStep === totalSteps - 1) {
                const nextBtn = document.getElementById('next-btn');
                const submitBtn = document.getElementById('submit-btn');
                
                if (nextBtn) nextBtn.classList.remove('hidden');
                if (submitBtn) submitBtn.classList.add('hidden');
            }
        }
    }
    
    /**
     * Set the current step and update UI
     */
    function setStep(step) {
        currentStep = step;
        
        // Update the progress bar
        updateProgressBar();
        
        // Show/hide appropriate field containers
        updateFieldVisibility();
        
        // Show/hide previous button
        const prevBtn = document.getElementById('prev-btn');
        if (prevBtn) {
            prevBtn.classList.toggle('hidden', currentStep === 1);
        }
        
        // Update next button state
        updateNextButtonState();
    }
    
    /**
     * Update the progress bar based on current step
     */
    function updateProgressBar() {
        const progressBar = document.getElementById('progress-bar');
        if (!progressBar) return;
        
        // Calculate progress percentage
        const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
        progressBar.style.width = `${progressPercentage}%`;
        
        // Update step indicators
        const steps = document.querySelectorAll('.step');
        steps.forEach((step, index) => {
            // Add index+1 to convert from 0-based to 1-based
            if (index + 1 < currentStep) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (index + 1 === currentStep) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });
    }
    
    /**
     * Update field visibility based on current step
     */
    function updateFieldVisibility() {
        const fieldContainers = [
            'customer-name-container',
            'service-description-container',
            'amount-container',
            'due-date-container',
            'notes-container'
        ];
        
        fieldContainers.forEach((containerId, index) => {
            const container = document.getElementById(containerId);
            if (container) {
                if (index + 1 === currentStep) {
                    container.classList.remove('hidden');
                    container.classList.add('active');
                } else {
                    container.classList.add('hidden');
                    container.classList.remove('active');
                }
            }
        });
    }
    
    /**
     * Submit the invoice to the backend
     */
    function submitInvoice() {
        // Show loading state
        const submitBtn = document.getElementById('submit-btn');
        if (submitBtn) {
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<svg class="spinner" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" stroke-dasharray="30 30" stroke-dashoffset="0"><animateTransform attributeName="transform" type="rotate" begin="0s" dur="1s" from="0 12 12" to="360 12 12" repeatCount="indefinite"/></circle></svg> Creating Invoice...';
            
            // Get the authentication token
            const token = Auth.getToken();
            
            if (!token) {
                showError('You must be logged in to create an invoice');
                resetSubmitButton(submitBtn, originalText);
                return;
            }
            
            // Prepare data for submission
            const invoiceData = {
                customerName: formData.customerName,
                serviceDescription: formData.serviceDescription,
                amount: parseFloat(formData.amount),
                dueDate: formData.dueDate,
                notes: formData.notes
            };
            
            // Make API call to create invoice
            CORSProxy.fetch(CONFIG.API_BASE_URL + CONFIG.CREATE_INVOICE_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(invoiceData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to create invoice');
                }
                return response.json();
            })
            .then(data => {
                console.log('Invoice created:', data);
                // Handle the nested data structure from the API
                const invoiceData = data.data ? data.data : data;
                showSuccess(invoiceData);
                resetSubmitButton(submitBtn, originalText);
            })
            .catch(error => {
                console.error('Error creating invoice:', error);
                showError(error.message || 'Failed to create invoice. Please try again.');
                resetSubmitButton(submitBtn, originalText);
            });
        }
    }
    
    /**
     * Reset the submit button to its original state
     */
    function resetSubmitButton(button, originalText) {
        if (button) {
            button.disabled = false;
            button.innerHTML = originalText;
        }
    }
    
    /**
     * Show error message
     */
    function showError(message) {
        // Create toast notification for error
        createToast('error', message);
    }
    
    /**
     * Show success message and navigate to results
     */
    function showSuccess(data) {
        // Hide invoice section
        const invoiceSection = document.getElementById('invoice-section');
        if (invoiceSection) {
            invoiceSection.classList.add('hidden');
        }
        
        // Show result section
        const resultSection = document.getElementById('result-section');
        if (resultSection) {
            resultSection.classList.remove('hidden');
            
            // Populate result details
            const invoiceNumber = document.getElementById('result-invoice-number');
            const customerName = document.getElementById('result-customer-name');
            const amount = document.getElementById('result-amount');
            
            if (invoiceNumber) invoiceNumber.textContent = data.invoiceNumber || 'N/A';
            if (customerName) customerName.textContent = formData.customerName;
            if (amount) amount.textContent = `$${parseFloat(formData.amount).toFixed(2)}`;
        }
        
        // Create toast notification for success
        createToast('success', 'Invoice created successfully!');
    }
    
    /**
     * Create a toast notification
     */
    function createToast(type, message) {
        // Check if toast container exists, if not create it
        let toastContainer = document.getElementById('toast-container');
        
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        // Create icon based on type
        let icon = '';
        if (type === 'success') {
            icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        } else if (type === 'error') {
            icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        }
        
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-message">${message}</div>
            <button class="toast-close">&times;</button>
        `;
        
        // Add toast to container
        toastContainer.appendChild(toast);
        
        // Set timeout to remove toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 5000);
        
        // Add close button functionality
        const closeButton = toast.querySelector('.toast-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                toast.classList.remove('show');
                setTimeout(() => {
                    toast.remove();
                }, 300);
            });
        }
    }
    
    // Public API
    return {
        init,
        showInvoiceForm
    };
})();

// Export for use in other modules
window.InvoiceForm = InvoiceForm; 