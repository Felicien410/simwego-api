
// =============================================================================
// src/controllers/bundlesController.js - Contrôleur Bundles COMPLET (18 endpoints)
// =============================================================================
const ProxyService = require('../../../services/proxyHandler');

class BundlesController {
  // GET /AvailableCountries - Get all countries Available
  async getCountries(req, res) {
    await ProxyService.proxyToMonty(req, res, '/AvailableCountries');
  }

  // GET /AvailableCurrencies - Get all currencies Available
  async getCurrencies(req, res) {
    await ProxyService.proxyToMonty(req, res, '/AvailableCurrencies');
  }

  // POST /AvailableCurrencies - Manage Currencies
  async manageCurrencies(req, res) {
    await ProxyService.proxyToMonty(req, res, '/AvailableCurrencies');
  }

  // POST /AvailableCurrenciesCSV - Manage Currencies CSV
  async manageCurrenciesCSV(req, res) {
    await ProxyService.proxyToMonty(req, res, '/AvailableCurrenciesCSV');
  }

  // GET /AvailableRegions - Get all regions Available
  async getRegions(req, res) {
    await ProxyService.proxyToMonty(req, res, '/AvailableRegions');
  }

  // GET /Bundles - Get all country bundles Available ⭐ CRITIQUE
  async getBundles(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Bundles');
  }

  // POST /Bundles - Assign Bundle ⭐ CRITIQUE
  async assignBundle(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Bundles');
  }

  // GET /Bundles/AvailableTopup - Get available topup bundles
  async getAvailableTopup(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Bundles/AvailableTopup');
  }

  // GET /Bundles/CSV - Get bundles CSV
  async getBundlesCSV(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Bundles/CSV');
  }

  // POST /Bundles/Cancel - Cancel Order ⭐ CRITIQUE
  async cancelBundle(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Bundles/Cancel');
  }

  // POST /Bundles/Complete - Complete transaction ⭐ CRITIQUE
  async completeTransaction(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Bundles/Complete');
  }

  // GET /Bundles/Networks - Gets bundle network list
  async getBundleNetworks(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Bundles/Networks');
  }

  // POST /Bundles/Reserve - Reserve Bundle ⭐ CRITIQUE
  async reserveBundle(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Bundles/Reserve');
  }

  // GET /Bundles/Topup - Get compatible topup bundles
  async getCompatibleTopup(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Bundles/Topup');
  }

  // POST /Bundles/Topup - Topup Bundle ⭐ CRITIQUE
  async topupBundle(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Bundles/Topup');
  }

  // GET /Bundles/V2 - Get bundles V2
  async getBundlesV2(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Bundles/V2');
  }

  // GET /Reseller/Bundles/Scope - Get reseller bundles by scope
  async getResellerBundlesByScope(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Reseller/Bundles/Scope');
  }

  // GET /v2/Bundles/Topup - Get compatible topup bundles V2
  async getCompatibleTopupV2(req, res) {
    await ProxyService.proxyToMonty(req, res, '/v2/Bundles/Topup');
  }
}

module.exports = new BundlesController();