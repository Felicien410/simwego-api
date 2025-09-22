// src/admin/controllers/authController.js - Admin authentication controller

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { logger } = require('../../config/database');

// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many login attempts',
    message: 'Please try again in 15 minutes',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Production admin credentials (from env vars)
const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME,
  passwordHash: process.env.ADMIN_PASSWORD_HASH // Bcrypt hash for security
};

// Validation middleware
const validateLogin = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters'),
  body('password')
    .isLength({ min: 8, max: 100 })
    .withMessage('Password must be between 8 and 100 characters')
];

// Login controller
const login = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Admin login validation failed', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        errors: errors.array()
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: errors.array()
      });
    }

    const { username, password } = req.body;

    // Check if admin credentials are configured
    if (!ADMIN_CREDENTIALS.passwordHash) {
      logger.error('Admin password hash not configured', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(500).json({
        success: false,
        message: 'Authentication not configured'
      });
    }

    // Validate credentials with bcrypt comparison
    const isValidUsername = username === ADMIN_CREDENTIALS.username;
    const isValidPassword = await bcrypt.compare(password, ADMIN_CREDENTIALS.passwordHash);

    if (!isValidUsername || !isValidPassword) {
      logger.warn('Admin login failed - invalid credentials', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        username,
        timestamp: new Date().toISOString()
      });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate JWT token
    const tokenPayload = {
      id: 'admin_prod',
      username: ADMIN_CREDENTIALS.username,
      role: 'admin',
      iat: Math.floor(Date.now() / 1000)
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.ADMIN_JWT_SECRET,
      { 
        expiresIn: '7d',
        issuer: 'simwego-api',
        audience: 'simwego-admin'
      }
    );

    // Log successful login
    logger.info('Admin login successful', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      username,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      token,
      user: {
        id: 'admin_prod',
        username: ADMIN_CREDENTIALS.username,
        role: 'admin'
      },
      expiresIn: '7d'
    });

  } catch (error) {
    logger.error('Admin login error', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Generate password hash utility (for setup)
const generatePasswordHash = async (password) => {
  return await bcrypt.hash(password, 12);
};

module.exports = {
  login,
  loginLimiter,
  validateLogin,
  generatePasswordHash
};