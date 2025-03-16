/**
 * Dashboard functionality for QuickBooks Voice-to-Invoice application
 */

// DOM elements
const userNameElement = document.getElementById('user-name');
const logoutButton = document.getElementById('logout-btn');
const connectQuickBooksButton = document.getElementById('connect-quickbooks-btn');
const disconnectQuickBooksButton = document.getElementById('disconnect-quickbooks-btn');
const notConnectedSection = document.getElementById('not-connected');
const connectedSection = document.getElementById('connected');
const voiceCommandsSection = document.getElementById('voice-commands');
const recentInvoicesSection = document.getElementById('recent-invoices');
const startRecordingButton = document.getElementById('start-recording-btn');
const stopRecordingButton = document.getElementById('stop-recording-btn');
const recordingStatusElement = document.getElementById('recording-status');
const transcriptContainer = document.getElementById('transcript-container');
const transcriptElement = document.getElementById('transcript');
const alertModal = document.getElementById('alert-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalOkButton = document.getElementById('modal-ok-btn');
const closeModalButton = document.querySelector('.close-modal');

// Speech recognition
let recognition;
let isRecording = false;

// Check if user is authenticated
document.addEventListener('DOMContentLoaded', async () => {
    if (!isAuthenticated()) {
        window.location.href = '/index.html';
        return;
    }
    
    // Set user name
    const user = getUser();
    if (user) {
        userNameElement.textContent = user.name;
    }
    
    // Check QuickBooks connection
    await checkQuickBooksConnectionStatus();
    
    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('success')) {
        showAlert('Success', 'QuickBooks connected successfully!');
        await checkQuickBooksConnectionStatus();
    } else if (urlParams.has('error')) {
        showAlert('Error', 'Failed to connect to QuickBooks. Please try again.');
    }
    
    // Initialize speech recognition
    initSpeechRecognition();
});

// Logout
logoutButton.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
});

// Connect to QuickBooks
connectQuickBooksButton.addEventListener('click', () => {
    connectToQuickBooks();
});

// Disconnect from QuickBooks
disconnectQuickBooksButton.addEventListener('click', async () => {
    try {
        await disconnectFromQuickBooks();
        await checkQuickBooksConnectionStatus();
        showAlert('Success', 'Disconnected from QuickBooks successfully!');
    } catch (error) {
        showAlert('Error', 'Failed to disconnect from QuickBooks. Please try again.');
    }
});

// Start recording
startRecordingButton.addEventListener('click', () => {
    startRecording();
});

// Stop recording
stopRecordingButton.addEventListener('click', () => {
    stopRecording();
});

// Modal OK button
modalOkButton.addEventListener('click', () => {
    closeModal();
});

// Close modal
closeModalButton.addEventListener('click', () => {
    closeModal();
});

/**
 * Check QuickBooks connection status
 */
async function checkQuickBooksConnectionStatus() {
    try {
        const response = await fetch('/auth/qbo/status', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
            },
        });
        
        const data = await response.json();
        
        if (response.ok && data.connected) {
            // Show connected UI
            notConnectedSection.style.display = 'none';
            connectedSection.style.display = 'block';
            voiceCommandsSection.style.display = 'block';
            recentInvoicesSection.style.display = 'block';
            
            // Load recent invoices
            loadRecentInvoices();
        } else {
            // Show not connected UI
            notConnectedSection.style.display = 'block';
            connectedSection.style.display = 'none';
            voiceCommandsSection.style.display = 'none';
            recentInvoicesSection.style.display = 'none';
        }
    } catch (error) {
        console.error('Error checking QuickBooks connection:', error);
        
        // Show not connected UI
        notConnectedSection.style.display = 'block';
        connectedSection.style.display = 'none';
        voiceCommandsSection.style.display = 'none';
        recentInvoicesSection.style.display = 'none';
    }
}

/**
 * Load recent invoices
 */
async function loadRecentInvoices() {
    try {
        // TODO: Implement loading recent invoices from QuickBooks
        // This is a placeholder for the actual implementation
    } catch (error) {
        console.error('Error loading recent invoices:', error);
    }
}

/**
 * Initialize speech recognition
 */
function initSpeechRecognition() {
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showAlert('Error', 'Your browser does not support speech recognition. Please use Chrome or Edge.');
        startRecordingButton.disabled = true;
        return;
    }
    
    // Create speech recognition instance
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    
    // Configure recognition
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    // Handle results
    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        // Update transcript
        transcriptElement.innerHTML = finalTranscript + '<span class="interim">' + interimTranscript + '</span>';
    };
    
    // Handle errors
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        if (event.error === 'not-allowed') {
            showAlert('Error', 'Microphone access denied. Please allow microphone access in your browser settings.');
        } else {
            showAlert('Error', `Speech recognition error: ${event.error}`);
        }
        
        stopRecording();
    };
    
    // Handle end of recognition
    recognition.onend = () => {
        if (isRecording) {
            // Restart recognition if it ended unexpectedly
            recognition.start();
        } else {
            // Update UI
            startRecordingButton.style.display = 'block';
            stopRecordingButton.style.display = 'none';
            recordingStatusElement.style.display = 'none';
        }
    };
}

/**
 * Start recording
 */
function startRecording() {
    try {
        // Start recognition
        recognition.start();
        isRecording = true;
        
        // Update UI
        startRecordingButton.style.display = 'none';
        stopRecordingButton.style.display = 'block';
        recordingStatusElement.style.display = 'block';
        transcriptContainer.style.display = 'block';
        transcriptElement.innerHTML = '';
    } catch (error) {
        console.error('Error starting recording:', error);
        showAlert('Error', 'Failed to start recording. Please try again.');
    }
}

/**
 * Stop recording
 */
function stopRecording() {
    try {
        // Stop recognition
        recognition.stop();
        isRecording = false;
        
        // Update UI
        startRecordingButton.style.display = 'block';
        stopRecordingButton.style.display = 'none';
        recordingStatusElement.style.display = 'none';
        
        // Process transcript
        const transcript = transcriptElement.textContent.trim();
        if (transcript) {
            processVoiceCommand(transcript);
        }
    } catch (error) {
        console.error('Error stopping recording:', error);
        showAlert('Error', 'Failed to stop recording. Please try again.');
    }
}

/**
 * Process voice command
 * @param {string} transcript - Voice command transcript
 */
async function processVoiceCommand(transcript) {
    try {
        // Send transcript to server for processing
        const response = await fetch('/api/invoices/voice', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`,
            },
            body: JSON.stringify({ transcript }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to process voice command');
        }
        
        // Show result
        showAlert('Voice Command Received', 'Your voice command is being processed. This feature is not fully implemented yet.');
    } catch (error) {
        console.error('Error processing voice command:', error);
        showAlert('Error', 'Failed to process voice command. Please try again.');
    }
}

/**
 * Show alert modal
 * @param {string} title - Alert title
 * @param {string} message - Alert message
 */
function showAlert(title, message) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    alertModal.style.display = 'block';
}

/**
 * Close alert modal
 */
function closeModal() {
    alertModal.style.display = 'none';
} 