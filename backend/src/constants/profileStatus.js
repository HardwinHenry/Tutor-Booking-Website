/**
 * Profile and Questionnaire Status Constants and Mappings
 */
const COMPLETION_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
};

const ALL_COMPLETION_STATUSES = Object.values(COMPLETION_STATUS);

const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

const ALL_APPROVAL_STATUSES = Object.values(APPROVAL_STATUS);

/**
 * Learner Budget Ranges mapped to VND values
 */
const LEARNER_BUDGET_RANGES = {
  under_50k: { min: 0, max: 50000, label: 'Dưới 50.000đ' },
  '50k_100k': { min: 50000, max: 100000, label: '50.000đ – 100.000đ' },
  '100k_200k': { min: 100000, max: 200000, label: '100.000đ – 200.000đ' },
  '200k_300k': { min: 200000, max: 300000, label: '200.000đ – 300.000đ' },
  over_300k: { min: 300000, max: 2000000, label: 'Trên 300.000đ' },
};

/**
 * Tutor Price Ranges mapped to VND values
 */
const TUTOR_PRICE_RANGES = {
  '100k_200k': { min: 100000, max: 200000, isNegotiable: false, label: '100.000đ – 200.000đ' },
  '200k_300k': { min: 200000, max: 300000, isNegotiable: false, label: '200.000đ – 300.000đ' },
  '300k_500k': { min: 300000, max: 500000, isNegotiable: false, label: '300.000đ – 500.000đ' },
  over_500k: { min: 500000, max: 2500000, isNegotiable: false, label: 'Trên 500.000đ' },
  negotiable: { min: 0, max: 0, isNegotiable: true, label: 'Có thể thương lượng' },
};

/**
 * Enums for fixed option questions
 */
const ENUMS = {
  TARGET_DURATION: [
    'under_1_month',
    '1_3_months',
    '3_6_months',
    '6_12_months',
    'over_1_year',
    'no_deadline',
  ],
  PACE: ['slow_detailed', 'moderate', 'fast', 'flexible'],
  CLASS_FORMAT: ['one_to_one', 'small_group', 'medium_group', 'large_group', 'any', 'all'],
  WEEKDAYS: [0, 1, 2, 3, 4, 5, 6],
  SESSIONS_PER_WEEK: [1, 2, 3, 4, 5],
  TUTOR_MAX_SESSIONS: ['1_2', '3_4', '5_6', '7_10', 'over_10', 'flexible'],
  SESSION_DURATIONS: [30, 45, 60, 90, 120, 'over_120', 'flexible'],
  EXPERIENCE_RANGE: [
    'no_preference',
    'beginner',
    'no_experience',
    'under_1_year',
    '1_2_years',
    '3_5_years',
    'over_5_years',
  ],
  CERTIFICATE_REQUIREMENT: ['not_required', 'nice_to_have', 'preferred', 'required'],
  TUTOR_GOAL_TAGS: [
    'certificate',
    'fluent_communication',
    'real_project',
    'expert_knowledge',
    'improve_grades',
    'master_tools',
    'personal_skills',
    'other',
  ],
  TUTOR_DURATION_RANGES: [
    'under_1_month',
    '1_3_months',
    '3_6_months',
    '6_12_months',
    'over_1_year',
    'flexible',
  ],
};

module.exports = {
  COMPLETION_STATUS,
  ALL_COMPLETION_STATUSES,
  APPROVAL_STATUS,
  ALL_APPROVAL_STATUSES,
  LEARNER_BUDGET_RANGES,
  TUTOR_PRICE_RANGES,
  ENUMS,
};
