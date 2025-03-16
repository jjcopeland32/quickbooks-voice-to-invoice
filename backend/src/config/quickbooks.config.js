const { AuthorizationCode } = require('simple-oauth2');

/**
 * QuickBooks OAuth2 configuration
 * Creates a client for OAuth2 authorization code flow
 * 
 * @returns {Object} OAuth2 client
 */
const getQuickBooksClient = () => {
  // QuickBooks OAuth2 configuration
  const quickBooksConfig = {
    client: {
      id: process.env.QB_CLIENT_ID,
      secret: process.env.QB_CLIENT_SECRET
    },
    auth: {
      tokenHost: getAuthUrl(),
      tokenPath: '/oauth2/token',
      authorizeHost: getAuthUrl(),
      authorizePath: '/connect/oauth2',
      revokePath: '/oauth2/tokens/revoke'
    }
  };

  return new AuthorizationCode(quickBooksConfig);
};

/**
 * Get the QuickBooks authorization URL
 * Different URLs for sandbox and production environments
 * 
 * @returns {String} QuickBooks authorization URL
 */
const getAuthUrl = () => {
  const environment = process.env.QB_ENVIRONMENT || 'sandbox';
  return environment === 'sandbox' 
    ? 'https://oauth.sandbox.quickbooks.com' 
    : 'https://oauth.platform.intuit.com';
};

/**
 * Get the QuickBooks API URL
 * Different URLs for sandbox and production environments
 * 
 * @returns {String} QuickBooks API URL
 */
const getApiUrl = () => {
  const environment = process.env.QB_ENVIRONMENT || 'sandbox';
  return environment === 'sandbox'
    ? 'https://sandbox-quickbooks.api.intuit.com'
    : 'https://quickbooks.api.intuit.com';
};

/**
 * Get the authorization URL for QuickBooks OAuth2 flow
 * 
 * @param {String} state - Optional state parameter for redirect
 * @returns {String} Authorization URL
 */
const getAuthorizationUrl = (state = null) => {
  const client = getQuickBooksClient();
  
  // Authorization URL options
  const authorizationOptions = {
    redirect_uri: process.env.QB_REDIRECT_URI,
    scope: 'com.intuit.quickbooks.accounting',
    state: state || Buffer.from(JSON.stringify({ timestamp: Date.now() })).toString('base64')
  };
  
  return client.authorizeURL(authorizationOptions);
};

/**
 * Get a token from QuickBooks using an authorization code
 * 
 * @param {String} code - Authorization code from QuickBooks
 * @returns {Promise<Object>} QuickBooks access token
 */
const getTokenFromCode = async (code) => {
  const client = getQuickBooksClient();
  
  const tokenParams = {
    code,
    redirect_uri: process.env.QB_REDIRECT_URI
  };
  
  try {
    return await client.getToken(tokenParams);
  } catch (error) {
    console.error('Error getting token from QuickBooks:', error.message);
    throw error;
  }
};

/**
 * Refresh a QuickBooks access token
 * 
 * @param {String} refreshToken - Refresh token
 * @returns {Promise<Object>} New token response
 */
const refreshAccessToken = async (refreshToken) => {
  try {
    const client = getQuickBooksClient();
    
    // Create token object
    const tokenObject = {
      access_token: 'expired_token', // dummy value, not used for refresh
      refresh_token: refreshToken,
      expires_at: new Date(0) // dummy expired date
    };
    
    // Create token instance
    const token = client.createToken(tokenObject);
    
    // Refresh the token
    return await token.refresh();
  } catch (error) {
    console.error('Error refreshing QuickBooks access token:', error);
    throw new Error(`Failed to refresh token: ${error.message}`);
  }
};

/**
 * Revoke a QuickBooks token
 * 
 * @param {String} token - Token to revoke
 * @returns {Promise<Boolean>} Success status
 */
const revokeToken = async (token) => {
  try {
    const client = getQuickBooksClient();
    const tokenObject = {
      access_token: token
    };
    
    const oauthToken = client.createToken(tokenObject);
    await oauthToken.revoke('access_token');
    return true;
  } catch (error) {
    console.error('Error revoking QuickBooks token:', error.message);
    throw error;
  }
};

module.exports = {
  getQuickBooksClient,
  getAuthUrl,
  getApiUrl,
  getAuthorizationUrl,
  getTokenFromCode,
  refreshAccessToken,
  revokeToken
}; 