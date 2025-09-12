
// =============================================================================
// src/controllers/utilsController.js - Contrôleur Utilitaires (3 endpoints)
// =============================================================================
const ProxyService = require('../../../services/proxyHandler');

class UtilsController {
  // GET /Affiliate - Get Affiliate Program
  async getAffiliateProgram(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Affiliate');
  }

  // POST /Token/Refresh - Token Refresher
  async refreshToken(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Token/Refresh');
  }

  // GET /HealthCheck - Check Server
  async healthCheck(req, res) {
    await ProxyService.proxyToMonty(req, res, '/HealthCheck');
  }
}

module.exports = new UtilsController();