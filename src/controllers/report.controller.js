const reportService = require('../services/report.service');
const ApiError = require('../utils/apiError');

/**
 * Create a new report
 */
const createReport = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { messageText, reportType, description } = req.body;

    // Validation
    if (!messageText || !reportType) {
      throw ApiError.badRequest('Message text and report type are required');
    }

    const report = await reportService.createReport({
      userId,
      messageText,
      reportType,
      description
    });

    res.status(201).json({
      status: 'success',
      message: 'Report created successfully',
      data: report
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all reports (admin only)
 */
const getAllReports = async (req, res, next) => {
  try {
    const { page, limit, status, reportType } = req.query;

    const result = await reportService.getAllReports({ page, limit, status, reportType });

    res.status(200).json({
      status: 'success',
      message: 'Reports retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's reports
 */
const getUserReports = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page, limit, status } = req.query;

    const result = await reportService.getUserReports(userId, { page, limit, status });

    res.status(200).json({
      status: 'success',
      message: 'Reports retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get report by ID
 */
const getReportById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    const report = await reportService.getReportById(id, userId, isAdmin);

    res.status(200).json({
      status: 'success',
      message: 'Report retrieved successfully',
      data: report
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update report
 */
const updateReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';
    const { status, description } = req.body;

    const report = await reportService.updateReport(
      id,
      { status, description },
      userId,
      isAdmin
    );

    res.status(200).json({
      status: 'success',
      message: 'Report updated successfully',
      data: report
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete report
 */
const deleteReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    const result = await reportService.deleteReport(id, userId, isAdmin);

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
 * Get report statistics
 */
const getReportStatistics = async (req, res, next) => {
  try {
    const userId = req.user.role === 'ADMIN' ? null : req.user.id;

    const stats = await reportService.generateStatistics({ userId });

    res.status(200).json({
      status: 'success',
      message: 'Statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReport,
  getAllReports,
  getUserReports,
  getReportById,
  updateReport,
  deleteReport,
  getReportStatistics
};

