// src/api/v0/routes/index.js - API v1 routes
const express = require('express');
const router = express.Router();

// Import middleware
const { apiKeyAuth } = require('../../../middleware/auth');
const montyTokenAuth = require('../../../middleware/auth/montyTokenAuth');

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
router.get('/client/info', apiKeyAuth, require('../controllers/clientController').getInfo);

// Auth routes (login doesn't require auth, others do)
router.use('/auth', authRoutes);

// API routes (all require API key authentication)
router.use('/bundles', apiKeyAuth, montyTokenAuth, bundlesRoutes);

// Global routes (countries, currencies, regions)
router.get('/AvailableCountries', apiKeyAuth, montyTokenAuth, require('../controllers/bundlesController').getCountries);
router.get('/AvailableCurrencies', apiKeyAuth, montyTokenAuth, require('../controllers/bundlesController').getCurrencies);
router.post('/AvailableCurrencies', apiKeyAuth, montyTokenAuth, require('../controllers/bundlesController').manageCurrencies);
router.post('/AvailableCurrenciesCSV', apiKeyAuth, montyTokenAuth, require('../controllers/bundlesController').manageCurrenciesCSV);
router.get('/AvailableRegions', apiKeyAuth, montyTokenAuth, require('../controllers/bundlesController').getRegions);
router.get('/v2/Bundles/Topup', apiKeyAuth, montyTokenAuth, require('../controllers/bundlesController').getCompatibleTopupV2);
router.use('/orders', apiKeyAuth, montyTokenAuth, ordersRoutes);
router.use('/agents', apiKeyAuth, agentsRoutes);
router.use('/resellers', apiKeyAuth, resellersRoutes);
router.get('/Reseller/Bundles/Scope', apiKeyAuth, montyTokenAuth, require('../controllers/resellerController').getResellerBundlesScope);
router.use('/branches', apiKeyAuth, branchesRoutes);
router.use('/roles', apiKeyAuth, rolesRoutes);
router.use('/networks', apiKeyAuth, networksRoutes);
router.use('/issues', apiKeyAuth, issuesRoutes);
router.use('/vouchers', apiKeyAuth, vouchersRoutes);
router.use('/utilities', apiKeyAuth, utilitiesRoutes);

module.exports = router;