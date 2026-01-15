const phishingService = require('../services/phishing.service');
const ApiError = require('../utils/apiError');

/**
 * Phishing Detection Controller
 * Handles HTTP requests for phishing detection endpoints
 */

/**
 * Scan text for phishing
 * POST /api/v1/phishing/scan-text
 */
const scanText = async (req, res, next) => {
  try {
    const { text, scanType = 'auto' } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw ApiError.badRequest('Text is required');
    }

    if (text.length > 50000) {
      throw ApiError.badRequest('Text exceeds maximum length of 50000 characters');
    }

    const validScanTypes = ['email', 'sms', 'url', 'auto'];
    if (!validScanTypes.includes(scanType)) {
      throw ApiError.badRequest(`Invalid scan type. Must be one of: ${validScanTypes.join(', ')}`);
    }

    const userId = req.user?.id || null;
    const result = await phishingService.scanTextForPhishing(text, scanType, userId);

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Scan URL for phishing
 * POST /api/v1/phishing/scan-url
 */
const scanUrl = async (req, res, next) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      throw ApiError.badRequest('URL is required');
    }

    // Basic URL validation
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(url)) {
      throw ApiError.badRequest('Invalid URL format. URL must start with http:// or https://');
    }

    if (url.length > 2000) {
      throw ApiError.badRequest('URL exceeds maximum length of 2000 characters');
    }

    const userId = req.user?.id || null;
    const result = await phishingService.scanUrlForPhishing(url, userId);

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Batch scan multiple items for phishing
 * POST /api/v1/phishing/batch-scan
 */
const batchScan = async (req, res, next) => {
  try {
    const { items, scanType = 'auto' } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw ApiError.badRequest('Items array is required');
    }

    if (items.length > 100) {
      throw ApiError.badRequest('Maximum 100 items allowed per batch');
    }

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      if (typeof items[i] !== 'string' || items[i].trim().length === 0) {
        throw ApiError.badRequest(`Item at index ${i} must be a non-empty string`);
      }
    }

    const validScanTypes = ['email', 'sms', 'url', 'auto'];
    if (!validScanTypes.includes(scanType)) {
      throw ApiError.badRequest(`Invalid scan type. Must be one of: ${validScanTypes.join(', ')}`);
    }

    const userId = req.user?.id || null;
    const result = await phishingService.batchScanForPhishing(items, scanType, userId);

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get phishing scan history
 * GET /api/v1/phishing/history
 */
const getHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page, limit, phishingOnly, threatLevel } = req.query;

    const result = await phishingService.getPhishingScanHistory(userId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      phishingOnly,
      threatLevel
    });

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get specific phishing scan by ID
 * GET /api/v1/phishing/history/:id
 */
const getHistoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await phishingService.getPhishingScanById(id, userId);

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete phishing scan from history
 * DELETE /api/v1/phishing/history/:id
 */
const deleteHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await phishingService.deletePhishingScan(id, userId);

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get phishing detection statistics
 * GET /api/v1/phishing/statistics
 */
const getStatistics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await phishingService.getPhishingStatistics(userId);

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  scanText,
  scanUrl,
  batchScan,
  getHistory,
  getHistoryById,
  deleteHistory,
  getStatistics
};
