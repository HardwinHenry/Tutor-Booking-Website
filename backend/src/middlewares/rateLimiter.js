const rateLimit = require('express-rate-limit');
const config = require('../config/env');
const ApiError = require('../utils/apiError');

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

module.exports = {
  authLimiter,
};
