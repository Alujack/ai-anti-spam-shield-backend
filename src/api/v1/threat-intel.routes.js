const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const threatIntelService = require('../../services/threatIntelligence/service');

/**
 * Threat Intelligence Routes
 * External threat intelligence integration
 */

/**
 * @desc    Check IP reputation
 * @route   POST /api/v1/threat-intel/ip
 * @access  Private
 */
router.post('/ip', authMiddleware, async (req, res) => {
    try {
        const { ip } = req.body;

        if (!ip) {
            return res.status(400).json({
                success: false,
                message: 'IP address is required'
            });
        }

        const result = await threatIntelService.getThreatIntelForIP(ip);

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

/**
 * @desc    Check file hash
 * @route   POST /api/v1/threat-intel/file-hash
 * @access  Private
 */
router.post('/file-hash', authMiddleware, async (req, res) => {
    try {
        const { fileHash } = req.body;

        if (!fileHash) {
            return res.status(400).json({
                success: false,
                message: 'File hash is required'
            });
        }

        const result = await threatIntelService.getThreatIntelForFile(fileHash);

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

/**
 * @desc    Check URL reputation
 * @route   POST /api/v1/threat-intel/url
 * @access  Private
 */
router.post('/url', authMiddleware, async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'URL is required'
            });
        }

        const result = await threatIntelService.checkURLReputation(url);

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

/**
 * @desc    Get cache statistics
 * @route   GET /api/v1/threat-intel/cache/stats
 * @access  Private
 */
router.get('/cache/stats', authMiddleware, (req, res) => {
    try {
        const stats = threatIntelService.getCacheStats();

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @desc    Clear cache
 * @route   POST /api/v1/threat-intel/cache/clear
 * @access  Private
 */
router.post('/cache/clear', authMiddleware, (req, res) => {
    try {
        const result = threatIntelService.clearCache();

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

