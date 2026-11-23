const mongoose = require('mongoose');
const {
  CALENDAR_SYNC_STATUS,
  ALL_CALENDAR_SYNC_STATUSES,
} = require('../constants/calendarStatus');
const { ROLES } = require('../constants/roles');

const calendarEventSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Mã booking (bookingId) là bắt buộc'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Mã người dùng (userId) là bắt buộc'],
      index: true,
    },
    userRole: {
      type: String,
      enum: [ROLES.LEARNER, ROLES.TUTOR],
      required: [true, 'Vai trò người dùng là bắt buộc'],
    },
    googleEventId: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
    googleHtmlLink: {
      type: String,
      default: null,
      trim: true,
    },
    syncStatus: {
      type: String,
      enum: {
        values: ALL_CALENDAR_SYNC_STATUSES,
        message: 'Trạng thái đồng bộ {VALUE} không hợp lệ',
      },
      default: CALENDAR_SYNC_STATUS.PENDING,
      index: true,
    },
    lastSyncedAt: {
      type: Date,
      default: null,
    },
    errorCode: {
      type: String,
      default: null,
      trim: true,
    },
    errorMessage: {
      type: String,
      default: null,
      trim: true,
    },
    retryCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    eventDetails: {
      summary: { type: String, default: '' },
      description: { type: String, default: '' },
      location: { type: String, default: '' },
      startAt: { type: Date, default: null },
      endAt: { type: Date, default: null },
      timezone: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Idempotency: each user has at most one CalendarEvent record per booking
calendarEventSchema.index({ bookingId: 1, userId: 1 }, { unique: true });
calendarEventSchema.index({ syncStatus: 1, lastSyncedAt: -1 });

const CalendarEvent = mongoose.model('CalendarEvent', calendarEventSchema);

module.exports = CalendarEvent;
