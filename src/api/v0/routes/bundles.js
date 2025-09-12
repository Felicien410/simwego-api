// src/api/v0/routes/bundles.js - Bundle management routes
const express = require('express');
const router = express.Router();
const bundlesController = require('../controllers/bundlesController');

// Core Bundle routes
router.get('/', bundlesController.getBundles);
router.post('/', bundlesController.assignBundle);

// Available data routes
router.get('/AvailableTopup', bundlesController.getAvailableTopup);
router.get('/CSV', bundlesController.getBundlesCSV);

// Transaction routes
router.post('/Cancel', bundlesController.cancelBundle);
router.post('/Complete', bundlesController.completeTransaction);
router.post('/Reserve', bundlesController.reserveBundle);

// Network and compatibility routes
router.get('/Networks', bundlesController.getBundleNetworks);
router.get('/Topup', bundlesController.getCompatibleTopup);
router.post('/Topup', bundlesController.topupBundle);

// Version 2 routes
router.get('/V2', bundlesController.getBundlesV2);

module.exports = router;