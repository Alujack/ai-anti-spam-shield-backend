const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticate } = require('../middlewares/auth');

// Report routes
router.post('/', authenticate, reportController.createReport);
router.get('/', authenticate, reportController.getAllReports);
router.get('/:id', authenticate, reportController.getReportById);
router.put('/:id', authenticate, reportController.updateReport);
router.delete('/:id', authenticate, reportController.deleteReport);

module.exports = router;

