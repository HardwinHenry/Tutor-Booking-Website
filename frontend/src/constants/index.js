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

// Vòng đời AvailabilitySlot (Tutor) - đồng bộ backend availabilityStatus.js
export const AVAILABILITY_STATUS = {
  AVAILABLE: 'available',
  BOOKED: 'booked',
  CLOSED: 'closed',
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

// Trạng thái đồng bộ Google Calendar - đồng bộ backend calendarStatus.js
export const CALENDAR_SYNC_STATUS = {
  NOT_CONNECTED: 'not_connected',
  PENDING: 'pending',
  SYNCED: 'synced',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

// Trạng thái tài khoản User - đồng bộ backend userStatus.js
export const USER_STATUS = {
  ACTIVE: 'active',
  LOCKED: 'locked',
  DISABLED: 'disabled',
};

// Loại Taxonomy dùng chung
export const TAXONOMY_TYPES = [
  { value: 'category', label: 'Lĩnh vực (Category)' },
  { value: 'subject', label: 'Môn học (Subject)' },
  { value: 'topic', label: 'Chuyên môn (Topic)' },
  { value: 'level', label: 'Cấp độ (Level)' },
  { value: 'learning_purpose', label: 'Mục đích học' },
  { value: 'teaching_method', label: 'Phương pháp dạy' },
  { value: 'teaching_style', label: 'Phong cách gia sư' },
  { value: 'learning_material', label: 'Tài liệu học tập' },
  { value: 'interaction_level', label: 'Mức độ tương tác' },
  { value: 'time_band', label: 'Khung giờ trong ngày' },
  { value: 'learning_mode', label: 'Hình thức học' },
  { value: 'offline_location', label: 'Địa điểm Offline' },
  { value: 'support_type', label: 'Hoạt động hỗ trợ' },
  { value: 'learning_difficulty', label: 'Khó khăn học viên' },
  { value: 'support_approach', label: 'Cách xử lý khó khăn' },
  { value: 'progress_tracking', label: 'Theo dõi tiến độ' },
  { value: 'selection_priority', label: 'Tiêu chí ưu tiên' },
  { value: 'certificate_type', label: 'Loại chứng chỉ' },
  { value: 'tag', label: 'Tag chung' },
];
