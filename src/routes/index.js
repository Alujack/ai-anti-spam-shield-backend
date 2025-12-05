const express = require('express');
const router = express.Router();

const messageRoutes = require('./message.routes');
const userRoutes = require('./user.routes');
const reportRoutes = require('./report.routes');

// Mount routes
router.use('/messages', messageRoutes);
router.use('/users', userRoutes);
router.use('/reports', reportRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'AI Anti-Spam Shield API',
    version: '1.0.0',
    endpoints: {
      messages: '/api/v1/messages',
      users: '/api/v1/users',
      reports: '/api/v1/reports'
    }
  });
});

module.exports = router;

