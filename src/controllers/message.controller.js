const messageService = require('../services/message.service');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

/**
 * Scan voice for spam using AI model
 */
const scanVoice = async (req, res, next) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      throw ApiError.badRequest('Audio file is required');
    }

    const audioBuffer = req.file.buffer;
    const filename = req.file.originalname;

    // Validate file type
    const allowedTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/flac', 'audio/x-wav', 'audio/webm'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      throw ApiError.badRequest('Invalid audio format. Supported formats: WAV, MP3, OGG, FLAC, WEBM');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (req.file.size > maxSize) {
      throw ApiError.badRequest('Audio file too large. Maximum size is 10MB');
    }

    logger.info('Scanning voice for spam', { 
      filename: filename,
      size: req.file.size,
      mimetype: req.file.mimetype 
    });

    // Get userId if user is authenticated (optional)
    const userId = req.user?.id || null;

    // Call AI service to analyze voice message
    const result = await messageService.scanVoiceForSpam(audioBuffer, filename, userId);

    logger.info('Voice spam scan completed', {
      isSpam: result.is_spam,
      confidence: result.confidence,
      transcribed: result.transcribed_text
    });

    res.status(200).json({
      status: 'success',
      message: 'Voice message scanned successfully',
      data: result
    });
  } catch (error) {
    logger.error('Error scanning voice', { error: error.message });
    next(error);
  }
};

/**
 * Scan text for spam using AI model
 */
const scanText = async (req, res, next) => {
  try {
    const { message } = req.body;

    // Validate input
    if (!message) {
      throw ApiError.badRequest('Message field is required');
    }

    if (typeof message !== 'string') {
      throw ApiError.badRequest('Message must be a string');
    }

    if (message.trim().length === 0) {
      throw ApiError.badRequest('Message cannot be empty');
    }

    logger.info('Scanning text for spam', { messageLength: message.length });

    // Get userId if user is authenticated (optional)
    const userId = req.user?.id || null;

    // Call AI service to analyze message
    const result = await messageService.scanTextForSpam(message, userId);

    logger.info('Spam scan completed', {
      isSpam: result.is_spam,
      confidence: result.confidence
    });

    res.status(200).json({
      status: 'success',
      message: 'Message scanned successfully',
      data: result
    });
  } catch (error) {
    logger.error('Error scanning text', { error: error.message });
    next(error);
  }
};

/**
 * Get scan history
 */
const getScanHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page, limit, isSpam } = req.query;

    const result = await messageService.getScanHistory(userId, { page, limit, isSpam });

    res.status(200).json({
      status: 'success',
      message: 'Scan history retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get scan history by ID
 */
const getScanHistoryById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const history = await messageService.getScanHistoryById(id, userId);

    res.status(200).json({
      status: 'success',
      message: 'Scan history retrieved successfully',
      data: history
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete scan history
 */
const deleteScanHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await messageService.deleteScanHistory(id, userId);

    res.status(200).json({
      status: 'success',
      message: result.message,
      data: null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get scan statistics
 */
const getScanStatistics = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const stats = await messageService.getScanStatistics(userId);

    res.status(200).json({
      status: 'success',
      message: 'Statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Analyze a message for spam
 */
const analyzeMessage = async (req, res, next) => {
  try {
    // TODO: Implement message analysis logic
    res.status(200).json({
      status: 'success',
      message: 'Message analysis endpoint',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all messages
 */
const getAllMessages = async (req, res, next) => {
  try {
    // TODO: Implement get all messages logic
    res.status(200).json({
      status: 'success',
      message: 'Get all messages endpoint',
      data: []
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get message by ID
 */
const getMessageById = async (req, res, next) => {
  try {
    const { id } = req.params;
    // TODO: Implement get message by ID logic
    res.status(200).json({
      status: 'success',
      message: 'Get message by ID endpoint',
      data: { id }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete message
 */
const deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    // TODO: Implement delete message logic
    res.status(200).json({
      status: 'success',
      message: 'Delete message endpoint',
      data: { id }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  scanText,
  scanVoice,
  getScanHistory,
  getScanHistoryById,
  deleteScanHistory,
  getScanStatistics,
  analyzeMessage,
  getAllMessages,
  getMessageById,
  deleteMessage
};

