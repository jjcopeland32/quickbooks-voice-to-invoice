/**
 * Voice Recognition Module
 * Handles all speech-to-text functionality and provides visual feedback
 */
const VoiceRecognition = (() => {
    // Private variables
    let recognition;
    let isRecording = false;
    let currentField = null;
    let micButtons;
    
    /**
     * Initialize the speech recognition capability
     */
    function init() {
        // Check if browser supports Speech Recognition
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.error('Speech recognition is not supported in this browser');
            disableVoiceFeatures();
            return;
        }
        
        // Create speech recognition instance
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        
        // Configure recognition settings
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        // Set up event handlers
        setupRecognitionEvents();
        
        // Find all voice buttons and attach event listeners
        micButtons = document.querySelectorAll('.voice-btn');
        micButtons.forEach(button => {
            button.addEventListener('click', handleMicButtonClick);
            
            // Replace emoji with SVG icon for better appearance
            const micIcon = button.querySelector('.mic-icon');
            if (micIcon) {
                micIcon.innerHTML = createMicrophoneSVG();
            }
        });
        
        // Preload the animated mic svg for better performance
        preloadAnimatedMic();
        
        console.log('Voice recognition initialized');
    }
    
    /**
     * Preload animated microphone SVG
     */
    function preloadAnimatedMic() {
        fetch('assets/mic-wave.svg')
            .then(response => response.text())
            .then(svgContent => {
                // Store the SVG content for later use
                window.animatedMicSvg = svgContent;
            })
            .catch(error => {
                console.error('Error loading animated microphone SVG:', error);
            });
    }
    
    /**
     * Set up event handlers for speech recognition
     */
    function setupRecognitionEvents() {
        recognition.onstart = () => {
            isRecording = true;
            updateUIForRecording(true);
        };
        
        recognition.onend = () => {
            isRecording = false;
            updateUIForRecording(false);
        };
        
        recognition.onresult = (event) => {
            if (!currentField) return;
            
            // Get the transcript
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');
            
            // Update the input field with the transcript
            const inputField = document.getElementById(currentField);
            
            if (inputField) {
                inputField.value = transcript;
                inputField.classList.add('processing');
                
                // Add loading indicator to field status
                const fieldStatus = inputField.parentElement.nextElementSibling;
                if (fieldStatus && fieldStatus.classList.contains('field-status')) {
                    fieldStatus.innerHTML = '<svg class="spinner" width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" stroke-dasharray="30 30" stroke-dashoffset="0"><animateTransform attributeName="transform" type="rotate" begin="0s" dur="1s" from="0 12 12" to="360 12 12" repeatCount="indefinite"/></circle></svg> Processing text...';
                    fieldStatus.classList.add('show');
                }
                
                // Process the transcript (in a real app, call your API endpoint)
                processTranscript(transcript, currentField);
            }
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            isRecording = false;
            updateUIForRecording(false);
            
            if (currentField) {
                const inputField = document.getElementById(currentField);
                const fieldStatus = inputField.parentElement.nextElementSibling;
                
                if (fieldStatus && fieldStatus.classList.contains('field-status')) {
                    fieldStatus.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Error: ${getErrorMessage(event.error)}`;
                    fieldStatus.classList.add('error', 'show');
                    
                    setTimeout(() => {
                        fieldStatus.innerHTML = '';
                        fieldStatus.classList.remove('error', 'show');
                    }, 4000);
                }
            }
        };
    }
    
    /**
     * Process the transcript from voice recognition
     */
    function processTranscript(transcript, fieldId) {
        const inputField = document.getElementById(fieldId);
        const fieldStatus = inputField.parentElement.nextElementSibling;
        
        // In a real app, you would call your API here
        // For demo purposes, we'll simulate an API call with setTimeout
        
        // For amount field, format as currency if it looks like a number
        if (fieldId === 'amount') {
            // Remove non-numeric characters except decimal point
            const cleanedText = transcript.replace(/[^0-9.]/g, '');
            
            if (!isNaN(parseFloat(cleanedText))) {
                inputField.value = parseFloat(cleanedText).toFixed(2);
            }
        }
        
        // For dueDate field, try to format as date
        if (fieldId === 'dueDate') {
            // Simple date parsing attempt - in a real app, use a more robust solution
            try {
                // Try to convert common date phrases
                if (transcript.includes('today')) {
                    const today = new Date();
                    inputField.value = formatDate(today);
                } else if (transcript.includes('tomorrow')) {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    inputField.value = formatDate(tomorrow);
                } else if (transcript.includes('next week')) {
                    const nextWeek = new Date();
                    nextWeek.setDate(nextWeek.getDate() + 7);
                    inputField.value = formatDate(nextWeek);
                } else if (transcript.includes('next month')) {
                    const nextMonth = new Date();
                    nextMonth.setMonth(nextMonth.getMonth() + 1);
                    inputField.value = formatDate(nextMonth);
                }
            } catch (error) {
                console.error('Error formatting date:', error);
            }
        }
        
        // Simulate API processing
        setTimeout(() => {
            inputField.classList.remove('processing');
            inputField.classList.add('success');
            
            if (fieldStatus) {
                fieldStatus.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Text processed successfully!';
                fieldStatus.classList.add('success', 'show');
            }
            
            // Reset success state after a delay
            setTimeout(() => {
                inputField.classList.remove('success');
                if (fieldStatus) {
                    fieldStatus.innerHTML = '';
                    fieldStatus.classList.remove('success', 'show');
                }
            }, 3000);
            
            // Trigger validation for the form step
            if (typeof InvoiceForm !== 'undefined' && InvoiceForm.validateCurrentField) {
                InvoiceForm.validateCurrentField();
            }
        }, 1500);
    }
    
    /**
     * Format a date as YYYY-MM-DD
     */
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    /**
     * Handle click on microphone button
     */
    function handleMicButtonClick(event) {
        const button = event.currentTarget;
        const fieldId = button.dataset.field;
        
        if (!fieldId) {
            console.error('No field ID specified for voice button');
            return;
        }
        
        // Check if already recording
        if (isRecording) {
            stopRecording();
            return;
        }
        
        // Set the current field and start recording
        currentField = fieldId;
        startRecording();
        
        // Set the active field container
        const fieldContainers = document.querySelectorAll('.field-container');
        fieldContainers.forEach(container => {
            container.classList.remove('active');
        });
        
        const activeContainer = button.closest('.field-container');
        if (activeContainer) {
            activeContainer.classList.add('active');
        }
    }
    
    /**
     * Start the recording process
     */
    function startRecording() {
        try {
            recognition.start();
        } catch (error) {
            console.error('Error starting recognition:', error);
            
            // If recognition is already started, stop it first
            if (error.name === 'InvalidStateError') {
                recognition.stop();
                setTimeout(() => {
                    recognition.start();
                }, 200);
            }
        }
    }
    
    /**
     * Stop the recording process
     */
    function stopRecording() {
        try {
            recognition.stop();
        } catch (error) {
            console.error('Error stopping recognition:', error);
        }
    }
    
    /**
     * Update UI to reflect recording state
     */
    function updateUIForRecording(isRecording) {
        micButtons.forEach(button => {
            if (button.dataset.field === currentField) {
                if (isRecording) {
                    button.classList.add('recording');
                    
                    // If we have the animated mic SVG, replace the static one
                    if (window.animatedMicSvg) {
                        const micIcon = button.querySelector('.mic-icon');
                        if (micIcon) {
                            // Store the original SVG for later restoration
                            if (!button.dataset.originalSvg) {
                                button.dataset.originalSvg = micIcon.innerHTML;
                            }
                            
                            // Set the animated SVG
                            micIcon.innerHTML = window.animatedMicSvg;
                            
                            // Activate the sound waves
                            try {
                                const svgDoc = micIcon.querySelector('svg');
                                if (svgDoc && typeof activateWaves === 'function') {
                                    activateWaves();
                                } else {
                                    const waves = micIcon.querySelector('.sound-waves');
                                    if (waves) waves.classList.add('active');
                                }
                            } catch (e) {
                                console.error('Error activating sound waves:', e);
                            }
                        }
                    }
                } else {
                    button.classList.remove('recording');
                    
                    // Restore the original SVG if available
                    if (button.dataset.originalSvg) {
                        const micIcon = button.querySelector('.mic-icon');
                        if (micIcon) {
                            // Try to deactivate sound waves first
                            try {
                                const svgDoc = micIcon.querySelector('svg');
                                if (svgDoc && typeof deactivateWaves === 'function') {
                                    deactivateWaves();
                                }
                            } catch (e) {
                                console.error('Error deactivating sound waves:', e);
                            }
                            
                            // After a small delay, restore original SVG
                            setTimeout(() => {
                                micIcon.innerHTML = button.dataset.originalSvg;
                            }, 300);
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Disable voice features if not supported
     */
    function disableVoiceFeatures() {
        micButtons = document.querySelectorAll('.voice-btn');
        micButtons.forEach(button => {
            button.disabled = true;
            button.classList.add('disabled');
            button.title = 'Speech recognition is not supported in this browser';
            
            const fieldStatus = button.closest('.input-group').nextElementSibling;
            if (fieldStatus && fieldStatus.classList.contains('field-status')) {
                fieldStatus.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Voice recognition is not supported in this browser. Please type manually.';
                fieldStatus.classList.add('error', 'show');
            }
        });
    }
    
    /**
     * Get human-readable error message
     */
    function getErrorMessage(error) {
        switch (error) {
            case 'no-speech':
                return 'No speech was detected. Please try again.';
            case 'audio-capture':
                return 'Could not access your microphone. Check your settings.';
            case 'not-allowed':
                return 'Microphone access was denied. Please allow access.';
            case 'network':
                return 'Network error. Please check your connection.';
            case 'aborted':
                return 'Recording was aborted.';
            default:
                return 'An unknown error occurred. Please try again.';
        }
    }
    
    /**
     * Create SVG icon for microphone button
     */
    function createMicrophoneSVG() {
        return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 1C10.3431 1 9 2.34315 9 4V12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12V4C15 2.34315 13.6569 1 12 1Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M19 10V12C19 16.4183 15.4183 20 11 20M5 10V12C5 16.4183 8.58172 20 13 20M12 20V23M8 23H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
    }
    
    // Public API
    return {
        init,
        startRecording,
        stopRecording
    };
})();

// Export for use in other modules
window.VoiceRecognition = VoiceRecognition; 