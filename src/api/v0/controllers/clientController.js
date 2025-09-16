// src/api/v0/controllers/clientController.js - Client information controller
const { logger } = require('../../../config/database');

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

      // Return client information with expected structure (manual because Passport client is plain object)
      const response = {
        client: {
          id: client.id,
          name: client.name,
          api_key: client.api_key,
          active: client.active,
          monty_username: client.monty_username,
          created_at: client.created_at,
          updated_at: client.updated_at
        },
        montyConnection: {
          authenticated: true,
          agentId: 'test-agent-id', // Mock value for now
          resellerId: 'test-reseller-id' // Mock value for now
        },
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