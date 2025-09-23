// src/api/v0/controllers/clientController.js - Client information controller
const { logger } = require('../../../config/database');
const { sanitizeObject } = require('../../../middleware/security');

class ClientController {
  async getInfo(req, res, next) {
    try {
      // Using Passport.js authentication system
      const client = req.user;
      
      
      if (!client) {
        return res.status(404).json({
          error: 'Client not found',
          message: 'No client information available for this API key'
        });
      }

      // Récupérer les vraies données Monty depuis le cache des tokens
      let montyConnection = {
        authenticated: false,
        agentId: null,
        resellerId: null
      };

      try {
        // Essayer de récupérer le cache des tokens pour ce client
        const models = req.app.get('models');
        if (models && models.TokenCache) {
          const tokenCache = await models.TokenCache.findOne({
            where: { client_id: client.id }
          });
          
          if (tokenCache && tokenCache.isValid()) {
            montyConnection = {
              authenticated: true,
              agentId: tokenCache.agent_id,
              resellerId: tokenCache.reseller_id
            };
          }
        }
      } catch (tokenError) {
        logger.warn('Could not retrieve Monty connection info', {
          clientId: client.id,
          error: tokenError.message
        });
      }

      // Return client information with expected structure (manual because Passport client is plain object)
      const response = {
        client: {
          // Generate opaque client identifier for external use
          client_ref: `client_${Buffer.from(client.id).toString('base64').replace(/[+=\/]/g, '').substring(0, 12)}`,
          name: client.name,
          active: client.active,
          created_at: client.created_at,
          updated_at: client.updated_at
        },
        montyConnection,
        api_endpoints: {
          bundles: '/api/v0/Bundles',
          orders: '/api/v0/Orders',
          agents: '/api/v0/Agent',
          resellers: '/api/v0/Reseller',
          branches: '/api/v0/Branch',
          roles: '/api/v0/Role',
          networks: '/api/v0/NetworkList',
          issues: '/api/v0/IssueReport',
          vouchers: '/api/v0/Voucher',
          utilities: '/api/v0/utilities'
        }
      };

      // Sanitize response to remove any remaining sensitive data
      const sanitizedResponse = sanitizeObject(response);

      logger.info('Client info retrieved', {
        clientId: client.id,
        ip: req.ip
      });

      res.json(sanitizedResponse);

    } catch (error) {
      logger.error('Client info error', {
        error: error.message,
        ip: req.ip
      });
      next(error);
    }
  }
}

module.exports = new ClientController();