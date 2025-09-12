// src/api/v0/routes/networks.js - Network management routes
const express = require('express');
const router = express.Router();
const networkController = require('../controllers/networkController');

// Network routes
router.get('/', networkController.getAllNetworkList);
router.get('/list', networkController.getNetworkList);
router.post('/list', networkController.manageNetworkList);
router.delete('/list/:network_id', networkController.deleteNetworkList);
router.get('/listbyregions', networkController.getNetworkListByRegions);
router.post('/listcsv', networkController.manageNetworksCSV);

module.exports = router;