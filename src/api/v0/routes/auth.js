// src/api/v0/routes/auth.js - Authentication routes
const express = require('express');
const router = express.Router();

// Import middleware and controllers
const { clientAuth } = require('../../../middleware/passportAuth');
const authController = require('../controllers/authController');

// Login endpoint (no auth required)
router.post('/login', authController.login);

// Token validation (requires API key)
router.post('/validate', clientAuth, authController.validateToken);

// Logout (requires API key)
router.post('/logout', clientAuth, authController.logout);

module.exports = router;