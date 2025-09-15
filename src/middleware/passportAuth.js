// src/middleware/passportAuth.js - Middlewares d'authentification Passport simplifiés
const { 
  passport, 
  requireAuth, 
  authenticateClient, 
  authenticateAdmin, 
  authenticateClientOnly,
  ensureMontyToken
} = require('../config/passport');
const { logger } = require('../config/database');

/**
 * Middleware pour authentifier les clients avec API key uniquement
 * Utilisé pour les endpoints comme /login qui n'ont pas besoin du token Monty
 */
const clientAuth = (req, res, next) => {
  passport.authenticate('simwego-apikey', { session: false }, (err, client, info) => {
    if (err) {
      logger.error('Client authentication error', {
        error: err.message,
        ip: req.ip
      });
      return res.status(500).json({
        error: 'Authentication service error',
        message: 'Please try again or contact support',
        code: 'AUTH_SERVICE_ERROR'
      });
    }

    if (!client) {
      logger.warn('Client authentication failed', {
        message: info?.message || 'Authentication failed',
        ip: req.ip
      });
      
      return res.status(401).json({
        error: 'Invalid API key',
        message: info?.message || 'Please provide a valid SimWeGo API key',
        code: 'AUTH_INVALID_API_KEY'
      });
    }

    req.user = client;
    logger.debug('Client authenticated successfully', {
      clientId: client.id,
      clientName: client.name
    });
    
    next();
  })(req, res, next);
};

/**
 * Middleware pour authentifier les clients ET obtenir un token Monty
 * Utilisé pour la plupart des endpoints API
 */
const clientAuthWithMonty = async (req, res, next) => {
  // D'abord authentifier le client
  passport.authenticate('simwego-apikey', { session: false }, async (err, client, info) => {
    if (err) {
      logger.error('Client authentication error', {
        error: err.message,
        ip: req.ip
      });
      return res.status(500).json({
        error: 'Authentication service error',
        message: 'Please try again or contact support',
        code: 'AUTH_SERVICE_ERROR'
      });
    }

    if (!client) {
      logger.warn('Client authentication failed', {
        message: info?.message || 'Authentication failed',
        ip: req.ip
      });
      
      return res.status(401).json({
        error: 'Invalid API key',
        message: info?.message || 'Please provide a valid SimWeGo API key',
        code: 'AUTH_INVALID_API_KEY'
      });
    }

    req.user = client;
    
    // Ensuite, obtenir le token Monty
    try {
      await ensureMontyToken(req, res, next);
    } catch (error) {
      logger.error('Monty token error', {
        clientId: client.id,
        error: error.message,
        ip: req.ip
      });
      
      return res.status(500).json({
        error: 'Backend authentication failed',
        message: 'Unable to authenticate with eSIM service. Please try again or contact support.',
        code: 'MONTY_AUTH_FAILED'
      });
    }
  })(req, res, next);
};

/**
 * Middleware pour authentifier les administrateurs
 */
const adminAuth = (req, res, next) => {
  passport.authenticate('admin-jwt', { session: false }, (err, admin, info) => {
    if (err) {
      logger.error('Admin authentication error', {
        error: err.message,
        ip: req.ip
      });
      return res.status(500).json({
        error: 'Authentication service error',
        message: 'Please try again or contact support',
        code: 'ADMIN_AUTH_SERVICE_ERROR'
      });
    }

    if (!admin) {
      logger.warn('Admin authentication failed', {
        message: info?.message || 'Authentication failed',
        ip: req.ip
      });
      
      return res.status(401).json({
        error: 'Admin authentication required',
        message: info?.message || 'Please provide a valid admin token',
        code: 'ADMIN_AUTH_REQUIRED'
      });
    }

    req.admin = admin;
    logger.debug('Admin authenticated successfully', {
      adminId: admin.id,
      username: admin.username
    });
    
    next();
  })(req, res, next);
};

/**
 * Middleware optionnel - n'échoue pas si pas d'authentification
 */
const optionalAuth = (req, res, next) => {
  if (!req.headers.authorization) {
    return next();
  }
  
  passport.authenticate('simwego-apikey', { session: false }, (err, client, info) => {
    if (err) {
      logger.warn('Optional authentication error, continuing without auth', {
        error: err.message,
        ip: req.ip
      });
      return next();
    }

    if (client) {
      req.user = client;
      logger.debug('Optional authentication successful', {
        clientId: client.id
      });
    }
    
    next();
  })(req, res, next);
};

/**
 * Middleware de logging pour les requêtes authentifiées
 */
const logAuthenticatedRequest = (req, res, next) => {
  if (req.user) {
    if (req.user.role === 'admin') {
      logger.info('Authenticated admin request', {
        adminId: req.user.id,
        username: req.user.username,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip
      });
    } else {
      logger.info('Authenticated client request', {
        clientId: req.user.id,
        clientName: req.user.name,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        hasMontyToken: !!req.montyToken
      });
    }
  }
  next();
};

/**
 * Middleware pour vérifier les rôles (si implémenté dans le futur)
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please authenticate to access this resource',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = req.user.role || 'client';
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'Your account does not have permission to access this resource',
        code: 'AUTH_INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

module.exports = {
  // Middlewares principaux
  clientAuth,                    // Authentification client uniquement
  clientAuthWithMonty,          // Authentification client + token Monty
  adminAuth,                    // Authentification administrateur
  optionalAuth,                 // Authentification optionnelle
  
  // Utilitaires
  logAuthenticatedRequest,      // Logging des requêtes authentifiées
  requireRole,                  // Vérification de rôles
  
  
  // Accès direct à Passport pour cas spéciaux
  passport
};