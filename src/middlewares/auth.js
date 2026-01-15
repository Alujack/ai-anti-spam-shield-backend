const { verifyToken } = require('../utils/auth');
const ApiError = require('../utils/apiError');
const prisma = require('../config/database');

/**
 * Authentication middleware
 * Verifies user authentication tokens
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Access token is required');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true
      }
    });

    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.message === 'Invalid or expired token') {
      next(ApiError.unauthorized('Invalid or expired token'));
    } else if (error.isOperational) {
      next(error);
    } else {
      next(ApiError.unauthorized('Authentication failed'));
    }
  }
};

/**
 * Authorization middleware
 * Checks if user has required permissions
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to access this resource'));
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Sets req.user if valid token is provided, but doesn't require authentication
 * Used for routes that work for both authenticated and unauthenticated users
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided - continue without user
      return next();
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true
      }
    });

    if (user) {
      // Attach user to request
      req.user = user;
    }

    next();
  } catch (error) {
    // Token invalid or expired - continue without user
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuthenticate
};

