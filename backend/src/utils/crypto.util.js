const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config/env');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Derive 32-byte encryption key from environment secret
 */
const getEncryptionKey = () => {
  const secret = process.env.CALENDAR_ENCRYPTION_KEY || config.jwt.secret || 'tutor-connect-secure-key';
  return crypto.createHash('sha256').update(secret).digest();
};

/**
 * Encrypt plaintext string using AES-256-GCM
 * @param {string} text - Plain text to encrypt
 * @returns {string} iv:authTag:encryptedHex
 */
const encrypt = (text) => {
  if (!text) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt string using AES-256-GCM
 * @param {string} encryptedString - Format iv:authTag:encryptedHex
 * @returns {string} Decrypted plain text
 */
const decrypt = (encryptedString) => {
  if (!encryptedString) return null;
  const parts = encryptedString.split(':');
  if (parts.length !== 3) {
    throw new Error('Dữ liệu mã hóa không đúng định dạng');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};

/**
 * Generate CSRF state token for OAuth flow
 * @param {object} payload - Custom state data (e.g. userId, returnUrl)
 * @param {string} expiresIn - State token lifetime, default 15m
 * @returns {string} Signed JWT state token
 */
const generateOAuthState = (payload = {}, expiresIn = '15m') => {
  const stateData = {
    ...payload,
    nonce: crypto.randomBytes(16).toString('hex'),
    type: 'google_calendar_oauth',
  };
  return jwt.sign(stateData, config.jwt.secret, { expiresIn });
};

/**
 * Verify and decode CSRF state token
 * @param {string} state - State token returned from OAuth provider
 * @returns {object} Decoded payload
 */
const verifyOAuthState = (state) => {
  if (!state) {
    throw new Error('Thiếu tham số state xác thực OAuth');
  }
  const decoded = jwt.verify(state, config.jwt.secret);
  if (decoded.type !== 'google_calendar_oauth') {
    throw new Error('Tham số state không hợp lệ cho luồng Google Calendar');
  }
  return decoded;
};

module.exports = {
  encrypt,
  decrypt,
  generateOAuthState,
  verifyOAuthState,
};
