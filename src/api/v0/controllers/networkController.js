const ProxyService = require('../../../services/proxyHandler');

class NetworkController {
  // GET /AllNetworkList - Gets all Network lists for bundles
  async getAllNetworkList(req, res) {
    await ProxyService.proxyToMonty(req, res, '/AllNetworkList');
  }

  // GET /NetworkList - Gets all Network lists
  async getNetworkList(req, res) {
    await ProxyService.proxyToMonty(req, res, '/NetworkList');
  }

  // POST /NetworkList - Manage network lists to branch
  async manageNetworkList(req, res) {
    await ProxyService.proxyToMonty(req, res, '/NetworkList');
  }

  // DELETE /NetworkList/{network_id} - Delete NetworkList
  async deleteNetworkList(req, res) {
    await ProxyService.proxyToMonty(req, res, `/NetworkList/${req.params.network_id}`);
  }

  // GET /NetworkListByRegions - Gets Network lists by regions
  async getNetworkListByRegions(req, res) {
    await ProxyService.proxyToMonty(req, res, '/NetworkListByRegions');
  }

  // POST /NetworkListCSV - Manage Networks CSV
  async manageNetworksCSV(req, res) {
    await ProxyService.proxyToMonty(req, res, '/NetworkListCSV');
  }
}

module.exports = new NetworkController();
