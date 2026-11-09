const config = require('../config/env');
const ApiError = require('../utils/apiError');

/**
 * Centralized Error Handler Middleware
 */
const errorHandler = (err, req, res, _next) => {
  let error = err;

  // Handle Mongoose CastError (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    const message = `Invalid value '${err.value}' for field '${err.path}'`;
    error = ApiError.badRequest(message);
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const errorDetails = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    error = ApiError.unprocessable('Validation Error', errorDetails);
  }

  // Handle MongoDB Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `Duplicate value entered for '${duplicateField}'. Please use another value.`;
    error = ApiError.conflict(message);
  }

  // Handle malformed JSON request body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = ApiError.badRequest('Malformed JSON in request body');
  }

  // Fallback to internal error if not an instance of ApiError
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, [], err.stack);
  }

  const statusCode = error.statusCode || 500;
  const response = {
    success: false,
    statusCode,
    message: error.message || 'An unexpected error occurred',
    errors: error.errors || [],
  };

  if (config.env === 'development') {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;

