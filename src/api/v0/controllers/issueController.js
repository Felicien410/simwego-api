
// =============================================================================
// src/controllers/issueController.js - Contrôleur IssueReport (6 endpoints)
// =============================================================================
const ProxyService = require('../../../services/proxyHandler');

class IssueController {
  // GET /IssueReport - Gets all Issues Reported
  async getIssueReports(req, res) {
    await ProxyService.proxyToMonty(req, res, '/IssueReport');
  }

  // POST /IssueReport - Submit an Issue Report
  async addIssueReport(req, res) {
    await ProxyService.proxyToMonty(req, res, '/IssueReport');
  }

  // DELETE /IssueReport/{ReportID} - Delete IssueReport
  async deleteIssueReport(req, res) {
    await ProxyService.proxyToMonty(req, res, `/IssueReport/${req.params.ReportID}`);
  }

  // PUT /IssueReport/{ReportID} - Modify Issue Report
  async editIssueReport(req, res) {
    await ProxyService.proxyToMonty(req, res, `/IssueReport/${req.params.ReportID}`);
  }

  // PUT /IssueReport/{ReportID}/Feedback - Submit Feedback for Issue
  async submitFeedback(req, res) {
    await ProxyService.proxyToMonty(req, res, `/IssueReport/${req.params.ReportID}/Feedback`);
  }

  // PUT /ResolveIssue/{ReportID} - Resolve an Issue Report
  async resolveIssue(req, res) {
    await ProxyService.proxyToMonty(req, res, `/ResolveIssue/${req.params.ReportID}`);
  }
}

module.exports = new IssueController();
