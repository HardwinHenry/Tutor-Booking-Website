const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const config = require('./config/env');
const requestLogger = require('./middlewares/requestLogger');
const notFoundHandler = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');
const routes = require('./routes');
const { getHealthStatus } = require('./controllers/health.controller');

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin:
    config.clientUrl === '*'
      ? '*'
      : [config.clientUrl, 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use(cors(corsOptions));

// HTTP request logger
app.use(requestLogger);

// Gzip compression
app.use(compression());

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root health check (standard cloud probe endpoint)
app.get('/health', getHealthStatus);

// API Routes
app.use('/api', routes);

// 404 Not Found Handler
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
