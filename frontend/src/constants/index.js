/**
 * Application Constants
 */

export const ROLES = {
  LEARNER: 'learner',
  TUTOR: 'tutor',
  ADMIN: 'admin',
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'tc_access_token',
  REFRESH_TOKEN: 'tc_refresh_token',
  USER: 'tc_user',
  THEME: 'tc_theme',
  LEARNER_ONBOARDING_DRAFT: 'tc_learner_draft',
  TUTOR_ONBOARDING_DRAFT: 'tc_tutor_draft',
  SURVEY_STATUS: 'tc_survey_status',
};

// Vòng đời AvailabilitySlot (Tutor)
export const AVAILABILITY_STATUS = {
  AVAILABLE: 'available',
  RESERVED: 'reserved',
  CANCELLED: 'cancelled',
};

// Vòng đời Booking
export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
};

// Trạng thái phê duyệt TutorProfile
export const TUTOR_PROFILE_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// Trạng thái hoàn thành Onboarding
export const ONBOARDING_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
};

// Trạng thái đồng bộ Google Calendar
export const CALENDAR_SYNC_STATUS = {
  SYNCED: 'synced',
  FAILED: 'failed',
  SKIPPED: 'skipped',
};
