/**
 * Configuration settings for the application
 * Contains API endpoints and other configuration values
 */
const CONFIG = {
    // API endpoints
    API_BASE_URL: 'http://localhost:8081', // Changed from 3030 to match the actual server port
    PROCESS_VOICE_ENDPOINT: '/api/process-voice',
    REFINE_TEXT_ENDPOINT: '/api/refine-text',
    CREATE_INVOICE_ENDPOINT: '/api/invoices',
    OAUTH_CONNECT_ENDPOINT: '/oauth/connect',
    
    // Voice recognition settings
    VOICE_RECOGNITION: {
        LANGUAGE: 'en-US',
        MAX_ALTERNATIVES: 1,
        INTERIM_RESULTS: true,
        CONTINUOUS: false
    },
    
    // Local storage keys
    STORAGE_KEYS: {
        AUTH_TOKEN: 'qb_voice_invoice_auth_token'
    },
    
    // Timeouts (in milliseconds)
    TIMEOUTS: {
        VOICE_RECOGNITION: 10000, // 10 seconds
        API_REQUEST: 30000 // 30 seconds
    }
}; 