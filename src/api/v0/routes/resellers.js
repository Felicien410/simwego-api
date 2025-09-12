// src/api/v0/routes/resellers.js - Reseller management routes
const express = require('express');
const router = express.Router();
const resellerController = require('../controllers/resellerController');

// Reseller routes
router.get('/', resellerController.getResellers);
router.post('/', resellerController.addReseller);

// Admin pricing routes
router.post('/Admin/custom_corporate_price', resellerController.customizeCorporatePrice);
router.post('/Admin/custom_corporate_price_csv', resellerController.customizeCorporatePriceCSV);

// Properties route
router.get('/AvailableResellerProperties', resellerController.getAvailableProperties);

// Pricing routes
router.post('/custom_price', resellerController.customizePrice);
router.post('/custom_price_csv', resellerController.customizePriceCSV);

// Reseller-specific routes with ID
router.delete('/:ResellerID', resellerController.deleteReseller);
router.get('/:ResellerID', resellerController.getResellerById);
router.put('/:ResellerID', resellerController.editReseller);
router.post('/Topup/:ResellerID', resellerController.topupResellerBalance);

module.exports = router;