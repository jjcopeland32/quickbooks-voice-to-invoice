const User = require('../models/user.model');
const { generateToken } = require('../middleware/jwt.middleware');

/**
 * Register a new user
 * @route POST /api/auth/register
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} User data and JWT token
 */
const signup = async (req, res) => {
  try {
    const { email, password, firstName, lastName, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        error: {
          message: 'User already exists with this email',
          status: 400
        }
      });
    }

    // Create new user
    const user = await User.create({
      name: name || `${firstName} ${lastName}`.trim(),
      email,
      password,
      firstName,
      lastName
    });

    // Generate JWT token
    const token = generateToken({
      id: user._id,
      email: user.email
    });

    // Return user data without password
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      qboConnected: user.qbo?.connected || false
    };

    res.status(201).json({
      data: {
        user: userData,
        token
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Error creating user',
        status: 500
      }
    });
  }
};

/**
 * Login a user
 * @route POST /api/auth/login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} User data and JWT token
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        error: {
          message: 'Invalid credentials',
          status: 401
        }
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        error: {
          message: 'Invalid credentials',
          status: 401
        }
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: user._id,
      email: user.email
    });

    // Return user data without password
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      qboConnected: user.qbo?.connected || false
    };

    res.status(200).json({
      data: {
        user: userData,
        token
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Error logging in',
        status: 500
      }
    });
  }
};

/**
 * Get current user profile
 * @route GET /api/auth/profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} User data
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          status: 404
        }
      });
    }

    // Return user data
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      qboConnected: user.qbo?.connected || false
    };

    res.status(200).json({
      data: {
        user: userData
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Error fetching profile',
        status: 500
      }
    });
  }
};

module.exports = {
  signup,
  login,
  getProfile
}; 