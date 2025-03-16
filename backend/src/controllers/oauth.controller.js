const { getAuthorizationUrl, getTokenFromCode, revokeToken } = require('../config/quickbooks.config');
const { generateToken } = require('../middleware/jwt.middleware');
const User = require('../models/user.model');

/**
 * Initiate the QuickBooks OAuth2 flow
 * Redirects the user to QuickBooks authorization page
 * 
 * @route GET /auth/qbo
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {void}
 */
const initiateAuth = (req, res) => {
  try {
    // Get user ID from JWT
    const userId = req.user ? req.user.id : null;
    
    // Create state parameter with user ID
    const state = Buffer.from(JSON.stringify({
      userId,
      redirect: req.query.redirect || '/',
      timestamp: Date.now()
    })).toString('base64');
    
    // Get the authorization URL
    const authUrl = getAuthorizationUrl(state);
    
    // Redirect to QuickBooks authorization page
    return res.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating QuickBooks OAuth flow:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to initiate QuickBooks authorization',
        status: 500,
        details: error.message
      }
    });
  }
};

/**
 * Handle the OAuth callback from QuickBooks
 * Exchanges the authorization code for an access token
 * 
 * @route GET /auth/qbo/callback
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {void}
 */
const handleCallback = async (req, res) => {
  try {
    const { code, realmId, state } = req.query;
    
    if (!code || !realmId) {
      return res.status(400).json({
        error: {
          message: 'Missing required parameters from QuickBooks callback',
          status: 400
        }
      });
    }
    
    // Exchange the authorization code for a token
    const tokenResponse = await getTokenFromCode(code);
    
    // Parse state to get user ID and redirect URL
    let userId = null;
    let redirectUrl = '/';
    
    try {
      if (state) {
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        userId = stateData.userId;
        redirectUrl = stateData.redirect || '/';
      }
    } catch (err) {
      console.error('Error parsing state data:', err);
    }
    
    // If no user ID, redirect to login with error
    if (!userId) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=User not authenticated. Please login.`);
    }
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=User not found.`);
    }
    
    // Encrypt tokens
    const encryptedAccessToken = user.encryptToken(tokenResponse.token.access_token);
    const encryptedRefreshToken = user.encryptToken(tokenResponse.token.refresh_token);
    
    // Update user with QuickBooks info
    user.qbo.connected = true;
    user.qbo.realmId = realmId;
    user.qbo.accessToken = encryptedAccessToken.token;
    user.qbo.accessTokenIV = encryptedAccessToken.iv;
    user.qbo.refreshToken = encryptedRefreshToken.token;
    user.qbo.refreshTokenIV = encryptedRefreshToken.iv;
    user.qbo.expiresAt = tokenResponse.token.expires_at;
    
    await user.save();
    
    // Create new JWT with updated user info
    const jwt = generateToken({
      id: user._id,
      email: user.email
    });
    
    // Redirect back to frontend with the JWT
    return res.redirect(`${process.env.FRONTEND_URL}${redirectUrl}?token=${jwt}`);
  } catch (error) {
    console.error('Error handling QuickBooks OAuth callback:', error);
    return res.redirect(`${process.env.FRONTEND_URL}/error?message=${encodeURIComponent('Failed to complete QuickBooks authorization')}`);
  }
};

/**
 * Revoke QuickBooks connection
 * Revokes the token and removes QuickBooks info from user
 * 
 * @route DELETE /auth/qbo
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Success message
 */
const revokeQboConnection = async (req, res) => {
  try {
    // Get user ID from JWT
    const userId = req.user.id;
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          status: 404
        }
      });
    }
    
    // If user has QuickBooks connection
    if (user.qbo.connected && user.qbo.accessToken) {
      try {
        // Get access token
        const accessToken = user.decryptToken(
          user.qbo.accessToken,
          user.qbo.accessTokenIV
        );
        
        // Revoke token
        await revokeToken(accessToken);
      } catch (error) {
        console.error('Error revoking token:', error);
        // Continue even if revoke fails
      }
    }
    
    // Reset QuickBooks info
    user.qbo.connected = false;
    user.qbo.realmId = null;
    user.qbo.accessToken = null;
    user.qbo.accessTokenIV = null;
    user.qbo.refreshToken = null;
    user.qbo.refreshTokenIV = null;
    user.qbo.expiresAt = null;
    
    await user.save();
    
    return res.status(200).json({
      data: {
        message: 'QuickBooks connection revoked successfully'
      }
    });
  } catch (error) {
    console.error('Error revoking QuickBooks connection:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to revoke QuickBooks connection',
        status: 500,
        details: error.message
      }
    });
  }
};

module.exports = {
  initiateAuth,
  handleCallback,
  revokeQboConnection
}; 