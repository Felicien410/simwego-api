// src/middleware/auth/montyTokenAuth.js - Monty token middleware
const montyAuthService = require('../../services/montyAuth');
const { logger } = require('../../config/database');
const { TokenCache } = require('../../models/TokenCache');

async function montyTokenAuth(req, res, next) {
  try {
    // Skip if client not authenticated first
    if (!req.client) {
      return next();
    }

    // Try to get a valid Monty token for this client
    try {
      // Get valid token using cache and refresh logic
      const token = await montyAuthService.getValidToken(req.client, TokenCache);
      req.montyToken = token;
      
      logger.debug('Monty token added to request', {
        clientId: req.client.id,
        hasToken: !!req.montyToken
      });
    } catch (error) {
      logger.warn('Failed to get Monty token', {
        clientId: req.client.id,
        error: error.message
      });
      // Continue without token - let ProxyService handle the error
    }

    next();
  } catch (error) {
    logger.error('Monty token middleware error', {
      error: error.message,
      clientId: req.client?.id
    });
    next(); // Continue without token
  }
}

module.exports = montyTokenAuth;