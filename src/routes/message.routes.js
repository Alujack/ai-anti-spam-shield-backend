const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const { authenticate } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// Public routes
router.post('/scan-text', messageController.scanText);
router.post('/scan-voice', upload.single('audio'), messageController.scanVoice);

// Protected routes
router.get('/history', authenticate, messageController.getScanHistory);
router.get('/history/:id', authenticate, messageController.getScanHistoryById);
router.delete('/history/:id', authenticate, messageController.deleteScanHistory);
router.get('/statistics', authenticate, messageController.getScanStatistics);

// Legacy routes
router.post('/analyze', authenticate, messageController.analyzeMessage);
router.get('/', authenticate, messageController.getAllMessages);
router.get('/:id', authenticate, messageController.getMessageById);
router.delete('/:id', authenticate, messageController.deleteMessage);

module.exports = router;

