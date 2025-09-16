// src/services/montyAuth.js - Service d'authentification avec Monty eSIM
const axios = require('axios');
const { logger } = require('../config/database');

class MontyAuthService {
  constructor() {
    this.baseURL = process.env.MONTY_API_BASE_URL || 'https://resellerapi.montyesim.com';
    this.timeout = 30000; // 30 secondes
  }

  /**
   * Obtenir un token valide pour un client
   * @param {Object} client - Client Sequelize model instance
   * @param {Object} TokenCache - TokenCache Sequelize model
   * @returns {string} Access token valide
   */
  async getValidToken(client, TokenCache) {
    try {
      // Vérifier s'il existe un token en cache
      const cachedToken = await TokenCache.findByPk(client.id);
      
      if (cachedToken && cachedToken.isValid()) {
        logger.debug('Using cached token', { 
          clientId: client.id,
          expiresAt: cachedToken.expires_at,
          timeToExpiry: cachedToken.getTimeToExpiry()
        });
        return cachedToken.access_token;
      }

      // Token expiré ou inexistant, obtenir un nouveau
      let newTokenData;
      
      if (cachedToken && cachedToken.refresh_token) {
        // Essayer d'abord le refresh token
        logger.info('Refreshing Monty token using refresh_token', { 
          clientId: client.id,
          clientName: client.name,
          reason: 'expired'
        });
        
        try {
          newTokenData = await this.refreshToken(cachedToken.refresh_token);
        } catch (refreshError) {
          // Si le refresh échoue, faire un login complet
          logger.warn('Refresh token failed, falling back to full authentication', { 
            clientId: client.id,
            error: refreshError.message 
          });
          newTokenData = await this.authenticateWithMonty(client);
        }
      } else {
        // Pas de refresh token, faire un login complet
        logger.info('Refreshing Monty token using full authentication', { 
          clientId: client.id,
          clientName: client.name,
          reason: cachedToken ? 'no_refresh_token' : 'not_found'
        });
        newTokenData = await this.authenticateWithMonty(client);
      }
      
      // Sauvegarder en cache
      await TokenCache.upsert({
        client_id: client.id,
        access_token: newTokenData.access_token,
        refresh_token: newTokenData.refresh_token,
        expires_at: new Date(newTokenData.expires_in * 1000),
        agent_id: newTokenData.agent_id,
        reseller_id: newTokenData.reseller_id
      });

      logger.info('Monty token refreshed successfully', { 
        clientId: client.id,
        agentId: newTokenData.agent_id,
        resellerId: newTokenData.reseller_id,
        expiresAt: new Date(newTokenData.expires_in * 1000)
      });

      return newTokenData.access_token;

    } catch (error) {
      logger.error('Failed to get valid token', {
        clientId: client.id,
        clientName: client.name,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Authentifier un client avec l'API Monty
   * @param {Object} client - Client avec credentials
   * @returns {Object} Données du token Monty
   */
  async authenticateWithMonty(client) {
    try {
      // Le client est un objet plain (pas une instance Sequelize), déchiffrer manuellement
      const encryptionService = require('./encryption');
      
      logger.debug('Attempting to decrypt password', {
        clientId: client.id,
        hasEncryptedPassword: !!client.monty_password_encrypted,
        encryptedPasswordFormat: client.monty_password_encrypted ? client.monty_password_encrypted.substring(0, 20) + '...' : 'null'
      });
      
      const credentials = {
        username: client.monty_username,
        password: encryptionService.decryptPassword(client.monty_password_encrypted)
      };
      
      
      logger.debug('Authenticating with Monty', {
        clientId: client.id,
        montyUsername: credentials.username,
        baseURL: this.baseURL
      });

      const response = await axios.post(
        `${this.baseURL}/api/v0/Agent/login`,
        {
          username: credentials.username,
          password: credentials.password
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'SimWeGo-API/1.0'
          },
          timeout: this.timeout
        }
      );

      // Vérifier que la réponse contient les données attendues
      const tokenData = response.data;
      
      if (!tokenData.access_token) {
        throw new Error('Invalid response from Monty API: missing access_token');
      }

      if (!tokenData.expires_in) {
        throw new Error('Invalid response from Monty API: missing expires_in');
      }

      // L'API Monty retourne expires_in comme timestamp Unix, pas comme durée
      // Vérifier si c'est déjà un timestamp (> année 2000)
      if (tokenData.expires_in < 946684800) {
        // Si < 2000, c'est une durée en secondes
        tokenData.expires_in = Date.now() + (tokenData.expires_in * 1000);
      } else {
        // Si > 2000, c'est déjà un timestamp Unix, le convertir en millisecondes
        tokenData.expires_in = tokenData.expires_in * 1000;
      }

      logger.debug('Monty authentication successful', {
        clientId: client.id,
        agentId: tokenData.agent_id,
        resellerId: tokenData.reseller_id,
        tokenType: tokenData.token_type
      });

      return tokenData;

    } catch (error) {
      // Analyser le type d'erreur
      if (error.response) {
        // Erreur HTTP de l'API Monty
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401 || status === 403) {
          throw new Error(`Invalid Monty credentials for client ${client.name}: ${data.message || 'Unauthorized'}`);
        } else if (status >= 500) {
          throw new Error(`Monty API server error: ${status} ${data.message || 'Internal server error'}`);
        } else {
          throw new Error(`Monty API error: ${status} ${data.message || 'Unknown error'}`);
        }
      } else if (error.request) {
        // Erreur réseau
        throw new Error(`Network error connecting to Monty API: ${error.message}`);
      } else {
        // Autre erreur
        throw new Error(`Authentication error: ${error.message}`);
      }
    }
  }

  /**
   * Rafraîchir un token avec le refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Object} Nouvelles données du token
   */
  async refreshToken(refreshToken) {
    try {
      
      logger.debug('Attempting to refresh token with refresh_token');

      const response = await axios.post(
        `${this.baseURL}/api/v0/Token/Refresh`,
        {
          refresh_token: refreshToken
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'SimWeGo-API/1.0'
          },
          timeout: this.timeout
        }
      );

      const tokenData = response.data;
      
      // L'API Monty retourne expires_in comme timestamp Unix, pas comme durée
      if (tokenData.expires_in) {
        if (tokenData.expires_in < 946684800) {
          // Si < 2000, c'est une durée en secondes
          tokenData.expires_in = Date.now() + (tokenData.expires_in * 1000);
        } else {
          // Si > 2000, c'est déjà un timestamp Unix, le convertir en millisecondes
          tokenData.expires_in = tokenData.expires_in * 1000;
        }
      }

      logger.debug('Token refreshed successfully');
      return tokenData;

    } catch (error) {
      logger.warn('Failed to refresh token, will attempt full authentication', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Invalider un token en cache
   * @param {string} clientId - ID du client
   * @param {Object} TokenCache - Model TokenCache
   */
  async invalidateToken(clientId, TokenCache) {
    try {
      await TokenCache.destroy({ where: { client_id: clientId } });
      logger.info('Token invalidated', { clientId });
    } catch (error) {
      logger.error('Failed to invalidate token', { clientId, error: error.message });
    }
  }

  /**
   * Nettoyer les tokens expirés du cache
   * @param {Object} TokenCache - Model TokenCache
   * @returns {number} Nombre de tokens supprimés
   */
  async cleanExpiredTokens(TokenCache) {
    try {
      const deletedCount = await TokenCache.cleanExpiredTokens();
      
      if (deletedCount > 0) {
        logger.info('Cleaned expired tokens from cache', { count: deletedCount });
      }
      
      return deletedCount;
    } catch (error) {
      logger.error('Failed to clean expired tokens', { error: error.message });
      return 0;
    }
  }

  /**
   * Obtenir les statistiques des tokens
   * @param {Object} TokenCache - Model TokenCache
   * @returns {Object} Statistiques du cache
   */
  async getTokenStats(TokenCache) {
    try {
      return await TokenCache.getCacheStats();
    } catch (error) {
      logger.error('Failed to get token stats', { error: error.message });
      return { total: 0, valid: 0, expired: 0 };
    }
  }

  /**
   * Vérifier la connectivité avec l'API Monty
   * @returns {boolean} True si l'API est accessible
   */
  async checkMontyAPIHealth() {
    try {
      const response = await axios.get(`${this.baseURL}/HealthCheck`, {
        timeout: 5000,
        headers: {
          'User-Agent': 'SimWeGo-API/1.0'
        }
      });
      
      return response.status === 200;
    } catch (error) {
      logger.warn('Monty API health check failed', { error: error.message });
      return false;
    }
  }
}

// Créer une instance singleton
const montyAuthService = new MontyAuthService();

module.exports = montyAuthService;