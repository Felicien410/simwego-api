// src/api/v0/routes/index.js - API v1 routes
const express = require('express');
const router = express.Router();

// Import Passport middleware
const { clientAuth, clientAuthWithMonty } = require('../../../middleware/passportAuth');

// Import route modules
const authRoutes = require('./auth');
const bundlesRoutes = require('./bundles');
const ordersRoutes = require('./orders');
const agentsRoutes = require('./agents');
const resellersRoutes = require('./resellers');
const branchesRoutes = require('./branches');
const rolesRoutes = require('./roles');
const networksRoutes = require('./networks');
const issuesRoutes = require('./issues');
const vouchersRoutes = require('./vouchers');
const utilitiesRoutes = require('./utilities');

// Client info routes (requires API key authentication with Passport)
router.get('/client/info', clientAuth, require('../controllers/clientController').getInfo);

// Health check endpoint that tests Monty connection
router.get('/HealthCheck', clientAuthWithMonty, require('../controllers/utilsController').healthCheck);

// Auth routes (login doesn't require auth, others do)
router.use('/auth', authRoutes);

// API routes (Monty convention with capitals) - all require Monty authentication
router.use('/Bundles', clientAuthWithMonty, bundlesRoutes);
router.use('/Orders', clientAuthWithMonty, ordersRoutes);
router.use('/Agent', clientAuthWithMonty, agentsRoutes);
router.use('/Reseller', clientAuthWithMonty, resellersRoutes);
router.use('/Branch', clientAuthWithMonty, branchesRoutes);
router.use('/Role', clientAuthWithMonty, rolesRoutes);
router.use('/NetworkList', clientAuthWithMonty, networksRoutes);
router.use('/IssueReport', clientAuthWithMonty, issuesRoutes);
router.use('/Voucher', clientAuthWithMonty, vouchersRoutes);

// Global routes (countries, currencies, regions)
router.get('/AvailableCountries', clientAuthWithMonty, require('../controllers/bundlesController').getCountries);
router.get('/AvailableCurrencies', clientAuthWithMonty, require('../controllers/bundlesController').getCurrencies);
router.post('/AvailableCurrencies', clientAuthWithMonty, require('../controllers/bundlesController').manageCurrencies);
router.post('/AvailableCurrenciesCSV', clientAuthWithMonty, require('../controllers/bundlesController').manageCurrenciesCSV);
router.get('/AvailableRegions', clientAuthWithMonty, require('../controllers/bundlesController').getRegions);
router.get('/v2/Bundles/Topup', clientAuthWithMonty, require('../controllers/bundlesController').getCompatibleTopupV2);
router.get('/Reseller/Bundles/Scope', clientAuthWithMonty, require('../controllers/resellerController').getResellerBundlesScope);

// Utility routes
router.use('/utilities', clientAuth, utilitiesRoutes);

module.exports = router;