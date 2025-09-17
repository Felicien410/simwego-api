// src/api/v0/routes/client.js - Client information routes with security middleware
const express = require('express');
const router = express.Router();

// Import middleware and controllers
const { authenticateClient } = require('../../../config/passport');
const { requireOwnResource, auditAccess, sanitizeResponse } = require('../../../middleware/security');
const clientController = require('../controllers/clientController');

// All routes require authentication and sanitize responses
router.use(authenticateClient);
router.use(sanitizeResponse);

// Get client info (secured)
router.get('/info', 
  auditAccess('client_info'),
  clientController.getInfo
);

// Future routes for client-specific data
// router.get('/:clientId/data', 
//   requireOwnResource,
//   auditAccess('client_data'),
//   clientController.getClientData
// );

module.exports = router;