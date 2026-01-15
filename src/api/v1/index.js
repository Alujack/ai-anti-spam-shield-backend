const express = require('express');
const router = express.Router();

// Import route modules
const threatRoutes = require('./threat.routes');
const networkRoutes = require('./network.routes');
const fileRoutes = require('./file.routes');
const behaviorRoutes = require('./behavior.routes');
const incidentRoutes = require('./incident.routes');
const analyticsRoutes = require('./analytics.routes');
const alertRoutes = require('./alert.routes');
const threatIntelRoutes = require('./threat-intel.routes');
const playbookRoutes = require('./playbook.routes'); // NEW

// Register routes
router.use('/threats', threatRoutes);
router.use('/network', networkRoutes);
router.use('/files', fileRoutes);
router.use('/behavior', behaviorRoutes);
router.use('/incidents', incidentRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/alerts', alertRoutes);
router.use('/threat-intel', threatIntelRoutes);
router.use('/playbooks', playbookRoutes); // NEW

module.exports = router;
