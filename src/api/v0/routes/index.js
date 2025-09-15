// src/api/v0/routes/index.js - API v1 routes
const express = require('express');
const router = express.Router();

// Import middleware
const { apiKeyOnly, apiKey } = require('../../../middleware/auth');

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

// Client info routes (requires API key authentication)
router.get('/client/info', apiKeyOnly, require('../controllers/clientController').getInfo);

// Auth routes (login doesn't require auth, others do)
router.use('/auth', authRoutes);

// API routes (all require API key authentication)
router.use('/bundles', apiKey, bundlesRoutes);

// Global routes (countries, currencies, regions)
router.get('/AvailableCountries', apiKey, require('../controllers/bundlesController').getCountries);
router.get('/AvailableCurrencies', apiKey, require('../controllers/bundlesController').getCurrencies);
router.post('/AvailableCurrencies', apiKey, require('../controllers/bundlesController').manageCurrencies);
router.post('/AvailableCurrenciesCSV', apiKey, require('../controllers/bundlesController').manageCurrenciesCSV);
router.get('/AvailableRegions', apiKey, require('../controllers/bundlesController').getRegions);
router.get('/v2/Bundles/Topup', apiKey, require('../controllers/bundlesController').getCompatibleTopupV2);
router.use('/orders', apiKey, ordersRoutes);
router.use('/agents', apiKeyOnly, agentsRoutes);
router.use('/resellers', apiKeyOnly, resellersRoutes);
router.get('/Reseller/Bundles/Scope', apiKey, require('../controllers/resellerController').getResellerBundlesScope);
router.use('/branches', apiKeyOnly, branchesRoutes);
router.use('/roles', apiKeyOnly, rolesRoutes);
router.use('/networks', apiKeyOnly, networksRoutes);
router.use('/issues', apiKeyOnly, issuesRoutes);
router.use('/vouchers', apiKeyOnly, vouchersRoutes);
router.use('/utilities', apiKeyOnly, utilitiesRoutes);

module.exports = router;