const mongoose = require('mongoose');
const dns = require('dns');
const config = require('./env');

// Set DNS servers to resolve MongoDB Atlas SRV records reliably on Windows/Node
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // If setServers fails in certain environments, continue gracefully
}

const connectionStates = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodb.uri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
    console.log(`[MongoDB] Database name: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection failed: ${error.message}`);
    if (config.env !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('[MongoDB] Connection closed.');
  } catch (error) {
    console.error(`[MongoDB] Disconnection error: ${error.message}`);
  }
};

const getDBStatus = () => {
  const readyState = mongoose.connection.readyState;
  return {
    stateCode: readyState,
    state: connectionStates[readyState] || 'unknown',
    host: mongoose.connection.host || null,
    dbName: mongoose.connection.name || null,
  };
};

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Warning: Database connection lost.');
});

mongoose.connection.on('reconnected', () => {
  console.log('[MongoDB] Database reconnected.');
});

module.exports = {
  connectDB,
  disconnectDB,
  getDBStatus,
};

