const rateLimit = require('express-rate-limit');
const config = require('../config/env');
const ApiError = require('../utils/apiError');

/**
 * General Rate Limiter for standard API endpoints
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.env === 'test',
  handler: (req, res, next) => {
    next(
      new ApiError(
        429,
        'Hệ thống đang tiếp nhận quá nhiều yêu cầu từ bạn. Vui lòng thử lại sau vài phút.'
      )
    );
  },
});

/**
 * Rate Limiter for Authentication endpoints (prevent brute-force attacks)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 20, // Limit each IP to 20 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.env === 'test',
  handler: (req, res, next) => {
    next(
      new ApiError(
        429,
        'Bạn đã thực hiện quá nhiều yêu cầu xác thực. Vui lòng thử lại sau 15 phút.'
      )
    );
  },
});

/**
 * Rate Limiter for sensitive mutation actions (booking requests, reviews)
 */
const actionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.env === 'test',
  handler: (req, res, next) => {
    next(
      new ApiError(
        429,
        'Bạn đang thực hiện thao tác quá nhanh. Vui lòng chờ vài phút trước khi tiếp tục.'
      )
    );
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  actionLimiter,
};
