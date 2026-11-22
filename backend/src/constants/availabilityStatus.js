/**
 * Availability Slot Constants
 */
const SLOT_STATUS = {
  AVAILABLE: 'available',
  BOOKED: 'booked',
  CLOSED: 'closed',
};

const ALL_SLOT_STATUSES = Object.values(SLOT_STATUS);

const DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh';
const MIN_SLOT_DURATION_MINUTES = 15;
const MAX_SLOT_DURATION_MINUTES = 480; // 8 hours max per single slot

module.exports = {
  SLOT_STATUS,
  ALL_SLOT_STATUSES,
  DEFAULT_TIMEZONE,
  MIN_SLOT_DURATION_MINUTES,
  MAX_SLOT_DURATION_MINUTES,
};
