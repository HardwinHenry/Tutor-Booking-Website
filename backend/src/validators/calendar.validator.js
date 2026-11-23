const mongoose = require('mongoose');
const ApiError = require('../utils/apiError');
const { ALL_CALENDAR_SYNC_STATUSES } = require('../constants/calendarStatus');

/**
 * Validate OAuth callback query parameters
 */
const validateOAuthCallback = (req, res, next) => {
  const { code, state } = req.query;

  if (!code || typeof code !== 'string' || !code.trim()) {
    return next(ApiError.badRequest('Mã code ủy quyền từ Google là bắt buộc'));
  }

  if (!state || typeof state !== 'string' || !state.trim()) {
    return next(ApiError.badRequest('Tham số state chống tấn công CSRF là bắt buộc'));
  }

  next();
};

/**
 * Validate retry sync body
 */
const validateRetrySync = (req, res, next) => {
  const { bookingId } = req.body;

  if (!bookingId) {
    return next(ApiError.badRequest('Mã lịch hẹn (bookingId) là bắt buộc'));
  }

  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    return next(ApiError.badRequest('Mã lịch hẹn (bookingId) không đúng định dạng'));
  }

  next();
};

/**
 * Validate admin calendar sync list queries
 */
const validateAdminCalendarSyncQuery = (req, res, next) => {
  const { syncStatus, userId, bookingId } = req.query;

  if (syncStatus && !ALL_CALENDAR_SYNC_STATUSES.includes(syncStatus)) {
    return next(
      ApiError.badRequest(
        `Trạng thái đồng bộ không hợp lệ. Phải là một trong: ${ALL_CALENDAR_SYNC_STATUSES.join(', ')}`
      )
    );
  }

  if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
    return next(ApiError.badRequest('Mã người dùng (userId) không hợp lệ'));
  }

  if (bookingId && !mongoose.Types.ObjectId.isValid(bookingId)) {
    return next(ApiError.badRequest('Mã lịch hẹn (bookingId) không hợp lệ'));
  }

  next();
};

module.exports = {
  validateOAuthCallback,
  validateRetrySync,
  validateAdminCalendarSyncQuery,
};
