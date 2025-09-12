// src/admin/controllers/statsController.js - Admin statistics controller
const { logger } = require('../../config/database');

class StatsController {
  async getStats(req, res, next) {
    try {
      // Get models from app
      const models = req.app.get('models');
      const Client = models.Client;
      const TokenCache = models.TokenCache;
      
      // Get client statistics
      const totalClients = await Client.count();
      const activeClients = await Client.count({
        where: {
          active: true
        }
      });
      
      // Get token statistics
      const tokenStats = await TokenCache.getCacheStats();
      
      // Get recent client activity
      const recentClients = await Client.findAll({
        limit: 10,
        order: [['updatedAt', 'DESC']],
        attributes: ['id', 'name', 'active', 'createdAt', 'updatedAt']
      });

      const stats = {
        clients: {
          total: totalClients,
          active: activeClients,
          inactive: totalClients - activeClients
        },
        tokens: tokenStats,
        recent_activity: recentClients.map(client => ({
          id: client.id,
          name: client.name,
          active: client.active,
          created_at: client.createdAt,
          updated_at: client.updatedAt
        })),
        system: {
          uptime: process.uptime(),
          memory_usage: process.memoryUsage(),
          node_version: process.version,
          platform: process.platform
        },
        timestamp: new Date().toISOString()
      };

      logger.info('Admin stats retrieved', {
        adminId: req.admin.id,
        ip: req.ip
      });

      res.json(stats);

    } catch (error) {
      logger.error('Stats retrieval error', {
        error: error.message,
        adminId: req.admin?.id,
        ip: req.ip
      });
      next(error);
    }
  }
}

module.exports = new StatsController();