// src/api/v0/routes/auth.js - Authentication routes
const express = require('express');
const router = express.Router();

// Import middleware and controllers
const { apiKeyAuth } = require('../../../middleware/auth');
const authController = require('../controllers/authController');

// Login endpoint (no auth required)
router.post('/login', authController.login);

// Token validation (requires API key)
router.post('/validate', apiKeyAuth, authController.validateToken);

// Logout (requires API key)
router.post('/logout', apiKeyAuth, authController.logout);

module.exports = router;