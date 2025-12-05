const prisma = require('../config/database');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

/**
 * Report Service
 * Handles business logic for report operations
 */

class ReportService {
  /**
   * Create a new report
   */
  async createReport(reportData) {
    const { userId, messageText, reportType, description } = reportData;

    // Validate report type
    const validTypes = ['SPAM', 'PHISHING', 'SCAM', 'SUSPICIOUS', 'OTHER'];
    if (!validTypes.includes(reportType)) {
      throw ApiError.badRequest('Invalid report type');
    }

    const report = await prisma.report.create({
      data: {
        userId,
        messageText,
        reportType,
        description
      }
    });

    logger.info('Report created', { reportId: report.id, userId });

    return report;
  }

  /**
   * Get all reports
   */
  async getAllReports(filters = {}) {
    const { page = 1, limit = 20, status, reportType, userId } = filters;
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(reportType && { reportType }),
      ...(userId && { userId })
    };

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.report.count({ where })
    ]);

    return {
      reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get report by ID
   */
  async getReportById(id, userId = null, isAdmin = false) {
    const where = {
      id,
      ...(userId && !isAdmin && { userId })
    };

    const report = await prisma.report.findFirst({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    if (!report) {
      throw ApiError.notFound('Report not found');
    }

    return report;
  }

  /**
   * Get user's reports
   */
  async getUserReports(userId, filters = {}) {
    const { page = 1, limit = 20, status } = filters;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(status && { status })
    };

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.report.count({ where })
    ]);

    return {
      reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update report
   */
  async updateReport(id, updateData, userId = null, isAdmin = false) {
    const { status, description } = updateData;

    // Check if report exists and user has permission
    const existingReport = await this.getReportById(id, userId, isAdmin);

    // Only admins can update status
    if (status && !isAdmin) {
      throw ApiError.forbidden('Only admins can update report status');
    }

    // Users can only update their own reports' description
    if (description && !isAdmin && existingReport.userId !== userId) {
      throw ApiError.forbidden('You can only update your own reports');
    }

    const report = await prisma.report.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(description && { description })
      }
    });

    logger.info('Report updated', { reportId: id, userId });

    return report;
  }

  /**
   * Delete report
   */
  async deleteReport(id, userId = null, isAdmin = false) {
    // Check if report exists and user has permission
    await this.getReportById(id, userId, isAdmin);

    await prisma.report.delete({
      where: { id }
    });

    logger.info('Report deleted', { reportId: id, userId });

    return { message: 'Report deleted successfully' };
  }

  /**
   * Generate statistics from reports
   */
  async generateStatistics(filters = {}) {
    const { userId } = filters;

    const where = userId ? { userId } : {};

    const [
      total,
      pending,
      reviewed,
      resolved,
      rejected,
      byType
    ] = await Promise.all([
      prisma.report.count({ where }),
      prisma.report.count({ where: { ...where, status: 'PENDING' } }),
      prisma.report.count({ where: { ...where, status: 'REVIEWED' } }),
      prisma.report.count({ where: { ...where, status: 'RESOLVED' } }),
      prisma.report.count({ where: { ...where, status: 'REJECTED' } }),
      prisma.report.groupBy({
        by: ['reportType'],
        where,
        _count: true
      })
    ]);

    return {
      total,
      byStatus: {
        pending,
        reviewed,
        resolved,
        rejected
      },
      byType: byType.reduce((acc, item) => {
        acc[item.reportType] = item._count;
        return acc;
      }, {})
    };
  }
}

module.exports = new ReportService();

