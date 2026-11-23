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
  const memUsage = process.memoryUsage();

  const healthData = {
    service: 'Tutor Connect Backend API',
    status: dbStatus.stateCode === 1 ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    uptime: Math.floor(process.uptime()),
    environment: config.env,
    system: {
      nodeVersion: process.version,
      pid: process.pid,
      memory: {
        rssMb: Math.round((memUsage.rss / 1024 / 1024) * 100) / 100,
        heapTotalMb: Math.round((memUsage.heapTotal / 1024 / 1024) * 100) / 100,
        heapUsedMb: Math.round((memUsage.heapUsed / 1024 / 1024) * 100) / 100,
      },
    },
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
