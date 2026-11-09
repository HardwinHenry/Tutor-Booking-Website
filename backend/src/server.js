const app = require('./app');
const config = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');

let server;

const startServer = async () => {
  try {
    // Connect to MongoDB Atlas
    await connectDB();

    // Start Express HTTP Server
    server = app.listen(config.port, () => {
      console.log(`===============================================`);
      console.log(`  🚀 Tutor Connect Backend Server Running`);
      console.log(`  🌐 Environment: ${config.env}`);
      console.log(`  📡 Port: ${config.port}`);
      console.log(`  🔗 Health Check: http://localhost:${config.port}/api/health`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      await disconnectDB();
      console.log('[Server] Graceful shutdown completed.');
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }

  // Force shutdown after 10 seconds timeout
  setTimeout(() => {
    console.error('[Server] Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection] at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[Uncaught Exception] thrown:', error);
  process.exit(1);
});

// Run server
startServer();

