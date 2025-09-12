// =============================================================================
// src/controllers/agentController.js - Contrôleur Agent COMPLET (10 endpoints)
// =============================================================================
const ProxyService = require('../../../services/proxyHandler');

class AgentController {
  // GET /Agent - Gets all Agents
  async getAgents(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Agent');
  }

  // POST /Agent - Add Agent to Branch
  async addAgent(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Agent');
  }

  // POST /Agent/GetAgentByEmail - Gets Agent by Email
  async getAgentByEmail(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Agent/GetAgentByEmail');
  }

  // POST /Agent/forgot-password - Submit forgot Password request
  async forgotPassword(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Agent/forgot-password');
  }


  // POST /Agent/reset-password - Resets User Password
  async resetPassword(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Agent/reset-password');
  }

  // DELETE /Agent/{AgentID} - Delete Agent
  async deleteAgent(req, res) {
    await ProxyService.proxyToMonty(req, res, `/Agent/${req.params.AgentID}`);
  }

  // GET /Agent/{AgentID} - Gets Agent by ID
  async getAgentById(req, res) {
    await ProxyService.proxyToMonty(req, res, `/Agent/${req.params.AgentID}`);
  }

  // PUT /Agent/{AgentID} - Edit Agent
  async editAgent(req, res) {
    await ProxyService.proxyToMonty(req, res, `/Agent/${req.params.AgentID}`);
  }
}

module.exports = new AgentController();
