// src/api/v0/routes/branches.js - Branch management routes
const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');

// Branch routes
router.get('/', branchController.getBranches);
router.post('/', branchController.addBranch);

// Branch-specific routes with ID
router.delete('/:BranchID', branchController.deleteBranch);
router.get('/:BranchID', branchController.getBranchById);
router.put('/:BranchID', branchController.editBranch);

module.exports = router;