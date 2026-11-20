const express = require('express');
const authController = require('../controllers/auth.controller');
const {
  validateRegister,
  validateLogin,
  validateRefreshToken,
} = require('../validators/auth.validator');
const { authenticate } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account (learner or tutor)
 * @access  Public
 */
router.post('/register', authLimiter, validateRegister, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return tokens
 * @access  Public
 */
router.post('/login', authLimiter, validateLogin, authController.login);

/**
 * @route   POST /api/auth/refresh (and alias /refresh-token)
 * @desc    Get new access token using refresh token
 * @access  Public
 */
router.post('/refresh', validateRefreshToken, authController.refreshToken);
router.post('/refresh-token', validateRefreshToken, authController.refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Log out authenticated user and revoke refresh token
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, authController.getMe);

module.exports = router;

