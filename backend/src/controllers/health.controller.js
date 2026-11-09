const { getDBStatus } = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const config = require('../config/env');

/**
 * @desc Get system & database health status
 * @route GET /api/health
 * @access Public
 */
const getHealthStatus = asyncHandler(async (req, res) => {
  const dbStatus = getDBStatus();

  const healthData = {
    service: 'Tutor Connect Backend API',
    status: dbStatus.stateCode === 1 ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: config.env,
    database: {
      status: dbStatus.state,
      connected: dbStatus.stateCode === 1,
      host: dbStatus.host,
      name: dbStatus.dbName,
    },
    version: '1.0.0',
  };

  return ApiResponse.ok(res, healthData, 'Health check passed');
});

module.exports = {
  getHealthStatus,
};

