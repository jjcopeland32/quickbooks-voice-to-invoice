/**
 * QuickBooks OAuth routes
 */
const express = require('express');
const router = express.Router();
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
 * Initiate OAuth flow
 */
router.get('/qbo', verifyToken, (req, res) => {
    try {
        // Generate authorization URL
        const authUri = oauthClient.authorizeUri({
            scope: [OAuthClient.scopes.Accounting],
            state: req.user.id, // Store user ID in state for verification
        });
        
        // Redirect to QuickBooks authorization page
        res.redirect(authUri);
    } catch (error) {
        console.error('QuickBooks OAuth initiation error:', error);
        res.redirect('/dashboard.html?error=quickbooks_connection_failed');
    }
});

/**
 * OAuth callback
 */
router.get('/qbo/callback', async (req, res) => {
    try {
        // Extract authorization code and state from URL
        const { code, state, realmId } = req.query;
        
        if (!code || !state || !realmId) {
            throw new Error('Missing required parameters');
        }
        
        // Exchange authorization code for tokens
        const authResponse = await oauthClient.createToken(req.url);
        const tokens = authResponse.getJson();
        
        // Find user by ID (stored in state)
        const user = await User.findById(state);
        if (!user) {
            throw new Error('User not found');
        }
        
        // Update user with QuickBooks connection info
        user.quickbooks = {
            connected: true,
            realmId,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            tokenType: tokens.token_type,
            expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        };
        
        await user.save();
        
        // Redirect to dashboard with success message
        res.redirect('/dashboard.html?success=quickbooks_connected');
    } catch (error) {
        console.error('QuickBooks OAuth callback error:', error);
        res.redirect('/dashboard.html?error=quickbooks_connection_failed');
    }
});

/**
 * Check connection status
 */
router.get('/qbo/status', verifyToken, async (req, res) => {
    try {
        // Find user
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Return connection status
        res.json({
            connected: user.quickbooks?.connected || false,
            realmId: user.quickbooks?.realmId,
        });
    } catch (error) {
        console.error('QuickBooks connection status error:', error);
        res.status(500).json({ error: 'Failed to check QuickBooks connection' });
    }
});

/**
 * Disconnect from QuickBooks
 */
router.post('/qbo/disconnect', verifyToken, async (req, res) => {
    try {
        // Find user
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check if connected
        if (!user.quickbooks?.connected) {
            return res.status(400).json({ error: 'Not connected to QuickBooks' });
        }
        
        // Revoke tokens
        if (user.quickbooks.accessToken) {
            try {
                oauthClient.setToken({
                    access_token: user.quickbooks.accessToken,
                    refresh_token: user.quickbooks.refreshToken,
                    token_type: user.quickbooks.tokenType,
                    expires_in: Math.floor((user.quickbooks.expiresAt - Date.now()) / 1000),
                });
                
                await oauthClient.revokeToken();
            } catch (revokeError) {
                console.error('Error revoking QuickBooks token:', revokeError);
                // Continue with disconnection even if revoke fails
            }
        }
        
        // Update user
        user.quickbooks = {
            connected: false,
        };
        
        await user.save();
        
        // Return success
        res.json({ success: true });
    } catch (error) {
        console.error('QuickBooks disconnect error:', error);
        res.status(500).json({ error: 'Failed to disconnect from QuickBooks' });
    }
});

/**
 * Refresh tokens
 */
router.post('/qbo/refresh', verifyToken, async (req, res) => {
    try {
        // Find user
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check if connected
        if (!user.quickbooks?.connected) {
            return res.status(400).json({ error: 'Not connected to QuickBooks' });
        }
        
        // Check if tokens need refreshing
        const now = new Date();
        if (user.quickbooks.expiresAt && user.quickbooks.expiresAt > now) {
            return res.json({
                connected: true,
                realmId: user.quickbooks.realmId,
            });
        }
        
        // Set tokens
        oauthClient.setToken({
            access_token: user.quickbooks.accessToken,
            refresh_token: user.quickbooks.refreshToken,
            token_type: user.quickbooks.tokenType,
            expires_in: Math.floor((user.quickbooks.expiresAt - Date.now()) / 1000),
        });
        
        // Refresh tokens
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
        
        // Return success
        res.json({
            connected: true,
            realmId: user.quickbooks.realmId,
        });
    } catch (error) {
        console.error('QuickBooks token refresh error:', error);
        
        // If refresh fails, disconnect
        try {
            // Find user
            const user = await User.findById(req.user.id);
            if (user) {
                user.quickbooks = {
                    connected: false,
                };
                await user.save();
            }
        } catch (disconnectError) {
            console.error('Error disconnecting after failed refresh:', disconnectError);
        }
        
        res.status(500).json({ error: 'Failed to refresh QuickBooks tokens' });
    }
});

module.exports = router; 