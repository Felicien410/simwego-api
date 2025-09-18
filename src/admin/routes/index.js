// src/admin/routes/index.js - Admin routes
const express = require('express');
const router = express.Router();

// Import middleware
const { adminAuth } = require('../../middleware/passportAuth');
const { 
  strictInputValidation, 
  validateClientCreation, 
  validateClientUpdate,
  handleValidationErrors,
  validateUUID 
} = require('../../middleware/inputValidation');

// Import controllers
const statsController = require('../controllers/statsController');
const clientController = require('../controllers/clientController');

// All admin routes require JWT authentication
router.use(adminAuth);

// Global strict input validation for ALL admin routes
router.use(strictInputValidation);

// Stats routes
router.get('/stats', statsController.getStats);

// Client management routes
router.get('/clients', clientController.listClients);
router.post('/clients', validateClientCreation, handleValidationErrors, clientController.createClient);
router.get('/clients/:id', validateUUID('id'), clientController.getClient);
router.put('/clients/:id', validateUUID('id'), validateClientUpdate, handleValidationErrors, clientController.updateClient);
router.delete('/clients/:id', validateUUID('id'), clientController.deleteClient);
router.post('/clients/:id/test', validateUUID('id'), clientController.testMontyConnection);

module.exports = router;