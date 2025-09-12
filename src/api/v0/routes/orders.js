// src/api/v0/routes/orders.js - Order management routes
const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/ordersController');

// Order routes
router.get('/', ordersController.getOrderHistory);
router.get('/Consumption', ordersController.getBundleConsumption);
router.get('/Dashboard', ordersController.getDashboard);
router.get('/MyeSimConsumption', ordersController.getMyBundleConsumption);
router.get('/PlanHistory', ordersController.getPlanHistory);
router.post('/Refund', ordersController.refundOrder);
router.post('/ResendEmail', ordersController.resendOrderEmail);
router.post('/SendConsumptionEmail', ordersController.sendConsumptionEmail);

// Promocode routes  
router.get('/Promocode', ordersController.getPromocodeHistory);
router.get('/Promocode/Dashboard', ordersController.getPromocodeDashboard);

// Transaction routes
router.get('/Transactions', ordersController.getTransactionHistory);
router.put('/Transactions/:TransactionID', ordersController.editTransaction);

module.exports = router;