const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Hash a password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} - True if match
 */
const comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

/**
 * Generate JWT token
 * @param {Object} payload - Token payload (user data)
 * @returns {string} - JWT token
 */
const generateToken = (payload) => {
    return jwt.sign(
        payload,
        process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        }
    );
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} - Decoded token payload
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(
            token,
            process.env.JWT_SECRET || 'your-secret-key-change-in-production'
        );
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
};

/**
 * Generate refresh token
 * @param {Object} payload - Token payload
 * @returns {string} - Refresh token
 */
const generateRefreshToken = (payload) => {
    return jwt.sign(
        payload,
        process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
        {
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
        }
    );
};

module.exports = {
    hashPassword,
    comparePassword,
    generateToken,
    verifyToken,
    generateRefreshToken
};

