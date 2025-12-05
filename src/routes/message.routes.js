const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const { authenticate } = require('../middlewares/auth');

// Message routes
router.post('/analyze', authenticate, messageController.analyzeMessage);
router.get('/', authenticate, messageController.getAllMessages);
router.get('/:id', authenticate, messageController.getMessageById);
router.delete('/:id', authenticate, messageController.deleteMessage);

module.exports = router;

