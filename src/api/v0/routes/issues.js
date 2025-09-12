// src/api/v0/routes/issues.js - Issue management routes
const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issueController');

// Issue routes
router.get('/', issueController.getIssueReports);
router.post('/', issueController.addIssueReport);

// Issue-specific routes with ID
router.delete('/:ReportID', issueController.deleteIssueReport);
router.put('/:ReportID', issueController.editIssueReport);
router.put('/:ReportID/feedback', issueController.submitFeedback);
router.put('/:ReportID/resolve', issueController.resolveIssue);

module.exports = router;