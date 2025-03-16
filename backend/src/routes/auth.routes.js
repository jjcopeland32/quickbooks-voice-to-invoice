const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { verifyToken } = require('../middleware/auth.middleware');
const { validateJWT } = require('../middleware/jwt.middleware');
const { validateSignupInput, validateLoginInput } = require('../middleware/validation.middleware');
const authController = require('../controllers/auth.controller');

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', validateSignupInput, authController.signup);

/**
 * @route POST /api/auth/login
 * @desc Login a user
 * @access Public
 */
router.post('/login', validateLoginInput, authController.login);

/**
 * @route GET /api/auth/profile
 * @desc Get user profile
 * @access Private (requires JWT)
 */
router.get('/profile', validateJWT, authController.getProfile);

/**
 * Get current user
 * @route GET /api/auth/me
 * @access Private
 */
router.get('/me', verifyToken, async (req, res) => {
    try {
        // Find user
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ 
                error: {
                    message: 'User not found',
                    status: 404
                }
            });
        }
        
        // Return user
        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                quickbooks: {
                    connected: user.quickbooks?.connected || false,
                },
            },
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ 
            error: {
                message: 'Failed to get user',
                status: 500
            }
        });
    }
});

/**
 * Logout user (clears token on client-side)
 * @route POST /api/auth/logout
 * @access Public
 */
router.post('/logout', (req, res) => {
    // Authentication tokens are stateless, so just return success
    // The client-side will clear the token from storage
    res.json({ success: true });
});

/**
 * Health check endpoint
 * @route GET /health
 * @access Public
 */
router.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        message: 'Authentication service is up and running',
        timestamp: new Date().toISOString()
    });
});

module.exports = router; 