const axios = require('axios');
const config = require('../config');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

/**
 * Message Service
 * Handles business logic for message operations
 */

class MessageService {
  /**
   * Scan text for spam using AI model service
   * @param {string} messageText - The message text to scan
   * @returns {Promise<Object>} - Spam detection result
   */
  async scanTextForSpam(messageText) {
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

      return {
        is_spam: response.data.is_spam || response.data.prediction === 'spam',
        confidence: response.data.confidence || response.data.probability || 0,
        prediction: response.data.prediction || (response.data.is_spam ? 'spam' : 'ham'),
        message: messageText,
        timestamp: new Date().toISOString(),
        ...(response.data.details && { details: response.data.details })
      };

    } catch (error) {
      // Handle different types of errors
      if (error.isOperational) {
        // Re-throw operational errors (ApiError instances)
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
        // The AI service responded with an error status
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

      // Unknown error
      logger.error('Unknown error calling AI service', { 
        error: error.message,
        stack: error.stack 
      });
      throw ApiError.internal('Failed to analyze message. Please try again.');
    }
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

