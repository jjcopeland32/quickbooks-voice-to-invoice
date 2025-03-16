const jwt = require('jsonwebtoken');

/**
 * Middleware for JWT authentication
 * Validates the JWT token from the Authorization header
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
const validateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ 
      error: { 
        message: 'Authorization header missing',
        status: 401
      } 
    });
  }

  const token = authHeader.split(' ')[1]; // Bearer <token>
  
  if (!token) {
    return res.status(401).json({ 
      error: { 
        message: 'Token missing from Authorization header',
        status: 401
      } 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      error: { 
        message: 'Invalid or expired token',
        status: 401
      } 
    });
  }
};

/**
 * Generate a JWT token for a user
 * 
 * @param {Object} payload - Data to encode in the JWT
 * @param {String} expiresIn - Token expiration time
 * @returns {String} JWT token
 */
const generateToken = (payload, expiresIn = '1d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

module.exports = {
  validateJWT,
  generateToken
}; 