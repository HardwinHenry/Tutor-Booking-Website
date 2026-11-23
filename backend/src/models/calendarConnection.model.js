const mongoose = require('mongoose');
const {
  CALENDAR_CONNECTION_STATUS,
  ALL_CALENDAR_CONNECTION_STATUSES,
} = require('../constants/calendarStatus');
const { encrypt, decrypt } = require('../utils/crypto.util');

const calendarConnectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID là bắt buộc'],
      unique: true,
      index: true,
    },
    googleEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    googleId: {
      type: String,
      trim: true,
      default: '',
    },
    encryptedAccessToken: {
      type: String,
      required: [true, 'Access token là bắt buộc'],
    },
    encryptedRefreshToken: {
      type: String,
      default: null,
    },
    tokenExpiry: {
      type: Date,
      default: null,
    },
    scope: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: {
        values: ALL_CALENDAR_CONNECTION_STATUSES,
        message: 'Trạng thái kết nối {VALUE} không hợp lệ',
      },
      default: CALENDAR_CONNECTION_STATUS.CONNECTED,
      index: true,
    },
    lastConnectedAt: {
      type: Date,
      default: Date.now,
    },
    lastDisconnectedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        // Strip sensitive tokens from JSON representations
        delete ret.encryptedAccessToken;
        delete ret.encryptedRefreshToken;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.encryptedAccessToken;
        delete ret.encryptedRefreshToken;
        return ret;
      },
    },
  }
);

/**
 * Helper to encrypt and save tokens
 */
calendarConnectionSchema.methods.setTokens = function ({
  accessToken,
  refreshToken,
  expiryDate,
  googleEmail,
  googleId,
  scope,
}) {
  if (accessToken) {
    this.encryptedAccessToken = encrypt(accessToken);
  }
  if (refreshToken) {
    this.encryptedRefreshToken = encrypt(refreshToken);
  }
  if (expiryDate) {
    this.tokenExpiry = new Date(expiryDate);
  }
  if (googleEmail) {
    this.googleEmail = googleEmail;
  }
  if (googleId) {
    this.googleId = googleId;
  }
  if (scope) {
    this.scope = Array.isArray(scope) ? scope : scope.split(' ');
  }
  this.status = CALENDAR_CONNECTION_STATUS.CONNECTED;
  this.lastConnectedAt = new Date();
  this.lastDisconnectedAt = null;
};

/**
 * Helper to decrypt and retrieve tokens
 */
calendarConnectionSchema.methods.getDecryptedTokens = function () {
  return {
    accessToken: this.encryptedAccessToken ? decrypt(this.encryptedAccessToken) : null,
    refreshToken: this.encryptedRefreshToken ? decrypt(this.encryptedRefreshToken) : null,
  };
};

/**
 * Check if the stored access token has expired (or will expire within bufferMinutes)
 */
calendarConnectionSchema.methods.isTokenExpired = function (bufferMinutes = 5) {
  if (!this.tokenExpiry) return true;
  const expiryWithBuffer = new Date(this.tokenExpiry.getTime() - bufferMinutes * 60 * 1000);
  return new Date() >= expiryWithBuffer;
};

const CalendarConnection = mongoose.model('CalendarConnection', calendarConnectionSchema);

module.exports = CalendarConnection;
