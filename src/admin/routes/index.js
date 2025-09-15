// src/admin/routes/index.js - Admin routes
const express = require('express');
const router = express.Router();

// Import middleware
const { adminJwt } = require('../../middleware/auth');

// Import controllers
const statsController = require('../controllers/statsController');
const clientController = require('../controllers/clientController');

// All admin routes require JWT authentication
router.use(adminJwt);

// Stats routes
router.get('/stats', statsController.getStats);

// Client management routes
router.get('/clients', clientController.listClients);
router.post('/clients', clientController.createClient);
router.get('/clients/:id', clientController.getClient);
router.put('/clients/:id', clientController.updateClient);
router.delete('/clients/:id', clientController.deleteClient);
router.post('/clients/:id/test', clientController.testMontyConnection);

module.exports = router;