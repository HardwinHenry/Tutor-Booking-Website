const ApiError = require('../utils/apiError');

/**
 * Recursively check if an object or array contains keys starting with '$' or containing '.' (MongoDB query operators)
 */
const hasMongoOperators = (obj) => {
  if (!obj || typeof obj !== 'object') return false;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (hasMongoOperators(item)) return true;
    }
    return false;
  }

  for (const key of Object.keys(obj)) {
    if (
      key.startsWith('$') ||
      key.includes('.') ||
      key.includes('[$') ||
      key.includes('$.')
    ) {
      return true;
    }
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      if (hasMongoOperators(obj[key])) {
        return true;
      }
    }
  }
  return false;
};

/**
 * Middleware to prevent NoSQL Injection attacks by rejecting malicious operators
 */
const noSqlSanitizer = (req, res, next) => {
  if (req.body && hasMongoOperators(req.body)) {
    return next(
      ApiError.badRequest('Dữ liệu chứa toán tử truy vấn không hợp lệ (NoSQL Injection detected)')
    );
  }
  if (req.query && hasMongoOperators(req.query)) {
    return next(
      ApiError.badRequest('Tham số URL chứa toán tử không hợp lệ (NoSQL Injection detected)')
    );
  }
  if (req.params && hasMongoOperators(req.params)) {
    return next(
      ApiError.badRequest('Tham số đường dẫn chứa ký tự không hợp lệ (NoSQL Injection detected)')
    );
  }
  next();
};

/**
 * Sanitize dangerous HTML script tags to prevent stored/reflected XSS
 */
const cleanString = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return;
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (typeof obj[i] === 'string') {
        obj[i] = cleanString(obj[i]);
      } else if (typeof obj[i] === 'object' && obj[i] !== null) {
        sanitizeObject(obj[i]);
      }
    }
    return;
  }

  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string') {
      obj[key] = cleanString(obj[key]);
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
};

/**
 * Middleware to sanitize inputs against script injection
 */
const xssSanitizer = (req, res, next) => {
  if (req.body) {
    sanitizeObject(req.body);
  }
  next();
};

module.exports = {
  noSqlSanitizer,
  xssSanitizer,
  hasMongoOperators,
};
