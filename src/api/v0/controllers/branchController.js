
// =============================================================================
// src/controllers/branchController.js - Contrôleur Branch (5 endpoints)
// =============================================================================
const ProxyService = require('../../../services/proxyHandler');

class BranchController {
  // GET /Branch - Gets all Branches
  async getBranches(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Branch');
  }

  // POST /Branch - Adds a Branch to platform
  async addBranch(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Branch');
  }

  // DELETE /Branch/{BranchID} - Delete Branch
  async deleteBranch(req, res) {
    await ProxyService.proxyToMonty(req, res, `/Branch/${req.params.BranchID}`);
  }

  // GET /Branch/{BranchID} - Gets Branch by ID
  async getBranchById(req, res) {
    await ProxyService.proxyToMonty(req, res, `/Branch/${req.params.BranchID}`);
  }

  // PUT /Branch/{BranchID} - Edit Branch
  async editBranch(req, res) {
    await ProxyService.proxyToMonty(req, res, `/Branch/${req.params.BranchID}`);
  }
}

module.exports = new BranchController();

