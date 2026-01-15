const express = require('express');
const router = express.Router();
const playbookController = require('../../controllers/playbook.controller');
const authMiddleware = require('../../middlewares/auth');
const rateLimiter = require('../../middlewares/rateLimiter');

// Playbook management routes
router.get('/', authMiddleware, playbookController.getAllPlaybooks);
router.get('/:id', authMiddleware, playbookController.getPlaybook);
router.post('/:id/execute', authMiddleware, rateLimiter.apiLimiter(), playbookController.executePlaybook);
router.post('/:id/toggle', authMiddleware, playbookController.togglePlaybook);
router.get('/:id/history', authMiddleware, playbookController.getPlaybookHistory);

// Execution management
router.get('/executions/history', authMiddleware, playbookController.getExecutionHistory);
router.get('/executions/statistics', authMiddleware, playbookController.getStatistics);

// Auto-execution for threats
router.post('/auto-execute', authMiddleware, rateLimiter.apiLimiter(), playbookController.autoExecutePlaybook);

module.exports = router;

