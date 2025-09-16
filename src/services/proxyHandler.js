// =============================================================================
// src/services/proxy/proxyHandler.js - Service proxy générique
// =============================================================================
const axios = require('axios');
const environment = require('../config/environment');
const { logger } = require('../config/database');

class ProxyService {
  static async proxyToMonty(req, res, montyEndpoint) {
    return this._proxyToMontyWithRetry(req, res, montyEndpoint, 0);
  }

  static async _proxyToMontyWithRetry(req, res, montyEndpoint, retryCount = 0) {
    try {
      
      // Exception pour la route /Agent/login qui génère le token Monty
      const isLoginRoute = montyEndpoint === '/Agent/login' && req.method === 'POST';
      
      if (!req.montyToken && !isLoginRoute) {
        return res.status(500).json({
          error: 'Backend authentication missing',
          code: 'MONTY_TOKEN_MISSING'
        });
      }

      const config = {
        method: req.method,
        url: `${environment.monty.apiBaseUrl}/api/v0${montyEndpoint}`,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SimWeGo-API/1.0'
        },
        timeout: environment.monty.timeout || 30000
      };

      // Ajouter les headers d'authentification seulement si on a un token (pas pour login)
      if (req.montyToken) {
        config.headers['Authorization'] = `Bearer ${req.montyToken}`;
        config.headers['access-token'] = req.montyToken;
      }

      if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
        config.data = req.body;
      }

      if (Object.keys(req.query).length > 0) {
        config.params = req.query;
      }

      logger.info('Proxying to Monty', {
        client: req.user?.name,
        method: req.method,
        endpoint: montyEndpoint,
        ip: req.ip,
        retry: retryCount
      });

      const response = await axios(config);
      
      res.setHeader('X-SimWeGo-Client', req.user?.id || 'unknown');
      res.setHeader('X-SimWeGo-Proxy', 'true');
      res.setHeader('X-SimWeGo-Version', '1.0.0');
      
      res.status(response.status).json(response.data);

    } catch (error) {
      // Exception pour la route /Agent/login qui génère le token Monty
      const isLoginRoute = montyEndpoint === '/Agent/login' && req.method === 'POST';
      
      // Si erreur 401 et qu'on n'a pas déjà retry, tenter de refresh le token
      if (error.response?.status === 401 && retryCount === 0 && req.user && !isLoginRoute) {
        logger.warn('Got 401, attempting to refresh token and retry', {
          client: req.user?.name,
          endpoint: montyEndpoint,
          retryCount
        });

        try {
          // Import ici pour éviter les dépendances circulaires
          const montyAuthService = require('./montyAuth');
          const { TokenCache } = require('../models/TokenCache');
          const { Client } = require('../models/Client');

          // Récupérer le client complet depuis la DB (avec le mot de passe chiffré)
          const client = await Client.findByPk(req.user.id);
          
          if (!client) {
            throw new Error('Client not found');
          }

          // Invalider le token actuel
          await montyAuthService.invalidateToken(client.id, TokenCache);
          
          // Obtenir un nouveau token (avec refresh ou re-login automatique)
          const newToken = await montyAuthService.getValidToken(client, TokenCache);
          req.montyToken = newToken;

          // Retry une seule fois
          return this._proxyToMontyWithRetry(req, res, montyEndpoint, retryCount + 1);

        } catch (refreshError) {
          logger.error('Failed to refresh token after 401', {
            client: req.user?.name,
            endpoint: montyEndpoint,
            error: refreshError.message
          });
          // Continue avec l'erreur originale
        }
      }

      logger.error('Proxy error', {
        client: req.user?.name,
        endpoint: montyEndpoint,
        error: error.message,
        status: error.response?.status,
        retryCount
      });

      const status = error.response?.status || 500;
      const data = error.response?.data || {
        error: 'Proxy communication error',
        message: 'Failed to communicate with eSIM service'
      };

      res.status(status).json(data);
    }
  }

}

module.exports = ProxyService;
