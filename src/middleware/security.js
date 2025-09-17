// src/middleware/security.js - Security middleware for authorization and data protection

const { logger } = require('../config/database');

/**
 * Middleware pour s'assurer qu'un client ne peut accéder qu'à ses propres données
 * Vérifie que req.user.id correspond au client_id des données demandées
 */
function requireOwnResource(req, res, next) {
  try {
    // Le client authentifié doit exister
    if (!req.user || !req.user.id) {
      logger.warn('Unauthorized access attempt: No authenticated client', {
        ip: req.ip,
        path: req.path
      });
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be authenticated to access this resource'
      });
    }

    // Pour les routes avec :clientId, vérifier que c'est le bon client
    if (req.params.clientId && req.params.clientId !== req.user.id) {
      logger.warn('Unauthorized access attempt: Client accessing wrong resource', {
        authenticatedClientId: req.user.id,
        requestedClientId: req.params.clientId,
        ip: req.ip,
        path: req.path
      });
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own resources'
      });
    }

    // Pour les requêtes avec client_id dans le body
    if (req.body && req.body.client_id && req.body.client_id !== req.user.id) {
      logger.warn('Unauthorized access attempt: Client trying to modify wrong resource', {
        authenticatedClientId: req.user.id,
        bodyClientId: req.body.client_id,
        ip: req.ip,
        path: req.path
      });
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only modify your own resources'
      });
    }

    next();
  } catch (error) {
    logger.error('Error in requireOwnResource middleware', {
      error: error.message,
      stack: error.stack,
      clientId: req.user?.id,
      ip: req.ip
    });
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Security check failed'
    });
  }
}

/**
 * Middleware pour masquer les données sensibles dans les réponses
 */
function sanitizeResponse(req, res, next) {
  const originalSend = res.send;
  
  res.send = function(data) {
    try {
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      
      // Masquer les données sensibles récursivement
      const sanitized = sanitizeObject(data);
      
      originalSend.call(this, JSON.stringify(sanitized));
    } catch (error) {
      // Si erreur de parsing, envoyer tel quel
      originalSend.call(this, data);
    }
  };
  
  next();
}

/**
 * Fonction utilitaire pour masquer les données sensibles d'un objet
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized = { ...obj };
  
  // Champs à masquer complètement
  const sensitiveFields = [
    'monty_password_encrypted',
    'api_key',
    'access_token',
    'refresh_token'
  ];
  
  // Champs à masquer partiellement
  const partiallyMaskFields = [
    'monty_username'
  ];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      delete sanitized[field];
    }
  });
  
  partiallyMaskFields.forEach(field => {
    if (sanitized[field] && typeof sanitized[field] === 'string') {
      const value = sanitized[field];
      if (value.length > 6) {
        sanitized[field] = value.substring(0, 3) + '***' + value.substring(value.length - 3);
      } else {
        sanitized[field] = '***';
      }
    }
  });
  
  // Traiter récursivement les objets imbriqués
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key]);
    }
  });
  
  return sanitized;
}

/**
 * Middleware pour limiter l'accès aux endpoints sensibles
 */
function rateLimitSensitive(windowMs = 15 * 60 * 1000, maxRequests = 10) {
  const clients = new Map();
  
  return (req, res, next) => {
    const clientId = req.user?.id;
    
    if (!clientId) {
      return next();
    }
    
    const now = Date.now();
    const clientData = clients.get(clientId) || { requests: [], windowStart: now };
    
    // Nettoyer les anciennes requêtes
    clientData.requests = clientData.requests.filter(time => now - time < windowMs);
    
    if (clientData.requests.length >= maxRequests) {
      logger.warn('Rate limit exceeded for sensitive endpoint', {
        clientId,
        endpoint: req.path,
        requests: clientData.requests.length,
        ip: req.ip
      });
      
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded for this endpoint',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    clientData.requests.push(now);
    clients.set(clientId, clientData);
    
    next();
  };
}

/**
 * Middleware pour logger les accès aux données sensibles
 */
function auditAccess(resourceType) {
  return (req, res, next) => {
    const clientId = req.user?.id;
    const action = req.method;
    const resource = req.path;
    
    logger.info('Resource access audit', {
      clientId,
      action,
      resource,
      resourceType,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    next();
  };
}

module.exports = {
  requireOwnResource,
  sanitizeResponse,
  rateLimitSensitive,
  auditAccess,
  sanitizeObject
};