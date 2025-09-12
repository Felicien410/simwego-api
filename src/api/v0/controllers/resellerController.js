// =============================================================================
// src/controllers/resellerController.js - Contrôleur Reseller (11 endpoints)
// =============================================================================
const ProxyService = require('../../../services/proxyHandler');

class ResellerController {
  // GET /Reseller - Gets all Resellers
  async getResellers(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Reseller');
  }

  // POST /Reseller - Adds a Reseller to platform
  async addReseller(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Reseller');
  }

  // POST /Reseller/Admin/custom_corporate_price - Customize Bundle Unit Price
  async customizeCorporatePrice(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Reseller/Admin/custom_corporate_price');
  }

  // POST /Reseller/Admin/custom_corporate_price_csv - Customize Bundle Unit Price CSV
  async customizeCorporatePriceCSV(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Reseller/Admin/custom_corporate_price_csv');
  }

  // GET /Reseller/AvailableResellerProperties - Get available properties
  async getAvailableProperties(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Reseller/AvailableResellerProperties');
  }

  // POST /Reseller/Topup/{ResellerID} - Topup Reseller Balance
  async topupResellerBalance(req, res) {
    await ProxyService.proxyToMonty(req, res, `/Reseller/Topup/${req.params.ResellerID}`);
  }

  // POST /Reseller/custom_price - Customize Bundle Price
  async customizePrice(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Reseller/custom_price');
  }

  // POST /Reseller/custom_price_csv - Customize Bundle Price CSV
  async customizePriceCSV(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Reseller/custom_price_csv');
  }

  // DELETE /Reseller/{ResellerID} - Delete Reseller
  async deleteReseller(req, res) {
    await ProxyService.proxyToMonty(req, res, `/Reseller/${req.params.ResellerID}`);
  }

  // GET /Reseller/{ResellerID} - Gets Reseller by ID
  async getResellerById(req, res) {
    await ProxyService.proxyToMonty(req, res, `/Reseller/${req.params.ResellerID}`);
  }

  // PUT /Reseller/{ResellerID} - Edit Reseller
  async editReseller(req, res) {
    await ProxyService.proxyToMonty(req, res, `/Reseller/${req.params.ResellerID}`);
  }

  // GET /Reseller/Bundles/Scope - Get reseller bundles grouped by scope
  async getResellerBundlesScope(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Reseller/Bundles/Scope');
  }
}

module.exports = new ResellerController();