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

class NetworkController {
  // GET /AllNetworkList - Gets all Network lists for bundles
  async getAllNetworkList(req, res) {
    // Validation d'input
    const validation = validateProxyInput(req, res, () => {});
    if (validation) return validation;
    
   
    await ProxyService.proxyToMonty(req, res, '/AllNetworkList');
  }

  // GET /NetworkList - Gets all Network lists
  async getNetworkList(req, res) {
    // Validation d'input
    const validation = validateProxyInput(req, res, () => {});
    if (validation) return validation;
    
   
    await ProxyService.proxyToMonty(req, res, '/NetworkList');
  }

  // POST /NetworkList - Manage network lists to branch
  async manageNetworkList(req, res) {
    // Validation d'input
    const validation = validateProxyInput(req, res, () => {});
    if (validation) return validation;
    
   
    await ProxyService.proxyToMonty(req, res, '/NetworkList');
  }

  // DELETE /NetworkList/{network_id} - Delete NetworkList
  async deleteNetworkList(req, res) {
    // Validation d'input
    const validation = validateProxyInput(req, res, () => {});
    if (validation) return validation;
    
   
    await ProxyService.proxyToMonty(req, res, `/NetworkList/${req.params.network_id}`);
  }

  // GET /NetworkListByRegions - Gets Network lists by regions
  async getNetworkListByRegions(req, res) {
    // Validation d'input
    const validation = validateProxyInput(req, res, () => {});
    if (validation) return validation;
    
   
    await ProxyService.proxyToMonty(req, res, '/NetworkListByRegions');
  }

  // POST /NetworkListCSV - Manage Networks CSV
  async manageNetworksCSV(req, res) {
    // Validation d'input
    const validation = validateProxyInput(req, res, () => {});
    if (validation) return validation;
    
   
    await ProxyService.proxyToMonty(req, res, '/NetworkListCSV');
  }
}

module.exports = new NetworkController();
