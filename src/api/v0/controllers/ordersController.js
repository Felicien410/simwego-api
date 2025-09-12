
// =============================================================================
// src/controllers/ordersController.js - Contrôleur Orders COMPLET (12 endpoints)
// =============================================================================
const ProxyService = require('../../../services/proxyHandler');

class OrdersController {
  // GET /Orders - Get Order History ⭐ IMPORTANT
  async getOrderHistory(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Orders');
  }

  // GET /Orders/Consumption - Get Bundle Consumption
  async getBundleConsumption(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Orders/Consumption');
  }

  // GET /Orders/Dashboard - Get Dashboard ⭐ IMPORTANT
  async getDashboard(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Orders/Dashboard');
  }

  // GET /Orders/MyeSimConsumption - Get my Bundle Consumption
  async getMyBundleConsumption(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Orders/MyeSimConsumption');
  }

  // GET /Orders/PlanHistory - Get Plan History
  async getPlanHistory(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Orders/PlanHistory');
  }

  // POST /Orders/Refund - Refund Order ⭐ IMPORTANT
  async refundOrder(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Orders/Refund');
  }

  // POST /Orders/ResendEmail - Resend Order Email
  async resendOrderEmail(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Orders/ResendEmail');
  }

  // POST /Orders/SendConsumptionEmail - Send Consumption Email
  async sendConsumptionEmail(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Orders/SendConsumptionEmail');
  }

  // GET /Promocode - Get Promocode Order History
  async getPromocodeHistory(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Promocode');
  }

  // GET /Promocode/Dashboard - Get Promocode Dashboard
  async getPromocodeDashboard(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Promocode/Dashboard');
  }

  // GET /Transactions - Get Transaction History
  async getTransactionHistory(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Transactions');
  }

  // PUT /Transactions/{TransactionID} - Edit Transaction
  async editTransaction(req, res) {
    await ProxyService.proxyToMonty(req, res, `/Transactions/${req.params.TransactionID}`);
  }

  // POST /Orders - Create Order
  async createOrder(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Orders');
  }

  // GET /Orders/Stats - Get Order Stats
  async getOrderStats(req, res) {
    await ProxyService.proxyToMonty(req, res, '/Orders/Stats');
  }

  // GET /Orders/{OrderID} - Get Order by ID
  async getOrderById(req, res) {
    await ProxyService.proxyToMonty(req, res, `/Orders/${req.params.OrderID}`);
  }

  // PUT /Orders/{OrderID} - Update Order
  async updateOrder(req, res) {
    await ProxyService.proxyToMonty(req, res, `/Orders/${req.params.OrderID}`);
  }

  // DELETE /Orders/{OrderID} - Delete Order
  async deleteOrder(req, res) {
    await ProxyService.proxyToMonty(req, res, `/Orders/${req.params.OrderID}`);
  }
}

module.exports = new OrdersController();