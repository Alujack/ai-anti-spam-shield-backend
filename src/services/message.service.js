const axios = require('axios');
const config = require('../config');
const prisma = require('../config/database');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

/**
 * Message Service
 * Handles business logic for message operations
 */

class MessageService {
  /**
   * Scan voice for spam using AI model service
   * @param {Buffer} audioBuffer - The audio file buffer
   * @param {string} filename - The audio filename
   * @param {string} userId - Optional user ID to save history
   * @returns {Promise<Object>} - Spam detection result with transcription
   */
  async scanVoiceForSpam(audioBuffer, filename, userId = null) {
    try {
      const FormData = require('form-data');
      const aiServiceUrl = `${config.ai.serviceUrl}/predict-voice`;
      
      logger.info('Calling AI voice service', { url: aiServiceUrl, filename });

      // Create form data with audio file
      const formData = new FormData();
      formData.append('audio', audioBuffer, filename);

      // Call the AI model service
      const response = await axios.post(
        aiServiceUrl,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            ...(config.ai.apiKey && { 'Authorization': `Bearer ${config.ai.apiKey}` })
          },
          timeout: 60000, // 60 second timeout for voice processing
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );

      // Validate response
      if (!response.data) {
        throw ApiError.internal('AI service returned empty response');
      }

      logger.info('AI voice service response received', { 
        status: response.status,
        transcribed: response.data.transcribed_text 
      });

      const result = {
        is_spam: response.data.is_spam || response.data.prediction === 'spam',
        confidence: response.data.confidence || response.data.probability || 0,
        prediction: response.data.prediction || (response.data.is_spam ? 'spam' : 'ham'),
        message: response.data.transcribed_text,
        transcribed_text: response.data.transcribed_text,
        timestamp: new Date().toISOString(),
        ...(response.data.details && { details: response.data.details })
      };

      // Save to history if user is authenticated
      if (userId) {
        await this.saveScanHistory(userId, response.data.transcribed_text, result);
      }

      return result;

    } catch (error) {
      // Handle different types of errors
      if (error.isOperational) {
        throw error;
      }

      if (error.code === 'ECONNREFUSED') {
        logger.error('AI service connection refused', { 
          url: config.ai.serviceUrl 
        });
        throw ApiError.internal('AI service is unavailable. Please try again later.');
      }

      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        logger.error('AI service timeout', { error: error.message });
        throw ApiError.internal('AI service request timed out. Please try again.');
      }

      if (error.response) {
        logger.error('AI service error response', { 
          status: error.response.status,
          data: error.response.data 
        });

        const statusCode = error.response.status;
        const errorMessage = error.response.data?.detail || 
                           error.response.data?.message || 
                           error.response.data?.error || 
                           'AI service error';

        if (statusCode === 400) {
          throw ApiError.badRequest(`AI service error: ${errorMessage}`);
        } else if (statusCode === 503) {
          throw ApiError.internal('AI service is temporarily unavailable');
        } else {
          throw ApiError.internal(`AI service error: ${errorMessage}`);
        }
      }

      logger.error('Unknown error calling AI voice service', { 
        error: error.message,
        stack: error.stack 
      });
      throw ApiError.internal('Failed to analyze voice message. Please try again.');
    }
  }

  /**
   * Scan text for spam using AI model service
   * @param {string} messageText - The message text to scan
   * @param {string} userId - Optional user ID to save history
   * @returns {Promise<Object>} - Spam detection result
   */
  async scanTextForSpam(messageText, userId = null) {
    try {
      const aiServiceUrl = `${config.ai.serviceUrl}/predict`;
      
      logger.info('Calling AI service', { url: aiServiceUrl });

      // Call the AI model service
      const response = await axios.post(
        aiServiceUrl,
        { message: messageText },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(config.ai.apiKey && { 'Authorization': `Bearer ${config.ai.apiKey}` })
          },
          timeout: 30000 // 30 second timeout
        }
      );

      // Validate response
      if (!response.data) {
        throw ApiError.internal('AI service returned empty response');
      }

      logger.info('AI service response received', { 
        status: response.status 
      });

      const result = {
        is_spam: response.data.is_spam || response.data.prediction === 'spam',
        confidence: response.data.confidence || response.data.probability || 0,
        prediction: response.data.prediction || (response.data.is_spam ? 'spam' : 'ham'),
        message: messageText,
        timestamp: new Date().toISOString(),
        ...(response.data.details && { details: response.data.details })
      };

      // Save to history if user is authenticated
      if (userId) {
        await this.saveScanHistory(userId, messageText, result);
      }

      return result;

    } catch (error) {
      // Handle different types of errors
      if (error.isOperational) {
        throw error;
      }

      if (error.code === 'ECONNREFUSED') {
        logger.error('AI service connection refused', { 
          url: config.ai.serviceUrl 
        });
        throw ApiError.internal('AI service is unavailable. Please try again later.');
      }

      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        logger.error('AI service timeout', { error: error.message });
        throw ApiError.internal('AI service request timed out. Please try again.');
      }

      if (error.response) {
        logger.error('AI service error response', { 
          status: error.response.status,
          data: error.response.data 
        });

        const statusCode = error.response.status;
        const errorMessage = error.response.data?.message || 
                           error.response.data?.error || 
                           'AI service error';

        if (statusCode === 400) {
          throw ApiError.badRequest(`AI service error: ${errorMessage}`);
        } else if (statusCode === 503) {
          throw ApiError.internal('AI service is temporarily unavailable');
        } else {
          throw ApiError.internal(`AI service error: ${errorMessage}`);
        }
      }

      logger.error('Unknown error calling AI service', { 
        error: error.message,
        stack: error.stack 
      });
      throw ApiError.internal('Failed to analyze message. Please try again.');
    }
  }

  /**
   * Save scan history to database
   */
  async saveScanHistory(userId, message, scanResult) {
    try {
      const history = await prisma.scanHistory.create({
        data: {
          userId,
          message,
          isSpam: scanResult.is_spam,
          confidence: scanResult.confidence,
          prediction: scanResult.prediction,
          details: scanResult.details || {}
        }
      });

      logger.info('Scan history saved', { historyId: history.id, userId });

      return history;
    } catch (error) {
      logger.error('Failed to save scan history', { error: error.message });
      // Don't throw error, just log it - history save shouldn't fail the scan
    }
  }

  /**
   * Get scan history for user
   */
  async getScanHistory(userId, filters = {}) {
    const { page = 1, limit = 20, isSpam } = filters;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(isSpam !== undefined && { isSpam: isSpam === 'true' || isSpam === true })
    };

    const [histories, total] = await Promise.all([
      prisma.scanHistory.findMany({
        where,
        orderBy: { scannedAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.scanHistory.count({ where })
    ]);

    return {
      histories,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get scan history by ID
   */
  async getScanHistoryById(id, userId) {
    const history = await prisma.scanHistory.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!history) {
      throw ApiError.notFound('Scan history not found');
    }

    return history;
  }

  /**
   * Delete scan history
   */
  async deleteScanHistory(id, userId) {
    const history = await prisma.scanHistory.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!history) {
      throw ApiError.notFound('Scan history not found');
    }

    await prisma.scanHistory.delete({
      where: { id }
    });

    logger.info('Scan history deleted', { historyId: id, userId });

    return { message: 'Scan history deleted successfully' };
  }

  /**
   * Get scan statistics for user
   */
  async getScanStatistics(userId) {
    const [totalScans, spamCount, hamCount] = await Promise.all([
      prisma.scanHistory.count({ where: { userId } }),
      prisma.scanHistory.count({ where: { userId, isSpam: true } }),
      prisma.scanHistory.count({ where: { userId, isSpam: false } })
    ]);

    return {
      totalScans,
      spamCount,
      hamCount,
      spamPercentage: totalScans > 0 ? ((spamCount / totalScans) * 100).toFixed(2) : 0
    };
  }

  /**
   * Analyze a message for spam
   */
  async analyzeMessage(messageData) {
    // TODO: Implement message analysis logic
    throw new Error('Not implemented');
  }

  /**
   * Get all messages
   */
  async getAllMessages(filters = {}) {
    // TODO: Implement get all messages logic
    throw new Error('Not implemented');
  }

  /**
   * Get message by ID
   */
  async getMessageById(id) {
    // TODO: Implement get message by ID logic
    throw new Error('Not implemented');
  }

  /**
   * Delete message
   */
  async deleteMessage(id) {
    // TODO: Implement delete message logic
    throw new Error('Not implemented');
  }

  /**
   * Call AI service for spam detection
   */
  async callAIService(messageContent) {
    // TODO: Implement AI service integration
    throw new Error('Not implemented');
  }
}

module.exports = new MessageService();

