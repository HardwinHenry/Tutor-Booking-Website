const mongoose = require('mongoose');
const {
  BOOKING_STATUS,
  ALL_BOOKING_STATUSES,
  CANCELLED_BY_ROLES,
  ALL_CANCELLED_BY_ROLES,
  isValidTransition,
} = require('../constants/bookingStatus');
const { DEFAULT_TIMEZONE } = require('../constants/availabilityStatus');

const bookingSchema = new mongoose.Schema(
  {
    learnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Học viên (learnerId) là bắt buộc'],
      index: true,
    },
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Gia sư (tutorId) là bắt buộc'],
      index: true,
    },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AvailabilitySlot',
      required: [true, 'Lịch dạy (slotId) là bắt buộc'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ALL_BOOKING_STATUSES,
        message: 'Trạng thái booking {VALUE} không hợp lệ',
      },
      default: BOOKING_STATUS.PENDING,
      index: true,
    },

    // Snapshot fields preserved at booking creation time
    startAt: {
      type: Date,
      required: [true, 'Thời gian bắt đầu (startAt) là bắt buộc'],
      index: true,
    },
    endAt: {
      type: Date,
      required: [true, 'Thời gian kết thúc (endAt) là bắt buộc'],
      index: true,
    },
    timezone: {
      type: String,
      default: DEFAULT_TIMEZONE,
      trim: true,
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Thời lượng (durationMinutes) là bắt buộc'],
      min: [1, 'Thời lượng tối thiểu là 1 phút'],
    },
    price: {
      type: Number,
      default: 0,
      min: [0, 'Giá không được âm'],
    },
    currency: {
      type: String,
      default: 'VND',
      trim: true,
    },

    // Learning and subject details
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Taxonomy',
      default: null,
    },
    subjectName: {
      type: String,
      trim: true,
      default: '',
    },
    learningMode: {
      type: String,
      trim: true,
      default: 'online',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    learnerNote: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Ghi chú của học viên không vượt quá 500 ký tự'],
    },
    tutorNote: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Ghi chú của gia sư không vượt quá 500 ký tự'],
    },

    // Lifecycle audit fields
    confirmedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
      trim: true,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    cancelledByRole: {
      type: String,
      enum: {
        values: ALL_CANCELLED_BY_ROLES,
        message: 'Vai trò hủy {VALUE} không hợp lệ',
      },
      default: null,
    },
    cancelReason: {
      type: String,
      default: null,
      trim: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for fast query filtering and sorting
bookingSchema.index({ learnerId: 1, status: 1, startAt: -1 });
bookingSchema.index({ tutorId: 1, status: 1, startAt: -1 });
bookingSchema.index({ slotId: 1, status: 1 });
bookingSchema.index({ startAt: 1, endAt: 1 });

/**
 * Virtual: check if session has ended in time
 */
bookingSchema.virtual('isSessionPassed').get(function () {
  if (!this.endAt) return false;
  return new Date(this.endAt) <= new Date();
});

/**
 * Instance helper method: check if transitioning to new status is allowed
 */
bookingSchema.methods.canTransitionTo = function (nextStatus) {
  return isValidTransition(this.status, nextStatus);
};

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
