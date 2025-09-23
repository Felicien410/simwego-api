// =============================================================================
// src/controllers/resellerController.js - Contrôleur Reseller (11 endpoints)
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

class ResellerController {
  // GET /Reseller - Gets all Resellers
  async getResellers(req, res) {
    // Validation d'input
    const validation = validateProxyInput(req, res, () => {});
    if (validation) return validation;
    
   
    await ProxyService.proxyToMonty(req, res, '/Reseller');
  }

  // POST /Reseller - Adds a Reseller to platform
  async addReseller(req, res) {
    // Validation d'input
    const validation = validateProxyInput(req, res, () => {});
    if (validation) return validation;
    
   
    await ProxyService.proxyToMonty(req, res, '/Reseller');
  }

  // POST /Reseller/Admin/custom_corporate_price - Customize Bundle Unit Price
  async customizeCorporatePrice(req, res) {
    // Validation d'input
    const validation = validateProxyInput(req, res, () => {});
    if (validation) return validation;
    
   
    await ProxyService.proxyToMonty(req, res, '/Reseller/Admin/custom_corporate_price');
  }

  // POST /Reseller/Admin/custom_corporate_price_csv - Customize Bundle Unit Price CSV
  async customizeCorporatePriceCSV(req, res) {
    // Validation d'input
    const validation = validateProxyInput(req, res, () => {});
    if (validation) return validation;
    
   
    await ProxyService.proxyToMonty(req, res, '/Reseller/Admin/custom_corporate_price_csv');
  }

  // GET /Reseller/AvailableResellerProperties - Get available properties
  async getAvailableProperties(req, res) {
    // Validation d'input
    const validation = validateProxyInput(req, res, () => {});
    if (validation) return validation;
    
   
    await ProxyService.proxyToMonty(req, res, '/Reseller/AvailableResellerProperties');
  }

  // POST /Reseller/Topup/{ResellerID} - Topup Reseller Balance
  async topupResellerBalance(req, res) {
    // Validation d'input
    const validation = validateProxyInput(req, res, () => {});
    if (validation) return validation;
    
   
    await ProxyService.proxyToMonty(req, res, `/Reseller/Topup/${req.params.ResellerID}`);
  }

  // POST /Reseller/custom_price - Customize Bundle Price
  async customizePrice(req, res) {
    // Validation d'input
    const validation = validateProxyInput(req, res, () => {});
    if (validation) return validation;
    
   
    await ProxyService.proxyToMonty(req, res, '/Reseller/custom_price');
  }

  // POST /Reseller/custom_price_csv - Customize Bundle Price CSV
  async customizePriceCSV(req, res) {
    // Validation d'input
    const validation = validateProxyInput(req, res, () => {});
    if (validation) return validation;
    
   
    await ProxyService.proxyToMonty(req, res, '/Reseller/custom_price_csv');
  }

  // DELETE /Reseller/{ResellerID} - Delete Reseller
  async deleteReseller(req, res) {
    // Validation d'input
    const validation = validateProxyInput(req, res, () => {});
    if (validation) return validation;
    
   
    await ProxyService.proxyToMonty(req, res, `/Reseller/${req.params.ResellerID}`);
  }

  // GET /Reseller/{ResellerID} - Gets Reseller by ID
  async getResellerById(req, res) {
    // Validation d'input
    const validation = validateProxyInput(req, res, () => {});
    if (validation) return validation;
    
   
    await ProxyService.proxyToMonty(req, res, `/Reseller/${req.params.ResellerID}`);
  }

  // PUT /Reseller/{ResellerID} - Edit Reseller
  async editReseller(req, res) {
    // Validation d'input
    const validation = validateProxyInput(req, res, () => {});
    if (validation) return validation;
    
   
    await ProxyService.proxyToMonty(req, res, `/Reseller/${req.params.ResellerID}`);
  }

  // GET /Reseller/Bundles/Scope - Get reseller bundles grouped by scope
  async getResellerBundlesScope(req, res) {
    // Validation d'input
    const validation = validateProxyInput(req, res, () => {});
    if (validation) return validation;
    
   
    await ProxyService.proxyToMonty(req, res, '/Reseller/Bundles/Scope');
  }
}

module.exports = new ResellerController();