const express = require('express');
const healthRoutes = require('./health.routes');

const router = express.Router();

// Mount Health Check Routes
router.use('/health', healthRoutes);

// Root API Information
router.get('/', (req, res) => {
  res.json({
    name: 'Tutor Connect Platform API',
    version: '1.0.0',
    status: 'online',
    documentation: '/api/docs',
    endpoints: {
      health: '/api/health',
    },
  });
});

module.exports = router;

