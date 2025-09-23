// =============================================================================
// src/controllers/agentController.js - Contrôleur Agent COMPLET (10 endpoints)
// =============================================================================
const ProxyService = require('../../../services/proxyHandler');



// Middleware de validation pour les requêtes proxy
function validateProxyInput(req, res, next) {
  const { body, query, params } = req;
  
  // Validation basique des inputs
  const allInputs = { ...body, ...query, ...params };
  
  for (const [key, value] of Object.entries(allInputs)) {
    if (typeof value === 'string') {
      // Vérifier les patterns dangereux
      const dangerousPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /('|(\-\-)|;|\||\*|%|=)/gi
      ];
      
      for (const pattern of dangerousPatterns) {
        if (pattern.test(value)) {
          return res.status(400).json({
            error: 'Invalid input detected',
            message: 'Request contains potentially dangerous content'
          });
        }
      }
      
      // Limiter la taille des inputs
      if (value.length > 1000) {
        return res.status(400).json({
          error: 'Input too large',
          message: 'Individual input fields cannot exceed 1000 characters'
        });
      }
    }
  }
  
  next();
}

class AgentController {
  // GET /Agent - Gets all Agents
  async getAgents(req, res) {
    // Validation d'input
    const validation = validateProxyInput(req, res, () => {});
    if (validation) return validation;
    
   
    await ProxyService.proxyToMonty(req, res, '/Agent');
  }

  // POST /Agent - Add Agent to Branch
  async addAgent(req, res) {
    // Validation d'input
    const validation = validateProxyInput(req, res, () => {});
    if (validation) return validation;
    
   
    await ProxyService.proxyToMonty(req, res, '/Agent');
  }

  // POST /Agent/GetAgentByEmail - Gets Agent by Email
  async getAgentByEmail(req, res) {
    // Validation d'input
    const validation = validateProxyInput(req, res, () => {});
    if (validation) return validation;
    
   
    await ProxyService.proxyToMonty(req, res, '/Agent/GetAgentByEmail');
  }

  // POST /Agent/forgot-password - Submit forgot Password request
  async forgotPassword(req, res) {
    // Validation d'input
    const validation = validateProxyInput(req, res, () => {});
    if (validation) return validation;
    
   
    await ProxyService.proxyToMonty(req, res, '/Agent/forgot-password');
  }


  // POST /Agent/reset-password - Resets User Password
  async resetPassword(req, res) {
    // Validation d'input
    const validation = validateProxyInput(req, res, () => {});
    if (validation) return validation;
    
   
    await ProxyService.proxyToMonty(req, res, '/Agent/reset-password');
  }

  // DELETE /Agent/{AgentID} - Delete Agent
  async deleteAgent(req, res) {
    // Validation d'input
    const validation = validateProxyInput(req, res, () => {});
    if (validation) return validation;
    
   
    await ProxyService.proxyToMonty(req, res, `/Agent/${req.params.AgentID}`);
  }

  // GET /Agent/{AgentID} - Gets Agent by ID
  async getAgentById(req, res) {
    // Validation d'input
    const validation = validateProxyInput(req, res, () => {});
    if (validation) return validation;
    
   
    await ProxyService.proxyToMonty(req, res, `/Agent/${req.params.AgentID}`);
  }

  // PUT /Agent/{AgentID} - Edit Agent
  async editAgent(req, res) {
    // Validation d'input
    const validation = validateProxyInput(req, res, () => {});
    if (validation) return validation;
    
   
    await ProxyService.proxyToMonty(req, res, `/Agent/${req.params.AgentID}`);
  }
}

module.exports = new AgentController();
