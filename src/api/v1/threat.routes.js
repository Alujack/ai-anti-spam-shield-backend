const express = require('express');
const router = express.Router();
const threatController = require('../../controllers/threat.controller');
const authMiddleware = require('../../middlewares/auth');

// Threat detection routes
router.get('/', authMiddleware, threatController.listThreats);
router.get('/:id', authMiddleware, threatController.getThreatById);
router.post('/:id/resolve', authMiddleware, threatController.resolveThreat);
router.get('/statistics', authMiddleware, threatController.getThreatStatistics);

module.exports = router;
