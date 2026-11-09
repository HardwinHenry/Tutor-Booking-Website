const dotenv = require('dotenv');
const path = require('path');

// Load .env from backend directory
dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor_booking',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default_jwt_secret_do_not_use_in_prod',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
  },
};

module.exports = config;
