/**
 * Comprehensive Taxonomy Types used across Learner and Tutor onboarding,
 * matching, and filtering.
 */
const TAXONOMY_TYPES = {
  CATEGORY: 'category', // Lĩnh vực (cấp 1)
  SUBJECT: 'subject', // Môn học / nội dung (cấp 2, parent là category)
  TOPIC: 'topic', // Chuyên môn sâu (cấp 3, parent là subject)
  LEVEL: 'level', // Cấp độ (Beginner, Basic, Intermediate, etc.)
  LEARNING_PURPOSE: 'learning_purpose', // Mục đích học / Mục tiêu hỗ trợ
  TEACHING_METHOD: 'teaching_method', // Phương pháp giảng dạy
  TEACHING_STYLE: 'teaching_style', // Phong cách gia sư
  LEARNING_MATERIAL: 'learning_material', // Tài liệu / Công cụ học tập
  INTERACTION_LEVEL: 'interaction_level', // Mức độ tương tác
  TIME_BAND: 'time_band', // Khung giờ trong ngày (Sáng, Trưa, Chiều, Tối, Khuya)
  LEARNING_MODE: 'learning_mode', // Hình thức học (Online, Offline, Kết hợp)
  OFFLINE_LOCATION: 'offline_location', // Địa điểm Offline
  SUPPORT_TYPE: 'support_type', // Hoạt động hỗ trợ
  LEARNING_DIFFICULTY: 'learning_difficulty', // Khó khăn của học viên
  SUPPORT_APPROACH: 'support_approach', // Cách gia sư xử lý khó khăn
  PROGRESS_TRACKING: 'progress_tracking', // Đánh giá / theo dõi tiến độ
  SELECTION_PRIORITY: 'selection_priority', // Tiêu chí ưu tiên khi chọn gia sư
  CERTIFICATE_TYPE: 'certificate_type', // Loại văn bằng / chứng chỉ
  TAG: 'tag', // Tag dùng chung
};

const ALL_TAXONOMY_TYPES = Object.values(TAXONOMY_TYPES);

module.exports = {
  TAXONOMY_TYPES,
  ALL_TAXONOMY_TYPES,
};
