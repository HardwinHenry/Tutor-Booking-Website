const morgan = require('morgan');
const config = require('../config/env');

// Use custom concise format or standard formats based on environment
const devFormat = ':method :url :status :response-time ms - :res[content-length]';
const prodFormat = 'combined';

const requestLogger = morgan(config.env === 'production' ? prodFormat : devFormat, {
  // Skip logging during test runs
  skip: () => config.env === 'test',
});

module.exports = requestLogger;

