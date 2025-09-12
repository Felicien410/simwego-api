// src/middleware/auth/jwtAuth.js - JWT Authentication for Admin
const jwt = require('jsonwebtoken');
const { logger } = require('../../config/database');

function jwtAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Admin authentication required',
        message: 'Please provide: Authorization: Bearer [admin_token]',
        code: 'ADMIN_AUTH_MISSING'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return res.status(401).json({
        error: 'Invalid token format',
        message: 'Token cannot be empty',
        code: 'TOKEN_EMPTY'
      });
    }

    // Verify JWT token
    const adminSecret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;
    const decoded = jwt.verify(token, adminSecret);

    if (!decoded || decoded.role !== 'admin') {
      return res.status(403).json({
        error: 'Admin access required',
        message: 'This endpoint requires admin privileges',
        code: 'ADMIN_ACCESS_REQUIRED'
      });
    }

    // Attach admin info to request
    req.admin = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role
    };

    logger.info('Admin authenticated successfully', {
      adminId: decoded.id,
      ip: req.ip,
      method: req.method,
      url: req.url
    });

    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'The provided token is invalid',
        code: 'TOKEN_INVALID'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'The provided token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    logger.error('JWT authentication error', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      ip: req.ip
    });
    
    res.status(500).json({
      error: 'Authentication error',
      message: 'Internal server error during authentication',
      code: 'AUTH_ERROR'
    });
  }
}

module.exports = jwtAuth;