/**
 * Authentication middleware
 */
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

/**
 * Verify JWT token middleware
 */
const verifyToken = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // Check if token is in query params (for OAuth redirects)
            if (req.query.token) {
                const decoded = jwt.verify(req.query.token, process.env.JWT_SECRET);
                req.user = { id: decoded.id };
                return next();
            }
            
            return res.status(401).json({ error: 'No token provided' });
        }
        
        // Extract token
        const token = authHeader.split(' ')[1];
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Add user ID to request
        req.user = { id: decoded.id };
        
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
};

module.exports = {
    verifyToken,
}; 