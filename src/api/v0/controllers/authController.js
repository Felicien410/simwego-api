// src/api/v0/controllers/authController.js - Authentication controller with Passport
const { passport } = require('../../../config/passport');
const montyAuthService = require('../../../services/montyAuth');
const { logger } = require('../../../config/database');

class AuthController {
  async login(req, res, next) {
    // Use Passport's Monty login strategy
    passport.authenticate('monty-login', (err, user, info) => {
      if (err) {
        logger.error('Login error', {
          error: err.message,
          ip: req.ip
        });
        return next(err);
      }

      if (!user) {
        logger.warn('Login failed', {
          message: info?.message || 'Authentication failed',
          ip: req.ip
        });
        
        return res.status(401).json({
          error: 'Authentication failed',
          message: info?.message || 'Invalid username or password',
          code: 'AUTH_FAILED'
        });
      }

      // Login successful
      logger.info('User logged in successfully via Passport', {
        clientId: user.clientId,
        username: user.username,
        agentId: user.agentId,
        resellerId: user.resellerId,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Authentication successful',
        user: {
          clientId: user.clientId,
          username: user.username,
          agentId: user.agentId,
          resellerId: user.resellerId
        },
        tokens: {
          access_token: user.tokenData.access_token,
          refresh_token: user.tokenData.refresh_token,
          expires_in: user.tokenData.expires_in,
          token_type: user.tokenData.token_type || 'Bearer'
        }
      });

    })(req, res, next);
  }

  async validateToken(req, res, next) {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({
          error: 'Missing token',
          message: 'Token is required',
          code: 'VALIDATION_MISSING_TOKEN'
        });
      }

      // Le client est déjà authentifié via Passport middleware
      const client = req.user;
      if (!client) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Please authenticate with your API key first',
          code: 'VALIDATION_AUTH_REQUIRED'
        });
      }

      // Valider le token via le service TokenCache
      const { TokenCache } = require('../../../models/TokenCache');
      const cachedToken = await TokenCache.findByPk(client.id);
      
      const isValid = cachedToken && cachedToken.access_token === token && cachedToken.isValid();
      
      logger.info('Token validation performed', {
        clientId: client.id,
        valid: isValid,
        ip: req.ip
      });
      
      res.json({
        valid: isValid,
        timestamp: new Date().toISOString(),
        client: {
          id: client.id,
          name: client.name
        }
      });

    } catch (error) {
      logger.error('Token validation error', {
        error: error.message,
        ip: req.ip
      });
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const client = req.user;
      
      if (!client) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Please authenticate with your API key first',
          code: 'LOGOUT_AUTH_REQUIRED'
        });
      }
      
      // Clear cached tokens for client via Monty service
      await montyAuthService.invalidateToken(client.id, require('../../../models/TokenCache').TokenCache);
      
      logger.info('User logged out via Passport', {
        clientId: client.id,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Logout successful',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Logout error', {
        error: error.message,
        ip: req.ip
      });
      next(error);
    }
  }
}

module.exports = new AuthController();