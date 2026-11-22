const mongoose = require('mongoose');
const {
  SLOT_STATUS,
  ALL_SLOT_STATUSES,
  DEFAULT_TIMEZONE,
} = require('../constants/availabilityStatus');

const availabilitySlotSchema = new mongoose.Schema(
  {
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Tutor ID là bắt buộc'],
      index: true,
    },
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
    status: {
      type: String,
      enum: {
        values: ALL_SLOT_STATUSES,
        message: 'Trạng thái slot {VALUE} không hợp lệ',
      },
      default: SLOT_STATUS.AVAILABLE,
      index: true,
    },
    note: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Ghi chú không được vượt quá 500 ký tự'],
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Compound indexes for fast query and overlap checking
 */
availabilitySlotSchema.index({ tutorId: 1, startAt: 1, endAt: 1 });
availabilitySlotSchema.index({ tutorId: 1, status: 1, startAt: 1 });

/**
 * Virtual duration in minutes
 */
availabilitySlotSchema.virtual('durationMinutes').get(function () {
  if (!this.startAt || !this.endAt) return 0;
  return Math.round((this.endAt.getTime() - this.startAt.getTime()) / 60000);
});

/**
 * Static helper: Check if any active/non-closed slot overlaps for this tutor
 * Overlap formula: slot.startAt < newEndAt AND slot.endAt > newStartAt
 */
availabilitySlotSchema.statics.findOverlappingSlot = async function (
  tutorId,
  startAt,
  endAt,
  excludeSlotId = null
) {
  const query = {
    tutorId,
    status: { $in: [SLOT_STATUS.AVAILABLE, SLOT_STATUS.BOOKED] },
    startAt: { $lt: new Date(endAt) },
    endAt: { $gt: new Date(startAt) },
  };

  if (excludeSlotId) {
    query._id = { $ne: excludeSlotId };
  }

  return this.findOne(query);
};

/**
 * Static atomic helper: Book an available slot
 */
availabilitySlotSchema.statics.atomicBookSlot = async function (
  slotId,
  bookingId,
  session = null
) {
  const options = { returnDocument: 'after', runValidators: true };
  if (session) {
    options.session = session;
  }

  return this.findOneAndUpdate(
    { _id: slotId, status: SLOT_STATUS.AVAILABLE },
    { status: SLOT_STATUS.BOOKED, bookingId },
    options
  );
};

/**
 * Static atomic helper: Release a booked slot back to available
 */
availabilitySlotSchema.statics.atomicReleaseSlot = async function (
  slotId,
  bookingId = null,
  session = null
) {
  const query = { _id: slotId, status: SLOT_STATUS.BOOKED };
  if (bookingId) {
    query.bookingId = bookingId;
  }

  const options = { returnDocument: 'after', runValidators: true };
  if (session) {
    options.session = session;
  }

  return this.findOneAndUpdate(
    query,
    { status: SLOT_STATUS.AVAILABLE, bookingId: null },
    options
  );
};

const AvailabilitySlot = mongoose.model('AvailabilitySlot', availabilitySlotSchema);

module.exports = AvailabilitySlot;
