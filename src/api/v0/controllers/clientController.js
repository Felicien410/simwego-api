// src/api/v0/controllers/clientController.js - Client information controller
const { logger } = require('../../../config/database');

class ClientController {
  async getInfo(req, res, next) {
    try {
      const client = req.client;
      
      if (!client) {
        return res.status(404).json({
          error: 'Client not found',
          message: 'No client information available for this API key'
        });
      }

      // Return client information with expected structure
      const response = {
        client: {
          id: client.id,
          name: client.name,
          monty_username: client.monty_username,
          active: client.active,
          created_at: client.createdAt,
          updated_at: client.updatedAt
        },
        montyConnection: {
          authenticated: true,
          agentId: 'test-agent-id', // Mock value for now
          resellerId: 'test-reseller-id' // Mock value for now
        },
        api_endpoints: {
          bundles: '/api/v0/bundles',
          orders: '/api/v0/orders',
          agents: '/api/v0/agents',
          resellers: '/api/v0/resellers',
          branches: '/api/v0/branches',
          roles: '/api/v0/roles',
          networks: '/api/v0/networks',
          issues: '/api/v0/issues',
          vouchers: '/api/v0/vouchers',
          utilities: '/api/v0/utilities'
        }
      };

      logger.info('Client info retrieved', {
        clientId: client.id,
        ip: req.ip
      });

      res.json(response);

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