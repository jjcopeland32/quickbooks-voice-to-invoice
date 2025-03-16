const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const { validateJWT } = require('../middleware/jwt.middleware');
const { validateInvoiceInput } = require('../middleware/validation.middleware');
const OAuthClient = require('intuit-oauth');
const User = require('../models/user.model');
const { verifyToken } = require('../middleware/auth.middleware');

// Initialize OAuth client
const oauthClient = new OAuthClient({
    clientId: process.env.QUICKBOOKS_CLIENT_ID,
    clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET,
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
    redirectUri: process.env.QUICKBOOKS_REDIRECT_URI,
});

/**
 * Helper function to refresh tokens if needed
 */
const refreshTokensIfNeeded = async (user) => {
    // Check if tokens need refreshing
    const now = new Date();
    if (user.quickbooks.expiresAt && user.quickbooks.expiresAt > now) {
        // Tokens are still valid
        oauthClient.setToken({
            access_token: user.quickbooks.accessToken,
            refresh_token: user.quickbooks.refreshToken,
            token_type: user.quickbooks.tokenType,
            expires_in: Math.floor((user.quickbooks.expiresAt - Date.now()) / 1000),
        });
        return;
    }
    
    // Refresh tokens
    oauthClient.setToken({
        access_token: user.quickbooks.accessToken,
        refresh_token: user.quickbooks.refreshToken,
        token_type: user.quickbooks.tokenType,
        expires_in: -1, // Force refresh
    });
    
    const authResponse = await oauthClient.refresh();
    const tokens = authResponse.getJson();
    
    // Update user
    user.quickbooks = {
        connected: true,
        realmId: user.quickbooks.realmId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenType: tokens.token_type,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    };
    
    await user.save();
};

/**
 * @route POST /api/invoices
 * @desc Create an invoice in QuickBooks
 * @access Private (requires JWT)
 */
router.post('/invoices', validateJWT, validateInvoiceInput, invoiceController.createInvoice);

/**
 * @route GET /api/invoices
 * @desc Get user's invoices from QuickBooks
 * @access Private (requires JWT)
 */
router.get('/invoices', validateJWT, invoiceController.getInvoices);

/**
 * Get customers from QuickBooks
 */
router.get('/customers', verifyToken, async (req, res) => {
    try {
        // Find user
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check if connected to QuickBooks
        if (!user.quickbooks?.connected) {
            return res.status(400).json({ error: 'Not connected to QuickBooks' });
        }
        
        // Refresh tokens if needed
        await refreshTokensIfNeeded(user);
        
        // Make API request to QuickBooks
        const response = await oauthClient.makeApiCall({
            url: `${oauthClient.environment === 'sandbox' ? 
                'https://sandbox-quickbooks.api.intuit.com' : 
                'https://quickbooks.api.intuit.com'}/v3/company/${user.quickbooks.realmId}/query`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/text',
            },
            body: 'SELECT * FROM Customer MAXRESULTS 1000',
        });
        
        // Parse response
        const data = response.getJson();
        
        // Return customers
        res.json(data.QueryResponse.Customer || []);
    } catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({ error: 'Failed to get customers' });
    }
});

/**
 * Get items from QuickBooks
 */
router.get('/items', verifyToken, async (req, res) => {
    try {
        // Find user
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check if connected to QuickBooks
        if (!user.quickbooks?.connected) {
            return res.status(400).json({ error: 'Not connected to QuickBooks' });
        }
        
        // Refresh tokens if needed
        await refreshTokensIfNeeded(user);
        
        // Make API request to QuickBooks
        const response = await oauthClient.makeApiCall({
            url: `${oauthClient.environment === 'sandbox' ? 
                'https://sandbox-quickbooks.api.intuit.com' : 
                'https://quickbooks.api.intuit.com'}/v3/company/${user.quickbooks.realmId}/query`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/text',
            },
            body: 'SELECT * FROM Item MAXRESULTS 1000',
        });
        
        // Parse response
        const data = response.getJson();
        
        // Return items
        res.json(data.QueryResponse.Item || []);
    } catch (error) {
        console.error('Get items error:', error);
        res.status(500).json({ error: 'Failed to get items' });
    }
});

/**
 * Create invoice in QuickBooks
 */
router.post('/create', verifyToken, async (req, res) => {
    try {
        // Find user
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check if connected to QuickBooks
        if (!user.quickbooks?.connected) {
            return res.status(400).json({ error: 'Not connected to QuickBooks' });
        }
        
        // Validate request body
        const { customerId, items, memo } = req.body;
        
        if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Invalid request body' });
        }
        
        // Refresh tokens if needed
        await refreshTokensIfNeeded(user);
        
        // Prepare invoice data
        const invoiceData = {
            Line: items.map((item, index) => ({
                Id: index + 1,
                LineNum: index + 1,
                Description: item.description,
                Amount: item.amount,
                DetailType: 'SalesItemLineDetail',
                SalesItemLineDetail: {
                    ItemRef: {
                        value: item.itemId,
                    },
                    Qty: item.quantity,
                    UnitPrice: item.unitPrice,
                },
            })),
            CustomerRef: {
                value: customerId,
            },
        };
        
        // Add memo if provided
        if (memo) {
            invoiceData.PrivateNote = memo;
        }
        
        // Make API request to QuickBooks
        const response = await oauthClient.makeApiCall({
            url: `${oauthClient.environment === 'sandbox' ? 
                'https://sandbox-quickbooks.api.intuit.com' : 
                'https://quickbooks.api.intuit.com'}/v3/company/${user.quickbooks.realmId}/invoice`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(invoiceData),
        });
        
        // Parse response
        const data = response.getJson();
        
        // Return invoice
        res.status(201).json(data.Invoice);
    } catch (error) {
        console.error('Create invoice error:', error);
        res.status(500).json({ error: 'Failed to create invoice' });
    }
});

/**
 * Process voice command to create invoice
 */
router.post('/voice', verifyToken, async (req, res) => {
    try {
        // Find user
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check if connected to QuickBooks
        if (!user.quickbooks?.connected) {
            return res.status(400).json({ error: 'Not connected to QuickBooks' });
        }
        
        // Validate request body
        const { transcript } = req.body;
        
        if (!transcript) {
            return res.status(400).json({ error: 'No transcript provided' });
        }
        
        // TODO: Process voice command using NLP
        // This is a placeholder for the actual NLP processing
        // In a real implementation, you would use a service like OpenAI's GPT
        // to extract customer, items, and other invoice details from the transcript
        
        // For now, return the transcript for debugging
        res.json({
            transcript,
            message: 'Voice command processing not yet implemented',
        });
    } catch (error) {
        console.error('Process voice command error:', error);
        res.status(500).json({ error: 'Failed to process voice command' });
    }
});

module.exports = router; 