/**
 * Booking Lifecycle Constants & State Machine Rules
 * Phase 8 - Tutor Booking Lifecycle Management
 */

const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
};

const ALL_BOOKING_STATUSES = Object.values(BOOKING_STATUS);

/**
 * Valid state transitions for the booking lifecycle state machine:
 * pending   -> confirmed | rejected | cancelled
 * confirmed -> cancelled | completed
 * rejected  -> (terminal state)
 * cancelled -> (terminal state)
 * completed -> (terminal state)
 */
const VALID_STATUS_TRANSITIONS = {
  [BOOKING_STATUS.PENDING]: [
    BOOKING_STATUS.CONFIRMED,
    BOOKING_STATUS.REJECTED,
    BOOKING_STATUS.CANCELLED,
  ],
  [BOOKING_STATUS.CONFIRMED]: [
    BOOKING_STATUS.CANCELLED,
    BOOKING_STATUS.COMPLETED,
  ],
  [BOOKING_STATUS.REJECTED]: [],
  [BOOKING_STATUS.CANCELLED]: [],
  [BOOKING_STATUS.COMPLETED]: [],
};

const CANCELLED_BY_ROLES = {
  LEARNER: 'learner',
  TUTOR: 'tutor',
  ADMIN: 'admin',
  SYSTEM: 'system',
};

const ALL_CANCELLED_BY_ROLES = Object.values(CANCELLED_BY_ROLES);

/**
 * Helper to check whether a status transition is valid
 */
const isValidTransition = (currentStatus, nextStatus) => {
  const allowed = VALID_STATUS_TRANSITIONS[currentStatus];
  if (!allowed) return false;
  return allowed.includes(nextStatus);
};

module.exports = {
  BOOKING_STATUS,
  ALL_BOOKING_STATUSES,
  VALID_STATUS_TRANSITIONS,
  CANCELLED_BY_ROLES,
  ALL_CANCELLED_BY_ROLES,
  isValidTransition,
};
