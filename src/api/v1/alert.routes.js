const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const alertingService = require('../../services/alerting/alertService');

/**
 * Alerting Routes
 * Handles security alerts and notifications
 */

/**
 * @desc    Get all alerts
 * @route   GET /api/v1/alerts
 * @access  Private
 */
router.get('/', authMiddleware, (req, res) => {
    try {
        const { status, severity, category, source, limit = 100 } = req.query;
        
        const filters = {};
        if (severity) filters.severity = severity;
        if (category) filters.category = category;
        if (source) filters.source = source;

        let alerts = status === 'active' 
            ? alertingService.getActiveAlerts(filters)
            : alertingService.alerts;

        // Apply limit
        alerts = alerts.slice(0, parseInt(limit));

        res.status(200).json({
            success: true,
            data: {
                alerts,
                total: alerts.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @desc    Get alert by ID
 * @route   GET /api/v1/alerts/:id
 * @access  Private
 */
router.get('/:id', authMiddleware, (req, res) => {
    try {
        const { id } = req.params;
        const alert = alertingService.getAlertById(id);

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }

        res.status(200).json({
            success: true,
            data: alert
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @desc    Acknowledge alert
 * @route   POST /api/v1/alerts/:id/acknowledge
 * @access  Private
 */
router.post('/:id/acknowledge', authMiddleware, (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id || 'system';

        const alert = alertingService.acknowledgeAlert(id, userId);

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Alert acknowledged',
            data: alert
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @desc    Resolve alert
 * @route   POST /api/v1/alerts/:id/resolve
 * @access  Private
 */
router.post('/:id/resolve', authMiddleware, (req, res) => {
    try {
        const { id } = req.params;
        const { resolution } = req.body;
        const userId = req.user?.id || 'system';

        const alert = alertingService.resolveAlert(id, userId, resolution);

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Alert resolved',
            data: alert
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @desc    Get alert statistics
 * @route   GET /api/v1/alerts/statistics
 * @access  Private
 */
router.get('/statistics/summary', authMiddleware, (req, res) => {
    try {
        const statistics = alertingService.getStatistics();

        res.status(200).json({
            success: true,
            data: statistics
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @desc    Clear resolved alerts
 * @route   POST /api/v1/alerts/clear-resolved
 * @access  Private
 */
router.post('/clear-resolved', authMiddleware, (req, res) => {
    try {
        const result = alertingService.clearResolvedAlerts();

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;

