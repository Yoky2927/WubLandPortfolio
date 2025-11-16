const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/auth');
const { adminOnly, adminOrBroker } = require('../middleware/auth');

/**
 * @route   GET /api/analysis/dashboard
 * @desc    Get comprehensive dashboard analytics
 * @access  Private (Admin or Broker)
 * @query   startDate, endDate (optional date range filters)
 */
router.get('/dashboard', authMiddleware, adminOrBroker, reportController.getDashboard);

/**
 * @route   GET /api/analysis/reports/sales
 * @desc    Get sales report
 * @access  Private (Admin or Broker)
 * @query   startDate, endDate, format (pdf|json)
 */
router.get('/reports/sales', authMiddleware, adminOrBroker, reportController.getSalesReport);

/**
 * @route   GET /api/analysis/reports/rental
 * @desc    Get rental report
 * @access  Private (Admin or Broker)
 * @query   startDate, endDate, format (pdf|json)
 */
router.get('/reports/rental', authMiddleware, adminOrBroker, reportController.getRentalReport);

/**
 * @route   GET /api/analysis/reports/user-activity
 * @desc    Get user activity report
 * @access  Private (Admin only)
 * @query   startDate, endDate, format (pdf|json)
 */
router.get('/reports/user-activity', authMiddleware, adminOnly, reportController.getUserActivityReport);

/**
 * @route   GET /api/analysis/reports
 * @desc    Get all saved reports
 * @access  Private (Admin or Broker)
 * @query   type, limit, offset
 */
router.get('/reports', authMiddleware, adminOrBroker, reportController.getAllReports);

/**
 * @route   GET /api/analysis/reports/:id
 * @desc    Get specific report by ID
 * @access  Private (Admin or Broker)
 * @query   format (pdf|json)
 */
router.get('/reports/:id', authMiddleware, adminOrBroker, reportController.getReportById);

/**
 * @route   DELETE /api/analysis/reports/:id
 * @desc    Delete a report
 * @access  Private (Admin only)
 */
router.delete('/reports/:id', authMiddleware, adminOnly, reportController.deleteReport);

module.exports = router;

