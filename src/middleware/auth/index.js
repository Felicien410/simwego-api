// src/middleware/auth/index.js - Unified Authentication Middleware
const jwt = require('jsonwebtoken');
const { logger } = require('../../config/database');
const montyAuthService = require('../../services/montyAuth');

/**
 * Authentication strategies
 */
const AuthStrategies = {
  API_KEY: 'api_key',
  JWT_ADMIN: 'jwt_admin',
  MONTY_TOKEN: 'monty_token'
};

/**
 * Base authentication utility functions
 */
class AuthUtils {
  static extractBearerToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7).trim();
  }

  static createAuthError(status, error, message, code) {
    return { status, error, message, code };
  }

  static sendAuthError(res, { status, error, message, code }) {
    return res.status(status).json({ error, message, code });
  }
}

/**
 * API Key Authentication Strategy
 */
class ApiKeyAuth {
  static async authenticate(req, models) {
    const authHeader = req.headers.authorization;
    const apiKey = AuthUtils.extractBearerToken(authHeader);

    if (!apiKey) {
      throw AuthUtils.createAuthError(401, 
        'Missing or invalid Authorization header',
        'Please provide: Authorization: Bearer [your_simwego_api_key]',
        'AUTH_MISSING'
      );
    }

    const client = await models.Client.findOne({
      where: { api_key: apiKey, active: true }
    });

    if (!client) {
      logger.warn('Authentication failed: Invalid API key', { 
        apiKey: apiKey.substring(0, 10) + '...',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      throw AuthUtils.createAuthError(401,
        'Invalid SimWeGo API key',
        'Please contact SimWeGo support for a valid API key',
        'AUTH_INVALID'
      );
    }

    if (!client.active) {
      logger.warn('Authentication failed: Client account suspended', { 
        clientId: client.id,
        clientName: client.name,
        ip: req.ip
      });

      throw AuthUtils.createAuthError(403,
        'Client account suspended',
        'Please contact SimWeGo support to reactivate your account',
        'AUTH_SUSPENDED'
      );
    }

    req.client = client;
    
    logger.info('Client authenticated successfully', {
      clientId: client.id,
      clientName: client.name,
      ip: req.ip
    });

    return client;
  }
}

/**
 * JWT Admin Authentication Strategy
 */
class JwtAdminAuth {
  static authenticate(req) {
    const authHeader = req.headers.authorization;
    const token = AuthUtils.extractBearerToken(authHeader);

    if (!token) {
      throw AuthUtils.createAuthError(401,
        'Admin authentication required',
        'Please provide: Authorization: Bearer [admin_token]',
        'ADMIN_AUTH_MISSING'
      );
    }

    try {
      const adminSecret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;
      const decoded = jwt.verify(token, adminSecret);

      if (!decoded || decoded.role !== 'admin') {
        throw AuthUtils.createAuthError(403,
          'Admin access required',
          'This endpoint requires admin privileges',
          'ADMIN_ACCESS_REQUIRED'
        );
      }

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

      return decoded;

    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw AuthUtils.createAuthError(401,
          'Invalid token',
          'The provided token is invalid',
          'TOKEN_INVALID'
        );
      }
      
      if (error.name === 'TokenExpiredError') {
        throw AuthUtils.createAuthError(401,
          'Token expired',
          'The provided token has expired',
          'TOKEN_EXPIRED'
        );
      }

      logger.error('JWT authentication error', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        ip: req.ip
      });
      
      throw AuthUtils.createAuthError(500,
        'Authentication error',
        'Internal server error during authentication',
        'AUTH_ERROR'
      );
    }
  }
}

/**
 * Monty Token Authentication Strategy
 */
class MontyTokenAuth {
  static async authenticate(req, models) {
    if (!req.client) {
      return; // Skip if no client authenticated
    }

    // For login route, skip Monty token
    const isLoginRoute = req.method === 'POST' && req.originalUrl.includes('/Agent/login');
    if (isLoginRoute) {
      logger.info('Login route detected, skipping Monty token', {
        clientId: req.client.id
      });
      return;
    }

    try {
      const montyToken = await montyAuthService.getValidToken(req.client, models.TokenCache);
      req.montyToken = montyToken;
      
      logger.debug('Monty token added to request', {
        clientId: req.client.id,
        hasToken: !!req.montyToken
      });
    } catch (error) {
      logger.error('Failed to authenticate with Monty eSIM', {
        clientId: req.client.id,
        clientName: req.client.name,
        error: error.message,
        ip: req.ip
      });

      throw AuthUtils.createAuthError(500,
        'Backend authentication failed',
        'Unable to authenticate with eSIM service. Please try again or contact support.',
        'MONTY_AUTH_FAILED'
      );
    }
  }
}

/**
 * Main Authentication Middleware Factory
 */
function createAuthMiddleware(strategies = [AuthStrategies.API_KEY]) {
  return async (req, res, next) => {
    try {
      // Load models lazily to avoid circular dependencies
      const { Client } = require('../../models/Client');
      const { TokenCache } = require('../../models/TokenCache');
      const models = { Client, TokenCache };

      // Execute authentication strategies in order
      for (const strategy of strategies) {
        switch (strategy) {
          case AuthStrategies.API_KEY:
            await ApiKeyAuth.authenticate(req, models);
            break;
          
          case AuthStrategies.JWT_ADMIN:
            JwtAdminAuth.authenticate(req);
            break;
          
          case AuthStrategies.MONTY_TOKEN:
            await MontyTokenAuth.authenticate(req, models);
            break;
        }
      }

      next();

    } catch (error) {
      if (error.status) {
        // This is an authentication error with proper status/message
        return AuthUtils.sendAuthError(res, error);
      }

      // Unexpected error
      logger.error('Authentication middleware error', {
        error: error.message,
        stack: error.stack,
        ip: req.ip,
        url: req.originalUrl
      });

      return AuthUtils.sendAuthError(res, AuthUtils.createAuthError(500,
        'Authentication service error',
        'Please try again or contact support if the problem persists',
        'AUTH_SERVICE_ERROR'
      ));
    }
  };
}

/**
 * Pre-configured middleware functions for common use cases
 */
const authMiddlewares = {
  // For API endpoints requiring client authentication + Monty token
  apiKey: createAuthMiddleware([AuthStrategies.API_KEY, AuthStrategies.MONTY_TOKEN]),
  
  // For API endpoints requiring only client authentication (like login)
  apiKeyOnly: createAuthMiddleware([AuthStrategies.API_KEY]),
  
  // For admin endpoints
  adminJwt: createAuthMiddleware([AuthStrategies.JWT_ADMIN]),
  
  // For endpoints that add Monty token if client is already authenticated
  montyToken: createAuthMiddleware([AuthStrategies.MONTY_TOKEN]),

  // Optional authentication (doesn't fail if no auth provided)
  optional: async (req, res, next) => {
    if (!req.headers.authorization) {
      return next();
    }
    
    try {
      await authMiddlewares.apiKeyOnly(req, res, next);
    } catch (error) {
      logger.warn('Optional authentication failed, continuing without auth', {
        error: error.message,
        ip: req.ip
      });
      next();
    }
  }
};

/**
 * Role-based access control middleware
 */
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.client && !req.admin) {
      return AuthUtils.sendAuthError(res, AuthUtils.createAuthError(401,
        'Authentication required',
        'Please authenticate to access this resource',
        'AUTH_REQUIRED'
      ));
    }

    const userRole = req.client?.role || req.admin?.role;
    if (userRole && roles.includes(userRole)) {
      return next();
    }

    return AuthUtils.sendAuthError(res, AuthUtils.createAuthError(403,
      'Insufficient permissions',
      'Your account does not have permission to access this resource',
      'AUTH_INSUFFICIENT_PERMISSIONS'
    ));
  };
}

/**
 * Request logging middleware for authenticated requests
 */
function logAuthenticatedRequest(req, res, next) {
  if (req.client) {
    logger.info('Authenticated API request', {
      clientId: req.client.id,
      clientName: req.client.name,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  } else if (req.admin) {
    logger.info('Authenticated admin request', {
      adminId: req.admin.id,
      adminUsername: req.admin.username,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip
    });
  }
  next();
}

module.exports = {
  // Main middleware factory
  createAuthMiddleware,
  
  // Pre-configured middlewares
  ...authMiddlewares,
  
  // Utility functions
  requireRole,
  logAuthenticatedRequest,
  
  // Constants
  AuthStrategies,
  
  // Backward compatibility (will be deprecated)
  authenticateSimWeGoClient: authMiddlewares.apiKey,
  apiKeyAuth: authMiddlewares.apiKeyOnly,
  optionalAuth: authMiddlewares.optional,
  jwtAuth: authMiddlewares.adminJwt,
  montyTokenAuth: authMiddlewares.montyToken
};