
// =============================================================================
// src/controllers/branchController.js - Contrôleur Branch (5 endpoints)
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

class BranchController {
  // GET /Branch - Gets all Branches
  async getBranches(req, res) {
    // Validation d'input
    const validation = validateProxyInput(req, res, () => {});
    if (validation) return validation;
    
   
    await ProxyService.proxyToMonty(req, res, '/Branch');
  }

  // POST /Branch - Adds a Branch to platform
  async addBranch(req, res) {
    // Validation d'input
    const validation = validateProxyInput(req, res, () => {});
    if (validation) return validation;
    
   
    await ProxyService.proxyToMonty(req, res, '/Branch');
  }

  // DELETE /Branch/{BranchID} - Delete Branch
  async deleteBranch(req, res) {
    // Validation d'input
    const validation = validateProxyInput(req, res, () => {});
    if (validation) return validation;
    
   
    await ProxyService.proxyToMonty(req, res, `/Branch/${req.params.BranchID}`);
  }

  // GET /Branch/{BranchID} - Gets Branch by ID
  async getBranchById(req, res) {
    // Validation d'input
    const validation = validateProxyInput(req, res, () => {});
    if (validation) return validation;
    
   
    await ProxyService.proxyToMonty(req, res, `/Branch/${req.params.BranchID}`);
  }

  // PUT /Branch/{BranchID} - Edit Branch
  async editBranch(req, res) {
    // Validation d'input
    const validation = validateProxyInput(req, res, () => {});
    if (validation) return validation;
    
   
    await ProxyService.proxyToMonty(req, res, `/Branch/${req.params.BranchID}`);
  }
}

module.exports = new BranchController();

