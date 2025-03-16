/**
 * Voice recognition module
 * Handles speech-to-text conversion using Web Speech API
 * with fallback to text input
 */
const VoiceRecognition = (() => {
    // Private variables
    let recognition = null;
    let isRecording = false;
    let currentButton = null;
    let currentField = null;
    let recognitionTimeout = null;
    
    /**
     * Initialize the voice recognition module
     * Sets up the Web Speech API if available
     */
    const init = () => {
        // Check if Web Speech API is supported
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            // Create speech recognition instance
            recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            
            // Configure recognition
            recognition.lang = CONFIG.VOICE_RECOGNITION.LANGUAGE;
            recognition.maxAlternatives = CONFIG.VOICE_RECOGNITION.MAX_ALTERNATIVES;
            recognition.interimResults = CONFIG.VOICE_RECOGNITION.INTERIM_RESULTS;
            recognition.continuous = CONFIG.VOICE_RECOGNITION.CONTINUOUS;
            
            // Set up event listeners
            setupRecognitionEvents();
            
            // Add click listeners to voice buttons
            setupVoiceButtons();
        } else {
            // Web Speech API not supported, show fallback UI
            showFallbackUI();
        }
    };
    
    /**
     * Set up event listeners for speech recognition
     */
    const setupRecognitionEvents = () => {
        // Result event - fired when speech is recognized
        recognition.onresult = (event) => {
            const result = event.results[0][0].transcript;
            
            // Update the input field with the recognized text
            if (currentField) {
                currentField.value = result;
                
                // Show processing status
                updateFieldStatus(currentField, 'Processing...', 'processing');
                
                // Process the voice input
                processVoiceInput(result, currentField.id);
            }
        };
        
        // Error event - fired when an error occurs
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            
            // Stop recording UI
            stopRecording();
            
            // Show error message
            if (currentField) {
                updateFieldStatus(currentField, `Error: ${event.error}. Try again or type manually.`, 'error');
            }
        };
        
        // End event - fired when recognition stops
        recognition.onend = () => {
            // Stop recording UI
            stopRecording();
            
            // Clear timeout
            if (recognitionTimeout) {
                clearTimeout(recognitionTimeout);
                recognitionTimeout = null;
            }
        };
    };
    
    /**
     * Set up click listeners for voice buttons
     */
    const setupVoiceButtons = () => {
        const voiceButtons = document.querySelectorAll('.voice-btn');
        
        voiceButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Get the field associated with this button
                const fieldId = button.dataset.field;
                const field = document.getElementById(fieldId);
                
                if (field) {
                    // If already recording for this field, stop
                    if (isRecording && currentField === field) {
                        stopRecognition();
                    } else {
                        // Start recording for this field
                        startRecognition(button, field);
                    }
                }
            });
        });
    };
    
    /**
     * Start speech recognition
     * 
     * @param {HTMLElement} button - The voice button that was clicked
     * @param {HTMLElement} field - The input field to populate with recognized text
     */
    const startRecognition = (button, field) => {
        // Stop any ongoing recognition
        if (isRecording) {
            stopRecognition();
        }
        
        // Set current button and field
        currentButton = button;
        currentField = field;
        
        try {
            // Start recognition
            recognition.start();
            isRecording = true;
            
            // Update UI to show recording state
            button.classList.add('recording');
            
            // Set timeout to automatically stop recording after a certain time
            recognitionTimeout = setTimeout(() => {
                stopRecognition();
            }, CONFIG.TIMEOUTS.VOICE_RECOGNITION);
            
            // Update field status
            updateFieldStatus(field, 'Listening...', 'processing');
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            updateFieldStatus(field, 'Error starting voice recognition. Try again or type manually.', 'error');
        }
    };
    
    /**
     * Stop speech recognition
     */
    const stopRecognition = () => {
        if (recognition && isRecording) {
            try {
                recognition.stop();
            } catch (error) {
                console.error('Error stopping speech recognition:', error);
            }
        }
        
        stopRecording();
    };
    
    /**
     * Update UI to stop recording state
     */
    const stopRecording = () => {
        isRecording = false;
        
        if (currentButton) {
            currentButton.classList.remove('recording');
        }
        
        // Clear timeout if it exists
        if (recognitionTimeout) {
            clearTimeout(recognitionTimeout);
            recognitionTimeout = null;
        }
    };
    
    /**
     * Process voice input with the backend API
     * 
     * @param {String} text - Recognized text from speech recognition
     * @param {String} fieldId - ID of the input field
     */
    const processVoiceInput = async (text, fieldId) => {
        try {
            // Show loading state
            showLoading('Processing voice input...');
            
            // Make API request to process voice input
            const response = await CORSProxy.fetch(`${CONFIG.API_BASE_URL}${CONFIG.PROCESS_VOICE_ENDPOINT}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text,
                    field: fieldId
                })
            });
            
            // Parse response
            const data = await response.json();
            
            // Hide loading state
            hideLoading();
            
            if (response.ok) {
                // Update the field with the processed value
                const field = document.getElementById(fieldId);
                if (field) {
                    field.value = data.data.value;
                    updateFieldStatus(field, 'Voice input processed successfully!', 'success');
                }
            } else {
                // Show error message
                const field = document.getElementById(fieldId);
                if (field) {
                    updateFieldStatus(field, `Error: ${data.error.message}. Try again or type manually.`, 'error');
                }
            }
        } catch (error) {
            console.error('Error processing voice input:', error);
            
            // Hide loading state
            hideLoading();
            
            // Show error message
            const field = document.getElementById(fieldId);
            if (field) {
                updateFieldStatus(field, 'Error processing voice input. Try again or type manually.', 'error');
            }
        }
    };
    
    /**
     * Update the status message for a field
     * 
     * @param {HTMLElement} field - The input field
     * @param {String} message - Status message to display
     * @param {String} type - Type of status (success, error, processing)
     */
    const updateFieldStatus = (field, message, type) => {
        // Find the status element for this field
        const fieldContainer = field.closest('.field-container');
        if (fieldContainer) {
            const statusElement = fieldContainer.querySelector('.field-status');
            if (statusElement) {
                // Update the status message
                statusElement.textContent = message;
                
                // Remove existing status classes
                statusElement.classList.remove('success', 'error', 'processing');
                
                // Add the new status class
                if (type) {
                    statusElement.classList.add(type);
                }
            }
        }
    };
    
    /**
     * Show fallback UI when Web Speech API is not supported
     */
    const showFallbackUI = () => {
        // Hide all voice buttons
        const voiceButtons = document.querySelectorAll('.voice-btn');
        voiceButtons.forEach(button => {
            button.style.display = 'none';
        });
        
        // Show message about fallback
        const fallbackMessage = document.createElement('div');
        fallbackMessage.className = 'fallback-message';
        fallbackMessage.textContent = 'Voice recognition is not supported in your browser. Please type your information manually.';
        
        const invoiceSection = document.getElementById('invoice-section');
        if (invoiceSection) {
            invoiceSection.insertBefore(fallbackMessage, invoiceSection.firstChild);
        }
    };
    
    /**
     * Show loading overlay
     * 
     * @param {String} message - Loading message to display
     */
    const showLoading = (message) => {
        const loadingOverlay = document.getElementById('loading-overlay');
        const loadingMessage = document.getElementById('loading-message');
        
        if (loadingMessage) {
            loadingMessage.textContent = message || 'Loading...';
        }
        
        if (loadingOverlay) {
            loadingOverlay.classList.remove('hidden');
        }
    };
    
    /**
     * Hide loading overlay
     */
    const hideLoading = () => {
        const loadingOverlay = document.getElementById('loading-overlay');
        
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
    };
    
    // Public API
    return {
        init,
        startRecognition,
        stopRecognition,
        showLoading,
        hideLoading
    };
})(); 