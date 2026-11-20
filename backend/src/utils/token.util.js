const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/env');

/**
 * Generate Access Token for authenticated user
 * @param {Object} user User document or object
 * @returns {string} JWT access token
 */
const generateAccessToken = (user) => {
  const payload = {
    id: user._id ? user._id.toString() : user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

/**
 * Generate Refresh Token for authenticated user
 * @param {Object} user User document or object
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (user) => {
  const payload = {
    id: user._id ? user._id.toString() : user.id,
    type: 'refresh',
    jti: crypto.randomUUID(),
  };

  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
};

/**
 * Verify Access Token
 * @param {string} token
 * @returns {Object} decoded payload
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};

/**
 * Verify Refresh Token
 * @param {string} token
 * @returns {Object} decoded payload
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwt.refreshSecret);
};

/**
 * Hash raw token string using SHA-256 for secure database storage
 * @param {string} token
 * @returns {string} hex digest
 */
const hashToken = (token) => {
  if (!token) return null;
  return crypto.createHash('sha256').update(token).digest('hex');
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
};
