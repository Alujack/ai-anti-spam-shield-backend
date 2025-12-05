const userService = require('../services/user.service');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

/**
 * Register a new user
 */
const register = async (req, res, next) => {
  try {
    const { email, password, name, phone } = req.body;

    // Validation
    if (!email || !password) {
      throw ApiError.badRequest('Email and password are required');
    }

    if (password.length < 6) {
      throw ApiError.badRequest('Password must be at least 6 characters');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw ApiError.badRequest('Invalid email format');
    }

    const result = await userService.register({ email, password, name, phone });

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * User login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      throw ApiError.badRequest('Email and password are required');
    }

    const result = await userService.login({ email, password });

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user profile
 */
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await userService.getProfile(userId);

    res.status(200).json({
      status: 'success',
      message: 'Profile retrieved successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, phone } = req.body;

    const user = await userService.updateProfile(userId, { name, phone });

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 */
const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      throw ApiError.badRequest('Old password and new password are required');
    }

    if (newPassword.length < 6) {
      throw ApiError.badRequest('New password must be at least 6 characters');
    }

    const result = await userService.changePassword(userId, oldPassword, newPassword);

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
 * Delete user
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    await userService.deleteUser(id);

    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  deleteUser
};

