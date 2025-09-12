// src/api/v0/routes/roles.js - Role management routes
const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');

// Role routes
router.post('/', roleController.createRole);
router.get('/all', roleController.getAllRoles);

// Role-specific routes with ID
router.delete('/:RoleID', roleController.deleteRole);
router.get('/:RoleID', roleController.getRoleById);
router.put('/:RoleID', roleController.editRole);

// Special UMAP route
router.patch('/umap', roleController.updateMontyAdminPermissions);

module.exports = router;