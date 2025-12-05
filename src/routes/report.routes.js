const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticate, authorize } = require('../middlewares/auth');

// All routes require authentication
router.use(authenticate);

// User routes
router.post('/', reportController.createReport);
router.get('/my-reports', reportController.getUserReports);
router.get('/statistics', reportController.getReportStatistics);
router.get('/:id', reportController.getReportById);
router.put('/:id', reportController.updateReport);
router.delete('/:id', reportController.deleteReport);

// Admin routes
router.get('/admin/all', authorize('ADMIN'), reportController.getAllReports);

module.exports = router;

