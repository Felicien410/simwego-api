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

// Auth routes (login doesn't require auth, others do)
router.use('/auth', authRoutes);

// API routes (all require API key authentication with Monty proxy)
router.use('/bundles', clientAuthWithMonty, bundlesRoutes);

// Global routes (countries, currencies, regions)
router.get('/AvailableCountries', clientAuthWithMonty, require('../controllers/bundlesController').getCountries);
router.get('/AvailableCurrencies', clientAuthWithMonty, require('../controllers/bundlesController').getCurrencies);
router.post('/AvailableCurrencies', clientAuthWithMonty, require('../controllers/bundlesController').manageCurrencies);
router.post('/AvailableCurrenciesCSV', clientAuthWithMonty, require('../controllers/bundlesController').manageCurrenciesCSV);
router.get('/AvailableRegions', clientAuthWithMonty, require('../controllers/bundlesController').getRegions);
router.get('/v2/Bundles/Topup', clientAuthWithMonty, require('../controllers/bundlesController').getCompatibleTopupV2);
router.use('/orders', clientAuthWithMonty, ordersRoutes);
router.use('/agents', clientAuth, agentsRoutes);
router.use('/resellers', clientAuth, resellersRoutes);
router.get('/Reseller/Bundles/Scope', clientAuthWithMonty, require('../controllers/resellerController').getResellerBundlesScope);
router.use('/branches', clientAuth, branchesRoutes);
router.use('/roles', clientAuth, rolesRoutes);
router.use('/networks', clientAuth, networksRoutes);
router.use('/issues', clientAuth, issuesRoutes);
router.use('/vouchers', clientAuth, vouchersRoutes);
router.use('/utilities', clientAuth, utilitiesRoutes);

module.exports = router;