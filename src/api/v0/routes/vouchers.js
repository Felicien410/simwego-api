// src/api/v0/routes/vouchers.js - Voucher management routes
const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucherController');

// Voucher routes
router.get('/', voucherController.getVouchers);
router.get('/details', voucherController.getVoucherDetails);
router.patch('/details', voucherController.updateVoucherDetails);
router.post('/generate', voucherController.generateVoucher);
router.get('/history', voucherController.getVoucherHistory);

module.exports = router;