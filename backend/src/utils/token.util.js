const User = require('../models/user.model');
const { refreshAccessToken } = require('../config/quickbooks.config');

/**
 * Refresh QuickBooks access token if it's expired or close to expiry
 * @param {Object} user - User object from database
 * @param {Number} thresholdHours - Hours before expiry to refresh token (default: 24)
 * @returns {Object} User object with refreshed tokens
 */
const refreshQboTokenIfNeeded = async (user, thresholdHours = 24) => {
  if (!user.qbo.connected || !user.qbo.refreshToken) {
    throw new Error('User not connected to QuickBooks');
  }

  // Check if token is expired or about to expire
  const now = new Date();
  const expiresAt = user.qbo.expiresAt ? new Date(user.qbo.expiresAt) : null;
  const thresholdTime = new Date(now.getTime() + (thresholdHours * 60 * 60 * 1000));
  
  // If token is valid and not expiring soon, return user
  if (expiresAt && expiresAt > thresholdTime) {
    return user;
  }
  
  try {
    // Decrypt the refresh token
    const refreshToken = user.decryptToken(
      user.qbo.refreshToken,
      user.qbo.refreshTokenIV
    );
    
    // Refresh the token
    const tokenResponse = await refreshAccessToken(refreshToken);
    
    // Encrypt the new tokens
    const encryptedAccessToken = user.encryptToken(tokenResponse.token.access_token);
    const encryptedRefreshToken = user.encryptToken(tokenResponse.token.refresh_token);
    
    // Update user with new tokens
    user.qbo.accessToken = encryptedAccessToken.token;
    user.qbo.accessTokenIV = encryptedAccessToken.iv;
    user.qbo.refreshToken = encryptedRefreshToken.token;
    user.qbo.refreshTokenIV = encryptedRefreshToken.iv;
    user.qbo.expiresAt = tokenResponse.token.expires_at;
    
    // Save the updated user
    await user.save();
    
    return user;
  } catch (error) {
    console.error('Error refreshing QuickBooks token:', error);
    
    // If refresh fails, mark as disconnected
    user.qbo.connected = false;
    await user.save();
    
    throw new Error('Failed to refresh QuickBooks token');
  }
};

/**
 * Get a valid access token for QuickBooks API
 * @param {Object} user - User object from database
 * @returns {String} Valid access token
 */
const getValidQboAccessToken = async (userId) => {
  // Find the user and refresh token if needed
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  if (!user.qbo.connected) {
    throw new Error('User not connected to QuickBooks');
  }
  
  // Refresh token if needed
  const refreshedUser = await refreshQboTokenIfNeeded(user);
  
  // Decrypt and return the access token
  return refreshedUser.decryptToken(
    refreshedUser.qbo.accessToken,
    refreshedUser.qbo.accessTokenIV
  );
};

module.exports = {
  refreshQboTokenIfNeeded,
  getValidQboAccessToken
}; 