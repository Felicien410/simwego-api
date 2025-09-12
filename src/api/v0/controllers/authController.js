// src/api/v0/controllers/authController.js - Authentication controller
const montyAuth = require('../../../services/montyAuth');
const { logger } = require('../../../config/database');

class AuthController {
  async login(req, res, next) {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          error: 'Missing credentials',
          message: 'Username and password are required'
        });
      }

      // Get client info from API key
      const client = req.client;
      if (!client) {
        return res.status(401).json({
          error: 'Invalid API key',
          message: 'Client not found for provided API key'
        });
      }

      // Authenticate with Monty using client's credentials
      const tokens = await montyAuth.login(client.id, username, password);
      
      logger.info('User logged in successfully', {
        clientId: client.id,
        username: username,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Authentication successful',
        tokens: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_in: tokens.expires_in
        }
      });

    } catch (error) {
      logger.error('Login error', {
        error: error.message,
        ip: req.ip
      });
      
      if (error.message.includes('Invalid credentials')) {
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'Invalid username or password'
        });
      }
      
      next(error);
    }
  }

  async validateToken(req, res, next) {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({
          error: 'Missing token',
          message: 'Token is required'
        });
      }

      const client = req.client;
      const isValid = await montyAuth.validateToken(client.id, token);
      
      res.json({
        valid: isValid,
        timestamp: new Date().toISOString()
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
      const client = req.client;
      
      // Clear cached tokens for client
      await montyAuth.clearTokens(client.id);
      
      logger.info('User logged out', {
        clientId: client.id,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Logout successful'
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