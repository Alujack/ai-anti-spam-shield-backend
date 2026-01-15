const express = require('express');
const router = express.Router();
const phishingController = require('../controllers/phishing.controller');
const { authenticate, optionalAuthenticate } = require('../middlewares/auth');

/**
 * Phishing Detection Routes
 *
 * Public routes (with optional auth for history tracking):
 * - POST /scan-text - Scan text for phishing
 * - POST /scan-url - Scan URL for phishing
 * - POST /batch-scan - Batch scan multiple items
 *
 * Protected routes (require authentication):
 * - GET /history - Get phishing scan history
 * - GET /history/:id - Get specific scan
 * - DELETE /history/:id - Delete scan from history
 * - GET /statistics - Get phishing detection statistics
 */

// Public routes with optional authentication
// If user is authenticated, scan results are saved to history
router.post('/scan-text', optionalAuthenticate, phishingController.scanText);
router.post('/scan-url', optionalAuthenticate, phishingController.scanUrl);
router.post('/batch-scan', optionalAuthenticate, phishingController.batchScan);

// Protected routes - require authentication
router.get('/history', authenticate, phishingController.getHistory);
router.get('/history/:id', authenticate, phishingController.getHistoryById);
router.delete('/history/:id', authenticate, phishingController.deleteHistory);
router.get('/statistics', authenticate, phishingController.getStatistics);

module.exports = router;
