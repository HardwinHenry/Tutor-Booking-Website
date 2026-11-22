/**
 * Recommendation Engine Configuration & Constants (Phase 6)
 * Content-based Filtering (CBF)
 */

const ALGORITHM_VERSION = 'cbf-v1';

/**
 * Weight distribution per revised roadmap:
 * MatchScore = 0.30S + 0.20L + 0.15B + 0.10M + 0.10T + 0.05A + 0.05E + 0.05R
 */
const RECOMMENDATION_WEIGHTS = {
  SUBJECT: 0.3, // S - Môn học & Chuyên môn (30%)
  LEVEL_GOAL: 0.2, // L - Trình độ & Mục tiêu (20%)
  BUDGET: 0.15, // B - Ngân sách & Học phí (15%)
  MODE_LOCATION: 0.1, // M - Hình thức & Địa điểm (10%)
  TEACHING_FIT: 0.1, // T - Phương pháp, Phong cách & Hỗ trợ (10%)
  AVAILABILITY: 0.05, // A - Tương thích lịch tổng quát (5%)
  EXPERIENCE_QUALIFICATION: 0.05, // E - Kinh nghiệm & Chứng chỉ không bắt buộc (5%)
  RATING: 0.05, // R - Đánh giá từ học viên (5%)
};

/**
 * Neutral prior rating for tutors who do not have any reviews yet.
 * 75/100 corresponds to 3.75/5.0, preventing penalization of new tutors while avoiding inflation.
 */
const NEUTRAL_RATING_SCORE = 75;

/**
 * Minimum score threshold to consider a match acceptable
 */
const DEFAULT_MIN_SCORE = 30;

module.exports = {
  ALGORITHM_VERSION,
  RECOMMENDATION_WEIGHTS,
  NEUTRAL_RATING_SCORE,
  DEFAULT_MIN_SCORE,
};
