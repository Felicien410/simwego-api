// src/api/v0/routes/agents.js - Agent management routes
const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');

// Agent authentication
router.post('/login', require('../controllers/authController').login);

// Agent routes  
router.get('/', agentController.getAgents);
router.post('/', agentController.addAgent);

// Agent utility routes
router.post('/getAgentByEmail', agentController.getAgentByEmail);
router.post('/forgot-password', agentController.forgotPassword);
router.post('/reset-password', agentController.resetPassword);

// Agent-specific routes with ID
router.delete('/:AgentID', agentController.deleteAgent);
router.get('/:AgentID', agentController.getAgentById);
router.put('/:AgentID', agentController.editAgent);

module.exports = router;