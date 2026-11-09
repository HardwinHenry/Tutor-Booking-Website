const ApiError = require('../utils/apiError');

/**
 * Middleware to handle unmatched route paths (404 Not Found)
 */
const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Cannot ${req.method} ${req.originalUrl}`));
};

module.exports = notFoundHandler;

