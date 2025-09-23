
// =============================================================================
// src/controllers/roleController.js - Contrôleur Role (6 endpoints)
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

class RoleController {
  // POST /Role - Creates a new role
  async createRole(req, res) {
    // Validation d'input
    const validation = validateProxyInput(req, res, () => {});
    if (validation) return validation;
    
   
    await ProxyService.proxyToMonty(req, res, '/Role');
  }

  // GET /Role/All - Returns all roles in platform
  async getAllRoles(req, res) {
    // Validation d'input
    const validation = validateProxyInput(req, res, () => {});
    if (validation) return validation;
    
   
    await ProxyService.proxyToMonty(req, res, '/Role/All');
  }

  // DELETE /Role/{RoleID} - Deletes specific role by ID
  async deleteRole(req, res) {
    // Validation d'input
    const validation = validateProxyInput(req, res, () => {});
    if (validation) return validation;
    
   
    await ProxyService.proxyToMonty(req, res, `/Role/${req.params.RoleID}`);
  }

  // GET /Role/{RoleID} - Returns specific role by ID
  async getRoleById(req, res) {
    // Validation d'input
    const validation = validateProxyInput(req, res, () => {});
    if (validation) return validation;
    
   
    await ProxyService.proxyToMonty(req, res, `/Role/${req.params.RoleID}`);
  }

  // PUT /Role/{RoleID} - Edit Role
  async editRole(req, res) {
    // Validation d'input
    const validation = validateProxyInput(req, res, () => {});
    if (validation) return validation;
    
   
    await ProxyService.proxyToMonty(req, res, `/Role/${req.params.RoleID}`);
  }

  // PATCH /Roles/UMAP - Updates Monty Admin Permissions
  async updateMontyAdminPermissions(req, res) {
    // Validation d'input
    const validation = validateProxyInput(req, res, () => {});
    if (validation) return validation;
    
   
    await ProxyService.proxyToMonty(req, res, '/Roles/UMAP');
  }
}

module.exports = new RoleController();