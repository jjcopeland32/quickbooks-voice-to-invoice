/**
 * Invoice form module
 * Handles the progressive form flow and invoice creation
 */
const InvoiceForm = (() => {
    // Private variables
    const steps = [
        { id: 'customer-name-container', field: 'customerName', required: true },
        { id: 'service-description-container', field: 'serviceDescription', required: true },
        { id: 'amount-container', field: 'amount', required: true },
        { id: 'due-date-container', field: 'dueDate', required: true },
        { id: 'notes-container', field: 'notes', required: false }
    ];
    
    let currentStepIndex = 0;
    
    /**
     * Initialize the invoice form
     * Sets up event listeners for navigation buttons
     */
    const init = () => {
        // Set up event listeners for navigation buttons
        const nextBtn = document.getElementById('next-btn');
        const prevBtn = document.getElementById('prev-btn');
        const submitBtn = document.getElementById('submit-btn');
        const createNewBtn = document.getElementById('create-new-btn');
        const tryAgainBtn = document.getElementById('try-again-btn');
        
        if (nextBtn) {
            nextBtn.addEventListener('click', nextStep);
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', prevStep);
        }
        
        if (submitBtn) {
            submitBtn.addEventListener('click', submitInvoice);
        }
        
        if (createNewBtn) {
            createNewBtn.addEventListener('click', reset);
        }
        
        if (tryAgainBtn) {
            tryAgainBtn.addEventListener('click', () => {
                // Hide error section and show invoice section
                document.getElementById('error-section').classList.add('hidden');
                document.getElementById('invoice-section').classList.remove('hidden');
            });
        }
        
        // Show the first step
        showStep(currentStepIndex);
        updateProgressBar();
    };
    
    /**
     * Show a specific step in the form
     * 
     * @param {Number} index - Index of the step to show
     */
    const showStep = (index) => {
        // Hide all steps
        steps.forEach(step => {
            const container = document.getElementById(step.id);
            if (container) {
                container.classList.add('hidden');
            }
        });
        
        // Show the current step
        const currentStep = steps[index];
        const currentContainer = document.getElementById(currentStep.id);
        if (currentContainer) {
            currentContainer.classList.remove('hidden');
        }
        
        // Update navigation buttons
        updateNavigationButtons();
    };
    
    /**
     * Move to the next step in the form
     */
    const nextStep = () => {
        // Validate current step
        if (!validateCurrentStep()) {
            return;
        }
        
        // Move to next step if not at the end
        if (currentStepIndex < steps.length - 1) {
            currentStepIndex++;
            showStep(currentStepIndex);
            updateProgressBar();
        }
    };
    
    /**
     * Move to the previous step in the form
     */
    const prevStep = () => {
        // Move to previous step if not at the beginning
        if (currentStepIndex > 0) {
            currentStepIndex--;
            showStep(currentStepIndex);
            updateProgressBar();
        }
    };
    
    /**
     * Validate the current step
     * 
     * @returns {Boolean} True if valid, false otherwise
     */
    const validateCurrentStep = () => {
        const currentStep = steps[currentStepIndex];
        const field = document.getElementById(currentStep.field);
        
        // Skip validation for non-required fields
        if (!currentStep.required) {
            return true;
        }
        
        // Check if field has a value
        if (!field || !field.value.trim()) {
            // Show error message
            const fieldContainer = document.getElementById(currentStep.id);
            const statusElement = fieldContainer.querySelector('.field-status');
            
            if (statusElement) {
                statusElement.textContent = `${getFieldLabel(currentStep.field)} is required.`;
                statusElement.classList.add('error');
            }
            
            return false;
        }
        
        // Additional validation for specific fields
        if (currentStep.field === 'amount') {
            // Validate amount format using regex
            const amountRegex = /^\d+(\.\d{2})?$/;
            if (!amountRegex.test(field.value)) {
                // Show error message
                const fieldContainer = document.getElementById(currentStep.id);
                const statusElement = fieldContainer.querySelector('.field-status');
                
                if (statusElement) {
                    statusElement.textContent = 'Invalid amount format. Please enter a number with up to 2 decimal places (e.g., 100 or 100.00).';
                    statusElement.classList.add('error');
                }
                
                return false;
            }
        } else if (currentStep.field === 'dueDate') {
            // Validate date format
            const dateObj = new Date(field.value);
            if (isNaN(dateObj.getTime())) {
                // Show error message
                const fieldContainer = document.getElementById(currentStep.id);
                const statusElement = fieldContainer.querySelector('.field-status');
                
                if (statusElement) {
                    statusElement.textContent = 'Invalid date format. Please enter a valid date (YYYY-MM-DD).';
                    statusElement.classList.add('error');
                }
                
                return false;
            }
        }
        
        return true;
    };
    
    /**
     * Update the navigation buttons based on current step
     */
    const updateNavigationButtons = () => {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const submitBtn = document.getElementById('submit-btn');
        
        // Show/hide previous button
        if (prevBtn) {
            if (currentStepIndex > 0) {
                prevBtn.classList.remove('hidden');
            } else {
                prevBtn.classList.add('hidden');
            }
        }
        
        // Show/hide next and submit buttons
        if (nextBtn && submitBtn) {
            if (currentStepIndex === steps.length - 1) {
                nextBtn.classList.add('hidden');
                submitBtn.classList.remove('hidden');
            } else {
                nextBtn.classList.remove('hidden');
                submitBtn.classList.add('hidden');
            }
        }
    };
    
    /**
     * Update the progress bar based on current step
     */
    const updateProgressBar = () => {
        // Update progress bar width
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            const progress = ((currentStepIndex + 1) / steps.length) * 100;
            progressBar.style.width = `${progress}%`;
        }
        
        // Update step indicators
        const stepElements = document.querySelectorAll('.step');
        stepElements.forEach((element, index) => {
            if (index < currentStepIndex) {
                element.classList.add('completed');
                element.classList.remove('active');
            } else if (index === currentStepIndex) {
                element.classList.add('active');
                element.classList.remove('completed');
            } else {
                element.classList.remove('active', 'completed');
            }
        });
    };
    
    /**
     * Submit the invoice to the backend
     */
    const submitInvoice = async () => {
        // Validate the current step (notes)
        if (!validateCurrentStep()) {
            return;
        }
        
        try {
            // Show loading state
            VoiceRecognition.showLoading('Creating invoice...');
            
            // Collect form data
            const invoiceData = {
                customerName: document.getElementById('customerName').value,
                serviceDescription: document.getElementById('serviceDescription').value,
                amount: document.getElementById('amount').value,
                dueDate: document.getElementById('dueDate').value,
                notes: document.getElementById('notes').value
            };
            
            // Get auth token
            const token = Auth.getToken();
            
            if (!token) {
                throw new Error('Authentication token missing. Please connect to QuickBooks again.');
            }
            
            // Make API request to create invoice
            const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.CREATE_INVOICE_ENDPOINT}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(invoiceData)
            });
            
            // Parse response
            const data = await response.json();
            
            // Hide loading state
            VoiceRecognition.hideLoading();
            
            if (response.ok) {
                // Show success message
                showInvoiceResult(data.data);
            } else {
                // Check for auth error
                if (response.status === 401) {
                    Auth.handleAuthError({ status: 401 });
                } else {
                    // Show error message
                    showError(data.error.message || 'Error creating invoice');
                }
            }
        } catch (error) {
            console.error('Error creating invoice:', error);
            
            // Hide loading state
            VoiceRecognition.hideLoading();
            
            // Show error message
            showError(error.message || 'Error creating invoice');
        }
    };
    
    /**
     * Show the invoice result
     * 
     * @param {Object} invoiceData - Data of the created invoice
     */
    const showInvoiceResult = (invoiceData) => {
        // Hide invoice section
        document.getElementById('invoice-section').classList.add('hidden');
        
        // Show result section
        const resultSection = document.getElementById('result-section');
        resultSection.classList.remove('hidden');
        
        // Populate result data
        const invoiceResult = document.getElementById('invoice-result');
        
        if (invoiceResult) {
            invoiceResult.innerHTML = `
                <div class="result-item">
                    <strong>Invoice Number:</strong> ${invoiceData.invoiceNumber}
                </div>
                <div class="result-item">
                    <strong>Customer:</strong> ${invoiceData.customerName}
                </div>
                <div class="result-item">
                    <strong>Amount:</strong> $${parseFloat(invoiceData.amount).toFixed(2)}
                </div>
                <div class="result-item">
                    <strong>Created:</strong> ${new Date(invoiceData.createdAt).toLocaleString()}
                </div>
            `;
        }
    };
    
    /**
     * Show an error message
     * 
     * @param {String} message - Error message to display
     */
    const showError = (message) => {
        // Hide invoice section
        document.getElementById('invoice-section').classList.add('hidden');
        
        // Show error section
        const errorSection = document.getElementById('error-section');
        errorSection.classList.remove('hidden');
        
        // Set error message
        const errorMessage = document.getElementById('error-message');
        if (errorMessage) {
            errorMessage.textContent = message;
        }
    };
    
    /**
     * Reset the form to create a new invoice
     */
    const reset = () => {
        // Clear all form fields
        steps.forEach(step => {
            const field = document.getElementById(step.field);
            if (field) {
                field.value = '';
            }
            
            // Clear status messages
            const container = document.getElementById(step.id);
            if (container) {
                const statusElement = container.querySelector('.field-status');
                if (statusElement) {
                    statusElement.textContent = '';
                    statusElement.classList.remove('success', 'error', 'processing');
                }
            }
        });
        
        // Reset to first step
        currentStepIndex = 0;
        showStep(currentStepIndex);
        updateProgressBar();
        
        // Hide result and error sections
        document.getElementById('result-section').classList.add('hidden');
        document.getElementById('error-section').classList.add('hidden');
        
        // Show invoice section
        document.getElementById('invoice-section').classList.remove('hidden');
    };
    
    /**
     * Get a human-readable label for a field
     * 
     * @param {String} fieldId - ID of the field
     * @returns {String} Human-readable label
     */
    const getFieldLabel = (fieldId) => {
        switch (fieldId) {
            case 'customerName':
                return 'Customer name';
            case 'serviceDescription':
                return 'Service description';
            case 'amount':
                return 'Amount';
            case 'dueDate':
                return 'Due date';
            case 'notes':
                return 'Notes';
            default:
                return fieldId;
        }
    };
    
    // Public API
    return {
        init,
        reset
    };
})(); 