
// =============================================================================
// src/controllers/voucherController.js - Contrôleur Voucher (5 endpoints)
// =============================================================================
const ProxyService = require('../../../services/proxyHandler');

class VoucherController {
  // GET /Voucher - Get Vouchers Generated
  async getVouchers(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Voucher');
  }

  // GET /Voucher/Details - Get Vouchers Generated Details
  async getVoucherDetails(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Voucher/Details');
  }

  // PATCH /Voucher/Details - Updates Voucher Attributes
  async updateVoucherDetails(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Voucher/Details');
  }

  // POST /Voucher/Generate - Generate Voucher
  async generateVoucher(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Voucher/Generate');
  }

  // GET /Voucher/History - Get Voucher Use History
  async getVoucherHistory(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Voucher/History');
  }
}

module.exports = new VoucherController();