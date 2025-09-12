// src/api/v0/routes/utilities.js - Utility routes
const express = require('express');
const router = express.Router();
const utilsController = require('../controllers/utilsController');

// Utility routes
router.get('/affiliate', utilsController.getAffiliateProgram);
router.post('/token/refresh', utilsController.refreshToken);
router.get('/health', utilsController.healthCheck);

module.exports = router;