const dotenv = require('dotenv');
const path = require('path');

// Load .env from backend directory
dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

const env = process.env.NODE_ENV || 'development';

const getMongoUri = () => {
  if (env === 'test') {
    if (process.env.MONGODB_TEST_URI) {
      return process.env.MONGODB_TEST_URI;
    }
    if (process.env.MONGODB_URI) {
      return process.env.MONGODB_URI.replace(/\/tutor_booking(\?|$)/, '/tutor_booking_test$1');
    }
    return 'mongodb://localhost:27017/tutor_booking_test';
  }
  return process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor_booking';
};

const config = {
  env,
  port: parseInt(process.env.PORT || '5000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongodb: {
    uri: getMongoUri(),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default_jwt_secret_do_not_use_in_prod',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret:
      process.env.JWT_REFRESH_SECRET ||
      (process.env.JWT_SECRET
        ? `${process.env.JWT_SECRET}_refresh`
        : 'default_jwt_refresh_secret_do_not_use_in_prod'),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
  },
};

// Validate mandatory environment variables in production
if (env === 'production') {
  const missingSecrets = [];
  if (
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET === 'default_jwt_secret_do_not_use_in_prod'
  ) {
    missingSecrets.push('JWT_SECRET');
  }
  if (!process.env.MONGODB_URI) {
    missingSecrets.push('MONGODB_URI');
  }
  if (missingSecrets.length > 0) {
    throw new Error(
      `[CRITICAL] Missing mandatory environment variables for production: ${missingSecrets.join(', ')}. Server cannot start.`
    );
  }
}

module.exports = config;
