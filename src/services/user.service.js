const prisma = require('../config/database');
const { hashPassword, comparePassword, generateToken, generateRefreshToken } = require('../utils/auth');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

/**
 * User Service
 * Handles business logic for user operations
 */

class UserService {
  /**
   * Register a new user
   */
  async register(userData) {
    const { email, password, name, phone } = userData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw ApiError.conflict('Email already registered');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true
      }
    });

    // Generate tokens
    const token = generateToken({ userId: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id });

    logger.info('User registered successfully', { userId: user.id, email: user.email });

    return {
      user,
      token,
      refreshToken
    };
  }

  /**
   * Authenticate user
   */
  async login(credentials) {
    const { email, password } = credentials;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Generate tokens
    const token = generateToken({ userId: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id });

    logger.info('User logged in successfully', { userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role
      },
      token,
      refreshToken
    };
  }

  /**
   * Get user profile
   */
  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updateData) {
    const { name, phone } = updateData;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(phone && { phone })
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        updatedAt: true
      }
    });

    logger.info('User profile updated', { userId: user.id });

    return user;
  }

  /**
   * Delete user
   */
  async deleteUser(userId) {
    await prisma.user.delete({
      where: { id: userId }
    });

    logger.info('User deleted', { userId });

    return { message: 'User deleted successfully' };
  }

  /**
   * Change password
   */
  async changePassword(userId, oldPassword, newPassword) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Verify old password
    const isPasswordValid = await comparePassword(oldPassword, user.password);

    if (!isPasswordValid) {
      throw ApiError.badRequest('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    logger.info('Password changed successfully', { userId });

    return { message: 'Password changed successfully' };
  }
}

module.exports = new UserService();

