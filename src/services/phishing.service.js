const axios = require('axios');
const config = require('../config');
const prisma = require('../config/database');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

/**
 * Phishing Detection Service
 * Handles phishing detection requests and history management
 */
class PhishingService {
  constructor() {
    this.aiServiceUrl = config.ai.serviceUrl;
    this.timeout = 30000; // 30 second timeout
  }

  /**
   * Scan text for phishing
   * @param {string} text - Text to analyze
   * @param {string} scanType - Type of scan (email, sms, url, auto)
   * @param {string|null} userId - User ID for history tracking (optional)
   * @returns {Promise<Object>} Phishing detection result
   */
  async scanTextForPhishing(text, scanType = 'auto', userId = null) {
    try {
      logger.info('Scanning text for phishing', {
        textLength: text?.length,
        scanType,
        hasUser: !!userId
      });

      const response = await axios.post(
        `${this.aiServiceUrl}/predict-phishing`,
        { text, scan_type: scanType },
        {
          timeout: this.timeout,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const result = {
        isPhishing: response.data.is_phishing,
        confidence: response.data.confidence,
        phishingType: response.data.phishing_type,
        threatLevel: response.data.threat_level,
        indicators: response.data.indicators || [],
        urlsAnalyzed: response.data.urls_analyzed || [],
        brandImpersonation: response.data.brand_impersonation,
        recommendation: response.data.recommendation,
        details: response.data.details || {},
        timestamp: response.data.timestamp || new Date().toISOString()
      };

      // Save to history if user is authenticated
      if (userId) {
        await this.savePhishingScanHistory(userId, text, result);
      }

      return result;
    } catch (error) {
      logger.error('Phishing scan failed', { error: error.message });

      if (error.code === 'ECONNREFUSED') {
        throw ApiError.internal('AI service unavailable');
      }
      if (error.response?.status === 503) {
        throw ApiError.internal('Phishing detector not available');
      }

      throw ApiError.internal('Failed to scan for phishing');
    }
  }

  /**
   * Scan URL for phishing
   * @param {string} url - URL to analyze
   * @param {string|null} userId - User ID for history tracking (optional)
   * @returns {Promise<Object>} URL phishing analysis result
   */
  async scanUrlForPhishing(url, userId = null) {
    try {
      logger.info('Scanning URL for phishing', { url: url?.substring(0, 50) });

      const response = await axios.post(
        `${this.aiServiceUrl}/scan-url`,
        { url },
        {
          timeout: this.timeout,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const result = {
        isPhishing: response.data.is_phishing,
        confidence: response.data.confidence,
        phishingType: response.data.phishing_type,
        threatLevel: response.data.threat_level,
        indicators: response.data.indicators || [],
        urlsAnalyzed: response.data.urls_analyzed || [],
        brandImpersonation: response.data.brand_impersonation,
        recommendation: response.data.recommendation,
        details: response.data.details || {},
        timestamp: response.data.timestamp || new Date().toISOString()
      };

      // Save to history if user is authenticated
      if (userId) {
        await this.savePhishingScanHistory(userId, url, result, url);
      }

      return result;
    } catch (error) {
      logger.error('URL phishing scan failed', { error: error.message });
      throw ApiError.internal('Failed to scan URL for phishing');
    }
  }

  /**
   * Batch scan multiple items for phishing
   * @param {string[]} items - Array of texts/URLs to scan
   * @param {string} scanType - Type of scan for all items
   * @param {string|null} userId - User ID for history tracking (optional)
   * @returns {Promise<Object>} Batch scan results with summary
   */
  async batchScanForPhishing(items, scanType = 'auto', userId = null) {
    try {
      logger.info('Batch scanning for phishing', {
        itemCount: items?.length,
        scanType
      });

      const response = await axios.post(
        `${this.aiServiceUrl}/batch-phishing`,
        { items, scan_type: scanType },
        {
          timeout: this.timeout * 2, // Double timeout for batch
          headers: { 'Content-Type': 'application/json' }
        }
      );

      return {
        results: response.data.results,
        summary: response.data.summary,
        timestamp: response.data.timestamp || new Date().toISOString()
      };
    } catch (error) {
      logger.error('Batch phishing scan failed', { error: error.message });
      throw ApiError.internal('Failed to perform batch phishing scan');
    }
  }

  /**
   * Save phishing scan to history
   * @param {string} userId - User ID
   * @param {string} inputText - Original input text
   * @param {Object} result - Scan result
   * @param {string|null} inputUrl - Specific URL if applicable
   */
  async savePhishingScanHistory(userId, inputText, result, inputUrl = null) {
    try {
      await prisma.phishingScanHistory.create({
        data: {
          userId,
          inputText: inputText.substring(0, 10000), // Limit text length
          inputUrl,
          isPhishing: result.isPhishing,
          confidence: result.confidence,
          phishingType: result.phishingType,
          threatLevel: result.threatLevel,
          indicators: JSON.stringify(result.indicators),
          urlsAnalyzed: result.urlsAnalyzed ? JSON.stringify(result.urlsAnalyzed) : null,
          brandDetected: result.brandImpersonation?.brand || null,
        }
      });

      logger.info('Phishing scan history saved', { userId });
    } catch (error) {
      // Non-blocking - don't fail the scan if history save fails
      logger.error('Failed to save phishing history', { error: error.message });
    }
  }

  /**
   * Get user's phishing scan history
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Paginated history
   */
  async getPhishingScanHistory(userId, filters = {}) {
    const { page = 1, limit = 20, phishingOnly = null, threatLevel = null } = filters;
    const skip = (page - 1) * limit;

    try {
      const where = { userId };

      if (phishingOnly !== null) {
        where.isPhishing = phishingOnly === 'true' || phishingOnly === true;
      }

      if (threatLevel) {
        where.threatLevel = threatLevel.toUpperCase();
      }

      const [histories, total] = await Promise.all([
        prisma.phishingScanHistory.findMany({
          where,
          orderBy: { scannedAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            inputText: true,
            inputUrl: true,
            isPhishing: true,
            confidence: true,
            phishingType: true,
            threatLevel: true,
            indicators: true,
            brandDetected: true,
            scannedAt: true,
          }
        }),
        prisma.phishingScanHistory.count({ where })
      ]);

      // Parse JSON fields
      const parsedHistories = histories.map(h => ({
        ...h,
        indicators: h.indicators ? JSON.parse(h.indicators) : [],
        inputText: h.inputText.substring(0, 200) + (h.inputText.length > 200 ? '...' : '')
      }));

      return {
        histories: parsedHistories,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + histories.length < total
        }
      };
    } catch (error) {
      logger.error('Failed to get phishing history', { error: error.message });
      throw ApiError.internal('Failed to retrieve phishing history');
    }
  }

  /**
   * Get specific phishing scan by ID
   * @param {string} id - Scan ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Scan details
   */
  async getPhishingScanById(id, userId) {
    try {
      const scan = await prisma.phishingScanHistory.findFirst({
        where: { id, userId },
      });

      if (!scan) {
        throw ApiError.notFound('Phishing scan not found');
      }

      return {
        ...scan,
        indicators: scan.indicators ? JSON.parse(scan.indicators) : [],
        urlsAnalyzed: scan.urlsAnalyzed ? JSON.parse(scan.urlsAnalyzed) : [],
      };
    } catch (error) {
      if (error.isOperational) throw error;
      logger.error('Failed to get phishing scan', { error: error.message });
      throw ApiError.internal('Failed to retrieve phishing scan');
    }
  }

  /**
   * Delete phishing scan from history
   * @param {string} id - Scan ID
   * @param {string} userId - User ID
   */
  async deletePhishingScan(id, userId) {
    try {
      const scan = await prisma.phishingScanHistory.findFirst({
        where: { id, userId }
      });

      if (!scan) {
        throw ApiError.notFound('Phishing scan not found');
      }

      await prisma.phishingScanHistory.delete({
        where: { id }
      });

      logger.info('Phishing scan deleted', { id, userId });
      return { message: 'Phishing scan deleted successfully' };
    } catch (error) {
      if (error.isOperational) throw error;
      logger.error('Failed to delete phishing scan', { error: error.message });
      throw ApiError.internal('Failed to delete phishing scan');
    }
  }

  /**
   * Get phishing detection statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Statistics
   */
  async getPhishingStatistics(userId) {
    try {
      const [total, phishingCount, threatLevelCounts] = await Promise.all([
        prisma.phishingScanHistory.count({ where: { userId } }),
        prisma.phishingScanHistory.count({ where: { userId, isPhishing: true } }),
        prisma.phishingScanHistory.groupBy({
          by: ['threatLevel'],
          where: { userId },
          _count: { threatLevel: true }
        })
      ]);

      const threatLevels = {};
      threatLevelCounts.forEach(item => {
        threatLevels[item.threatLevel] = item._count.threatLevel;
      });

      return {
        totalScans: total,
        phishingDetected: phishingCount,
        safeScans: total - phishingCount,
        phishingPercentage: total > 0 ? ((phishingCount / total) * 100).toFixed(2) : 0,
        threatLevels
      };
    } catch (error) {
      logger.error('Failed to get phishing statistics', { error: error.message });
      throw ApiError.internal('Failed to retrieve statistics');
    }
  }
}

module.exports = new PhishingService();
