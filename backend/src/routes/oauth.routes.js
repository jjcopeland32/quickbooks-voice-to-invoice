/**
 * OAuth routes for QuickBooks integration
 */
const express = require('express');
const router = express.Router();
const OAuthClient = require('intuit-oauth');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { verifyToken } = require('../middleware/auth.middleware');

// QuickBooks OAuth client configuration
const oauthClient = new OAuthClient({
    clientId: process.env.QB_CLIENT_ID,
    clientSecret: process.env.QB_CLIENT_SECRET,
    environment: process.env.QB_ENVIRONMENT || 'sandbox',
    redirectUri: process.env.QB_REDIRECT_URI || 'http://localhost:3001/auth/qbo/callback',
});

/**
 * Initiate OAuth flow
 */
router.get('/qbo', verifyToken, (req, res) => {
    try {
        // Get the authorization URL
        const authUri = oauthClient.authorizeUri({
            scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId],
            state: req.user.id, // Store user ID in state for callback
        });
        
        // Redirect to QuickBooks authorization page
        res.redirect(authUri);
    } catch (error) {
        console.error('Error initiating OAuth flow:', error);
        res.status(500).json({ error: 'Failed to initiate QuickBooks connection' });
    }
});

/**
 * OAuth callback
 */
router.get('/qbo/callback', async (req, res) => {
    try {
        // Exchange authorization code for tokens
        const authResponse = await oauthClient.createToken(req.url);
        const tokens = authResponse.getJson();
        
        // Get user ID from state
        const userId = req.query.state;
        
        // Update user with QuickBooks tokens
        await User.findByIdAndUpdate(userId, {
            quickbooks: {
                connected: true,
                realmId: tokens.realmId,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                tokenType: tokens.token_type,
                expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
            }
        });
        
        // Redirect back to frontend
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard.html?qbo_connected=true`);
    } catch (error) {
        console.error('Error in OAuth callback:', error);
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard.html?qbo_error=true`);
    }
});

/**
 * Disconnect from QuickBooks
 */
router.post('/qbo/disconnect', verifyToken, async (req, res) => {
    try {
        // Update user to remove QuickBooks connection
        await User.findByIdAndUpdate(req.user.id, {
            'quickbooks.connected': false,
        });
        
        res.json({ success: true, message: 'Disconnected from QuickBooks' });
    } catch (error) {
        console.error('Error disconnecting from QuickBooks:', error);
        res.status(500).json({ error: 'Failed to disconnect from QuickBooks' });
    }
});

/**
 * Check QuickBooks connection status
 */
router.get('/qbo/status', verifyToken, async (req, res) => {
    try {
        // Get user with QuickBooks connection info
        const user = await User.findById(req.user.id);
        
        // Check if connected and token is valid
        const isConnected = user.quickbooks && user.quickbooks.connected;
        const isTokenValid = isConnected && new Date(user.quickbooks.expiresAt) > new Date();
        
        res.json({
            connected: isConnected,
            tokenValid: isTokenValid,
        });
    } catch (error) {
        console.error('Error checking QuickBooks status:', error);
        res.status(500).json({ error: 'Failed to check QuickBooks connection status' });
    }
});

module.exports = router; 