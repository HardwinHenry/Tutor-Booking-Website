const Taxonomy = require('../models/taxonomy.model');
const { TAXONOMY_TYPES } = require('../constants/taxonomyTypes');
const { slugify } = require('../utils/slug.util');

/**
 * Seed data definition for Taxonomies
 */
const seedData = {
  // 1. Categories (Level 1)
  categories: [
    { name: 'Ngoại ngữ', slug: 'ngoai-ngu', description: 'Các ngôn ngữ phổ biến trên thế giới' },
    { name: 'Học thuật', slug: 'hoc-thuat', description: 'Các môn học phổ thông và học thuật' },
    {
      name: 'Công nghệ',
      slug: 'cong-nghe',
      description: 'Công nghệ thông tin, lập trình và dữ liệu',
    },
    {
      name: 'Nghệ thuật & sáng tạo',
      slug: 'nghe-thuat-sang-tao',
      description: 'Thiết kế, vẽ, âm nhạc, đồ họa',
    },
    {
      name: 'Kinh doanh & nghề nghiệp',
      slug: 'kinh-doanh-nghe-nghiep',
      description: 'Marketing, tài chính, kỹ năng công sở',
    },
    {
      name: 'Kỹ năng cá nhân',
      slug: 'ky-nang-ca-nhan',
      description: 'Giao tiếp, quản lý thời gian, thuyết trình',
    },
    {
      name: 'Thể thao & kỹ năng khác',
      slug: 'the-thao-ky-nang-khac',
      description: 'Thể chất, nhạc cụ và kỹ năng sống',
    },
  ],

  // 2. Subjects mapping by category slug (Level 2)
  subjects: {
    'ngoai-ngu': [
      { name: 'Tiếng Anh', slug: 'tieng-anh' },
      { name: 'Tiếng Trung', slug: 'tieng-trung' },
      { name: 'Tiếng Hàn', slug: 'tieng-han' },
      { name: 'Tiếng Nhật', slug: 'tieng-nhat' },
      { name: 'Tiếng Pháp', slug: 'tieng-phap' },
      { name: 'Tiếng Đức', slug: 'tieng-duc' },
      { name: 'Tiếng Nga', slug: 'tieng-nga' },
      { name: 'Tiếng Tây Ban Nha', slug: 'tieng-tay-ban-nha' },
    ],
    'hoc-thuat': [
      { name: 'Toán học', slug: 'toan-hoc' },
      { name: 'Vật lý', slug: 'vat-ly' },
      { name: 'Hóa học', slug: 'hoa-hoc' },
      { name: 'Sinh học', slug: 'sinh-hoc' },
      { name: 'Ngữ văn', slug: 'ngu-van' },
      { name: 'Lịch sử', slug: 'lich-su' },
      { name: 'Địa lý', slug: 'dia-ly' },
    ],
    'cong-nghe': [
      { name: 'Lập trình', slug: 'lap-trinh' },
      { name: 'Web Development', slug: 'web-development' },
      { name: 'Mobile Development', slug: 'mobile-development' },
      { name: 'Database', slug: 'database' },
      { name: 'UI/UX Design', slug: 'ui-ux-design' },
      { name: 'Data Analysis', slug: 'data-analysis' },
      { name: 'AI / Machine Learning', slug: 'ai-machine-learning' },
    ],
    'nghe-thuat-sang-tao': [
      { name: 'Vẽ hội họa', slug: 've-hoi-hoa' },
      { name: 'Graphic Design', slug: 'graphic-design' },
      { name: 'Photography', slug: 'photography' },
      { name: 'Video Editing', slug: 'video-editing' },
      { name: 'Photoshop', slug: 'photoshop' },
      { name: 'Illustrator', slug: 'illustrator' },
      { name: 'Âm nhạc', slug: 'am-nhac' },
    ],
    'kinh-doanh-nghe-nghiep': [
      { name: 'Marketing', slug: 'marketing' },
      { name: 'Tài chính', slug: 'tai-chinh' },
      { name: 'Kế toán', slug: 'ke-toan' },
      { name: 'Microsoft Excel', slug: 'microsoft-excel' },
      { name: 'PowerPoint', slug: 'powerpoint' },
      { name: 'Thuyết trình', slug: 'thuyet-trinh' },
      { name: 'Kỹ năng phỏng vấn', slug: 'ky-nang-phong-van' },
    ],
    'ky-nang-ca-nhan': [
      { name: 'Giao tiếp ứng xử', slug: 'giao-tiep-ung-xu' },
      { name: 'Quản lý thời gian', slug: 'quan-ly-thoi-gian' },
      { name: 'Kỹ năng tự học', slug: 'ky-nang-tu-hoc' },
      { name: 'Public Speaking', slug: 'public-speaking' },
    ],
    'the-thao-ky-nang-khac': [
      { name: 'Yoga', slug: 'yoga' },
      { name: 'Fitness', slug: 'fitness' },
      { name: 'Guitar', slug: 'guitar' },
      { name: 'Piano', slug: 'piano' },
      { name: 'Nấu ăn', slug: 'nau-an' },
    ],
  },

  // 3. Topics mapping by subject slug (Level 3)
  topics: {
    'tieng-anh': [
      { name: 'Tiếng Anh giao tiếp', slug: 'tieng-anh-giao-tiep' },
      { name: 'Luyện thi IELTS', slug: 'luyen-thi-ielts' },
      { name: 'Luyện thi TOEIC', slug: 'luyen-thi-toeic' },
      { name: 'Luyện thi TOEFL', slug: 'luyen-thi-toefl' },
      { name: 'Phát âm chuẩn (Pronunciation)', slug: 'phat-am-chuan' },
      { name: 'Ngữ pháp cơ bản đến nâng cao', slug: 'ngu-phap-tieng-anh' },
      { name: 'Từ vựng & Đọc hiểu', slug: 'tu-vung-doc-hieu' },
      { name: 'Writing (Viết luận)', slug: 'writing-viet-luan' },
      { name: 'Speaking (Nói tự tin)', slug: 'speaking-noi-tu-tin' },
      { name: 'Business English (Tiếng Anh công sở)', slug: 'business-english' },
    ],
    'lap-trinh': [
      { name: 'Frontend (HTML, CSS, JS, React)', slug: 'frontend-react' },
      { name: 'Backend (Node.js, Express, MongoDB)', slug: 'backend-nodejs' },
      { name: 'Full-stack Development', slug: 'full-stack-dev' },
      { name: 'Lập trình Python từ đầu', slug: 'python-co-ban' },
      { name: 'Java Core & OOP', slug: 'java-core-oop' },
      { name: 'C/C++ & Cấu trúc dữ liệu giải thuật', slug: 'c-cpp-giai-thuat' },
    ],
    photoshop: [
      { name: 'Chỉnh sửa ảnh căn bản', slug: 'chinh-sua-anh-can-ban' },
      { name: 'Retouching chân dung', slug: 'retouching-chan-dung' },
      { name: 'Thiết kế Poster & Banner', slug: 'thiet-ke-poster-banner' },
      { name: 'Photo Manipulation', slug: 'photo-manipulation' },
      { name: 'Social Media Design', slug: 'social-media-design' },
    ],
  },

  // 4. Standalone taxonomies
  levels: [
    { name: 'Chưa có kiến thức (Beginner)', slug: 'beginner', sortOrder: 1 },
    { name: 'Cơ bản (Basic)', slug: 'basic', sortOrder: 2 },
    { name: 'Trung cấp (Intermediate)', slug: 'intermediate', sortOrder: 3 },
    { name: 'Khá (Upper-intermediate)', slug: 'upper-intermediate', sortOrder: 4 },
    { name: 'Nâng cao (Advanced)', slug: 'advanced', sortOrder: 5 },
    { name: 'Chuyên sâu (Expert)', slug: 'expert', sortOrder: 6 },
  ],

  purposes: [
    { name: 'Học từ đầu', slug: 'from-scratch' },
    { name: 'Củng cố & cải thiện kiến thức', slug: 'improve-knowledge' },
    { name: 'Nâng cao kỹ năng', slug: 'enhance-skills' },
    { name: 'Luyện thi chứng chỉ', slug: 'certificate-prep' },
    { name: 'Phục vụ học tập tại trường', slug: 'academic-support' },
    { name: 'Phục vụ công việc', slug: 'career-work' },
    { name: 'Chuyển ngành', slug: 'career-change' },
    { name: 'Sở thích cá nhân', slug: 'hobby' },
  ],

  teachingMethods: [
    { name: 'Giảng dạy lý thuyết', slug: 'theory' },
    { name: 'Hướng dẫn thực hành', slug: 'practice' },
    { name: 'Kết hợp lý thuyết và thực hành', slug: 'theory-practice' },
    { name: 'Học qua dự án (Project-based Learning)', slug: 'project-based' },
    { name: 'Học qua giải bài tập', slug: 'exercises' },
    { name: 'Thảo luận & phản biện', slug: 'discussion' },
    { name: 'Học qua tình huống thực tế (Case study)', slug: 'case-study' },
  ],

  teachingStyles: [
    { name: 'Kiên nhẫn, tận tình', slug: 'patient' },
    { name: 'Thân thiện, gần gũi', slug: 'friendly' },
    { name: 'Nghiêm túc, kỷ luật', slug: 'disciplined' },
    { name: 'Năng động, sáng tạo', slug: 'creative' },
    { name: 'Vui vẻ, hài hước', slug: 'humorous' },
    { name: 'Tương tác thường xuyên', slug: 'interactive' },
    { name: 'Linh hoạt, thích nghi tốt', slug: 'flexible' },
    { name: 'Định hướng & truyền cảm hứng', slug: 'inspirational' },
  ],

  learningMaterials: [
    { name: 'Slide bài giảng', slug: 'slides' },
    { name: 'Tài liệu PDF', slug: 'pdf' },
    { name: 'Sách giáo trình', slug: 'textbook' },
    { name: 'Video minh họa', slug: 'video' },
    { name: 'Bài tập thực hành', slug: 'exercises' },
    { name: 'Quiz và trò chơi', slug: 'quiz-games' },
    { name: 'Phần mềm / công cụ chuyên ngành', slug: 'specialized-tools' },
    { name: 'Dự án thực tế', slug: 'real-projects' },
    { name: 'Tự biên soạn tài liệu', slug: 'custom-materials' },
  ],

  interactionLevels: [
    { name: 'Chủ yếu nghe giảng', slug: 'mostly-lecture' },
    { name: 'Thường xuyên hỏi đáp', slug: 'frequent-qa' },
    { name: 'Tương tác hai chiều liên tục', slug: 'continuous-two-way' },
    { name: 'Thực hành và thảo luận nhóm liên tục', slug: 'continuous-practice-discussion' },
  ],

  timeBands: [
    { name: 'Sáng (6h–11h)', slug: 'morning' },
    { name: 'Trưa (11h–13h)', slug: 'noon' },
    { name: 'Chiều (13h–17h)', slug: 'afternoon' },
    { name: 'Tối (17h–21h)', slug: 'evening' },
    { name: 'Khuya (Sau 21h)', slug: 'night' },
  ],

  learningModes: [
    { name: 'Online (Học trực tuyến)', slug: 'online' },
    { name: 'Offline (Gặp trực tiếp)', slug: 'offline' },
    { name: 'Kết hợp (Online & Offline)', slug: 'hybrid' },
  ],

  offlineLocations: [
    { name: 'Tại nhà gia sư', slug: 'tutor-home' },
    { name: 'Tại nhà học viên', slug: 'learner-home' },
    { name: 'Quán cà phê', slug: 'coffee-shop' },
    { name: 'Trung tâm học tập', slug: 'learning-center' },
    { name: 'Địa điểm công cộng phù hợp', slug: 'public-space' },
    { name: 'Địa điểm khác', slug: 'other-location' },
  ],

  supportTypes: [
    { name: 'Giải thích kiến thức', slug: 'explain-concepts' },
    { name: 'Chữa bài tập chi tiết', slug: 'correct-homework' },
    { name: 'Luyện tập thực hành', slug: 'practice-drills' },
    { name: 'Ôn tập và luyện thi', slug: 'exam-prep' },
    { name: 'Xây dựng kế hoạch học tập', slug: 'study-plan' },
    { name: 'Theo dõi tiến độ', slug: 'track-progress' },
    { name: 'Hướng dẫn làm dự án', slug: 'project-guidance' },
    { name: 'Định hướng học tập & nghề nghiệp', slug: 'career-orientation' },
  ],

  learningDifficulties: [
    { name: 'Không hiểu lý thuyết', slug: 'theory-confusion' },
    { name: 'Không biết áp dụng vào bài tập', slug: 'cannot-apply' },
    { name: 'Khó ghi nhớ kiến thức', slug: 'hard-to-remember' },
    { name: 'Khó tập trung khi học', slug: 'low-focus' },
    { name: 'Thiếu động lực học tập', slug: 'lack-motivation' },
    { name: 'Không biết bắt đầu từ đâu', slug: 'dont-know-where-to-start' },
    { name: 'Không có người hướng dẫn sát sao', slug: 'no-mentor' },
  ],

  supportApproaches: [
    { name: 'Giải thích lại theo cách đơn giản hơn', slug: 'simplify-explanation' },
    { name: 'Chia nhỏ nội dung thành từng phần', slug: 'break-down-content' },
    { name: 'Đưa ra ví dụ minh họa thực tế', slug: 'real-world-examples' },
    { name: 'Tăng cường bài tập thực hành', slug: 'increase-practice' },
    { name: 'Điều chỉnh phương pháp giảng dạy', slug: 'adapt-method' },
    { name: 'Động viên và tạo động lực học tập', slug: 'encourage-motivate' },
  ],

  progressTracking: [
    { name: 'Sau mỗi buổi học', slug: 'after-each-session' },
    { name: 'Hàng tuần', slug: 'weekly' },
    { name: 'Hàng tháng', slug: 'monthly' },
    { name: 'Sau mỗi chủ đề / chương', slug: 'after-each-topic' },
    { name: 'Theo dõi kết quả thực hành / dự án', slug: 'by-project' },
    { name: 'Không cần đánh giá định kỳ', slug: 'no-tracking' },
  ],

  selectionPriorities: [
    { name: 'Chuyên môn sâu', slug: 'expertise' },
    { name: 'Kinh nghiệm giảng dạy', slug: 'experience' },
    { name: 'Học phí phù hợp', slug: 'price' },
    { name: 'Đánh giá & uy tín', slug: 'rating' },
    { name: 'Phong cách giảng dạy', slug: 'teaching-style' },
    { name: 'Lịch học linh hoạt', slug: 'flexible-schedule' },
    { name: 'Khoảng cách gần', slug: 'distance' },
    { name: 'Bằng cấp / chứng chỉ', slug: 'qualification' },
  ],

  certificateTypes: [
    { name: 'Chứng chỉ chuyên môn', slug: 'professional-cert' },
    { name: 'Bằng cao đẳng', slug: 'associate-degree' },
    { name: 'Bằng đại học', slug: 'bachelor-degree' },
    { name: 'Bằng thạc sĩ', slug: 'master-degree' },
    { name: 'Bằng tiến sĩ', slug: 'doctorate-degree' },
    { name: 'Chứng chỉ quốc tế', slug: 'international-cert' },
    { name: 'Văn bằng khác', slug: 'other-cert' },
  ],
};

/**
 * Seed taxonomies into MongoDB idempotently
 */
const seedTaxonomies = async () => {
  // Helper upsert
  const upsertTaxonomy = async (data) => {
    return Taxonomy.findOneAndUpdate(
      { type: data.type, slug: data.slug, parentId: data.parentId || null },
      { $set: data },
      { upsert: true, returnDocument: 'after' }
    );
  };

  // 1. Seed Categories
  const categoryMap = {};
  for (const item of seedData.categories) {
    const doc = await upsertTaxonomy({
      name: item.name,
      slug: item.slug,
      type: TAXONOMY_TYPES.CATEGORY,
      parentId: null,
      description: item.description || '',
      active: true,
    });
    categoryMap[item.slug] = doc._id;
  }

  // 2. Seed Subjects
  const subjectMap = {};
  for (const [catSlug, subjects] of Object.entries(seedData.subjects)) {
    const parentId = categoryMap[catSlug];
    if (!parentId) continue;

    for (const sub of subjects) {
      const doc = await upsertTaxonomy({
        name: sub.name,
        slug: sub.slug,
        type: TAXONOMY_TYPES.SUBJECT,
        parentId,
        active: true,
      });
      subjectMap[sub.slug] = doc._id;
    }
  }

  // 3. Seed Topics
  for (const [subSlug, topics] of Object.entries(seedData.topics)) {
    const parentId = subjectMap[subSlug];
    if (!parentId) continue;

    for (const top of topics) {
      await upsertTaxonomy({
        name: top.name,
        slug: top.slug,
        type: TAXONOMY_TYPES.TOPIC,
        parentId,
        active: true,
      });
    }
  }

  // 4. Seed Standalone taxonomies
  const seedSimpleType = async (items, type) => {
    for (const item of items) {
      await upsertTaxonomy({
        name: item.name,
        slug: item.slug || slugify(item.name),
        type,
        parentId: null,
        sortOrder: item.sortOrder || 0,
        active: true,
      });
    }
  };

  await seedSimpleType(seedData.levels, TAXONOMY_TYPES.LEVEL);
  await seedSimpleType(seedData.purposes, TAXONOMY_TYPES.LEARNING_PURPOSE);
  await seedSimpleType(seedData.teachingMethods, TAXONOMY_TYPES.TEACHING_METHOD);
  await seedSimpleType(seedData.teachingStyles, TAXONOMY_TYPES.TEACHING_STYLE);
  await seedSimpleType(seedData.learningMaterials, TAXONOMY_TYPES.LEARNING_MATERIAL);
  await seedSimpleType(seedData.interactionLevels, TAXONOMY_TYPES.INTERACTION_LEVEL);
  await seedSimpleType(seedData.timeBands, TAXONOMY_TYPES.TIME_BAND);
  await seedSimpleType(seedData.learningModes, TAXONOMY_TYPES.LEARNING_MODE);
  await seedSimpleType(seedData.offlineLocations, TAXONOMY_TYPES.OFFLINE_LOCATION);
  await seedSimpleType(seedData.supportTypes, TAXONOMY_TYPES.SUPPORT_TYPE);
  await seedSimpleType(seedData.learningDifficulties, TAXONOMY_TYPES.LEARNING_DIFFICULTY);
  await seedSimpleType(seedData.supportApproaches, TAXONOMY_TYPES.SUPPORT_APPROACH);
  await seedSimpleType(seedData.progressTracking, TAXONOMY_TYPES.PROGRESS_TRACKING);
  await seedSimpleType(seedData.selectionPriorities, TAXONOMY_TYPES.SELECTION_PRIORITY);
  await seedSimpleType(seedData.certificateTypes, TAXONOMY_TYPES.CERTIFICATE_TYPE);

  return { success: true, message: 'Taxonomies seeded successfully' };
};

module.exports = {
  seedData,
  seedTaxonomies,
};
