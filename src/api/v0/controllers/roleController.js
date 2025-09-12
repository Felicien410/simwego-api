
// =============================================================================
// src/controllers/roleController.js - Contrôleur Role (6 endpoints)
// =============================================================================
const ProxyService = require('../../../services/proxyHandler');

class RoleController {
  // POST /Role - Creates a new role
  async createRole(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Role');
  }

  // GET /Role/All - Returns all roles in platform
  async getAllRoles(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Role/All');
  }

  // DELETE /Role/{RoleID} - Deletes specific role by ID
  async deleteRole(req, res) {
    await ProxyService.proxyToMonty(req, res, `/Role/${req.params.RoleID}`);
  }

  // GET /Role/{RoleID} - Returns specific role by ID
  async getRoleById(req, res) {
    await ProxyService.proxyToMonty(req, res, `/Role/${req.params.RoleID}`);
  }

  // PUT /Role/{RoleID} - Edit Role
  async editRole(req, res) {
    await ProxyService.proxyToMonty(req, res, `/Role/${req.params.RoleID}`);
  }

  // PATCH /Roles/UMAP - Updates Monty Admin Permissions
  async updateMontyAdminPermissions(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Roles/UMAP');
  }
}

module.exports = new RoleController();