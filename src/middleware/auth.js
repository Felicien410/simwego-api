// src/middleware/auth.js - Middleware d'authentification SimWeGo
const { logger } = require('../config/database');
const montyAuthService = require('../services/montyAuth');

/**
 * Middleware d'authentification des clients SimWeGo
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @param {Object} models - Database models
 */
async function authenticateSimWeGoClient(req, res, next, models) {
  try {
    // Vérifier la présence du header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing or invalid Authorization header',
        message: 'Please provide: Authorization: Bearer [your_simwego_api_key]',
        code: 'AUTH_MISSING'
      });
    }

    // Extraire la clé API
    const apiKey = authHeader.substring(7).trim();
    
    if (!apiKey) {
      return res.status(401).json({
        error: 'Empty API key',
        message: 'Please provide a valid SimWeGo API key',
        code: 'AUTH_EMPTY'
      });
    }

    // Rechercher le client en base de données
    const client = await models.Client.findOne({
      where: { 
        api_key: apiKey,
        active: true 
      }
    });

    if (!client) {
      logger.warn('Authentication failed: Invalid API key', { 
        apiKey: apiKey.substring(0, 10) + '...',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(401).json({
        error: 'Invalid SimWeGo API key',
        message: 'Please contact SimWeGo support for a valid API key',
        code: 'AUTH_INVALID'
      });
    }

    // Vérifier si le client est actif (double vérification)
    if (!client.active) {
      logger.warn('Authentication failed: Client account suspended', { 
        clientId: client.id,
        clientName: client.name,
        ip: req.ip
      });

      return res.status(403).json({
        error: 'Client account suspended',
        message: 'Please contact SimWeGo support to reactivate your account',
        code: 'AUTH_SUSPENDED'
      });
    }

    // Stocker les informations du client
    req.client = client;

    // Pour la route /Agent/login, on n'a pas besoin de token Monty (on va le créer)
    const isLoginRoute = req.method === 'POST' && req.originalUrl.includes('/Agent/login');
    
    if (isLoginRoute) {
      // Pour login, on passe directement sans token Monty
      logger.info('Client authenticated for login route (no Monty token needed)', {
        clientId: client.id,
        clientName: client.name,
        ip: req.ip
      });
      
      return next();
    }

    // Pour toutes les autres routes, obtenir ou rafraîchir le token Monty
    try {
      const montyToken = await montyAuthService.getValidToken(client, models.TokenCache);
      req.montyToken = montyToken;
      
      logger.info('Client authenticated successfully', {
        clientId: client.id,
        clientName: client.name,
        ip: req.ip
      });
      
      next();
      
    } catch (montyError) {
      logger.error('Failed to authenticate with Monty eSIM', {
        clientId: client.id,
        clientName: client.name,
        error: montyError.message,
        ip: req.ip
      });

      return res.status(500).json({
        error: 'Backend authentication failed',
        message: 'Unable to authenticate with eSIM service. Please try again or contact support.',
        code: 'MONTY_AUTH_FAILED'
      });
    }

  } catch (error) {
    logger.error('Authentication middleware error', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      url: req.originalUrl
    });

    return res.status(500).json({
      error: 'Authentication service error',
      message: 'Please try again or contact support if the problem persists',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
}

/**
 * Middleware optionnel d'authentification (pour les routes qui n'en ont pas forcément besoin)
 */
async function optionalAuth(req, res, next, models) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Pas d'authentification, continuer sans client
    return next();
  }

  // Tenter l'authentification, mais ne pas bloquer si elle échoue
  try {
    await authenticateSimWeGoClient(req, res, (error) => {
      if (error) {
        logger.warn('Optional authentication failed, continuing without auth', {
          error: error.message,
          ip: req.ip
        });
      }
      next();
    }, models);
  } catch (error) {
    logger.warn('Optional authentication error, continuing without auth', {
      error: error.message,
      ip: req.ip
    });
    next();
  }
}

/**
 * Middleware de validation des rôles (pour une future extension)
 */
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.client) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Pour l'instant, tous les clients ont le même niveau d'accès
    // Cette fonction peut être étendue plus tard avec un système de rôles
    if (req.client.role && roles.includes(req.client.role)) {
      return next();
    }

    return res.status(403).json({
      error: 'Insufficient permissions',
      message: 'Your account does not have permission to access this resource',
      code: 'AUTH_INSUFFICIENT_PERMISSIONS'
    });
  };
}

/**
 * Middleware de logging pour les requêtes authentifiées
 */
function logAuthenticatedRequest(req, res, next) {
  if (req.client) {
    logger.info('Authenticated request', {
      clientId: req.client.id,
      clientName: req.client.name,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  }
  next();
}

// Wrapper pour compatibilité avec l'ancien middleware apiKeyAuth
function apiKeyAuth(req, res, next) {
  const { Client } = require('../models/Client');
  const { TokenCache } = require('../models/TokenCache');
  const models = { Client, TokenCache };
  return authenticateSimWeGoClient(req, res, next, models);
}

module.exports = authenticateSimWeGoClient;
module.exports.apiKeyAuth = apiKeyAuth;
module.exports.optionalAuth = optionalAuth;
module.exports.requireRole = requireRole;
module.exports.logAuthenticatedRequest = logAuthenticatedRequest;