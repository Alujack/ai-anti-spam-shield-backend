const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const networkMonitor = require('../../services/networkMonitor/monitor');

/**
 * Network Monitoring Routes
 * Handles network threat detection and monitoring
 */

/**
 * @desc    Start network monitoring
 * @route   POST /api/v1/network/start
 * @access  Private
 */
router.post('/start', authMiddleware, async (req, res) => {
    try {
        const result = await networkMonitor.startMonitoring();
        res.status(200).json({
            success: true,
            message: 'Network monitoring started',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @desc    Stop network monitoring
 * @route   POST /api/v1/network/stop
 * @access  Private
 */
router.post('/stop', authMiddleware, async (req, res) => {
    try {
        const result = await networkMonitor.stopMonitoring();
        res.status(200).json({
            success: true,
            message: 'Network monitoring stopped',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @desc    Get network events
 * @route   GET /api/v1/network/events
 * @access  Private
 */
router.get('/events', authMiddleware, async (req, res) => {
    try {
        const { suspicious, limit = 100 } = req.query;
        const filters = {};
        
        if (suspicious !== undefined) {
            filters.suspicious = suspicious === 'true';
        }
        
        const events = await networkMonitor.getEvents(filters);
        
        res.status(200).json({
            success: true,
            data: events
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @desc    Get network statistics
 * @route   GET /api/v1/network/statistics
 * @access  Private
 */
router.get('/statistics', authMiddleware, async (req, res) => {
    try {
        const statistics = await networkMonitor.getStatistics();
        
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
 * @desc    Get monitoring status
 * @route   GET /api/v1/network/status
 * @access  Private
 */
router.get('/status', authMiddleware, async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: {
                isMonitoring: networkMonitor.isMonitoring,
                eventsCount: networkMonitor.events.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;

