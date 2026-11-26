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
    'tieng-trung': [
      { name: 'Tiếng Trung giao tiếp', slug: 'tieng-trung-giao-tiep' },
      { name: 'Luyện thi HSK 1–6', slug: 'luyen-thi-hsk' },
      { name: 'Phát âm & Pinyin căn bản', slug: 'pinyin-can-ban' },
      { name: 'Chữ Hán & Đọc viết', slug: 'chu-han-doc-viet' },
      { name: 'Tiếng Trung thương mại', slug: 'tieng-trung-thuong-mai' },
    ],
    'tieng-han': [
      { name: 'Tiếng Hàn giao tiếp', slug: 'tieng-han-giao-tiep' },
      { name: 'Luyện thi TOPIK', slug: 'luyen-thi-topik' },
      { name: 'Bảng chữ cái Hangul & Sơ cấp', slug: 'hangul-so-cap' },
      { name: 'Tiếng Hàn công sở / Du học', slug: 'tieng-han-du-hoc' },
    ],
    'tieng-nhat': [
      { name: 'Tiếng Nhật giao tiếp', slug: 'tieng-nhat-giao-tiep' },
      { name: 'Luyện thi JLPT (N5–N1)', slug: 'luyen-thi-jlpt' },
      { name: 'Hiragana, Katakana & Kanji', slug: 'kanji-co-ban' },
      { name: 'Tiếng Nhật thương mại (Keigo)', slug: 'tieng-nhat-thuong-mai' },
    ],
    'tieng-phap': [
      { name: 'Tiếng Pháp giao tiếp', slug: 'tieng-phap-giao-tiep' },
      { name: 'Luyện thi DELF / DALF', slug: 'luyen-thi-delf-dalf' },
      { name: 'Ngữ pháp & Phát âm tiếng Pháp', slug: 'ngu-phap-tieng-phap' },
    ],
    'tieng-duc': [
      { name: 'Tiếng Đức giao tiếp (A1–B2)', slug: 'tieng-duc-giao-tiep' },
      { name: 'Luyện thi Goethe / TestDaF', slug: 'luyen-thi-goethe' },
      { name: 'Tiếng Đức du học nghề', slug: 'tieng-duc-du-hoc' },
    ],
    'tieng-nga': [
      { name: 'Tiếng Nga cơ bản & Phát âm', slug: 'tieng-nga-co-ban' },
      { name: 'Tiếng Nga giao tiếp', slug: 'tieng-nga-giao-tiep' },
      { name: 'Luyện thi TRKI', slug: 'luyen-thi-trki' },
    ],
    'tieng-tay-ban-nha': [
      { name: 'Tiếng Tây Ban Nha giao tiếp', slug: 'tieng-tbn-giao-tiep' },
      { name: 'Luyện thi DELE', slug: 'luyen-thi-dele' },
      { name: 'Ngữ pháp tiếng Tây Ban Nha', slug: 'ngu-phap-tieng-tbn' },
    ],
    'toan-hoc': [
      { name: 'Toán Tiểu học & THCS', slug: 'toan-thcs' },
      { name: 'Toán THPT & Ôn thi Đại học', slug: 'toan-thpt-dai-hoc' },
      { name: 'Đại số & Giải tích', slug: 'dai-so-giai-tich' },
      { name: 'Hình học phẳng & Không gian', slug: 'hinh-hoc' },
      { name: 'Toán cao cấp (Giải tích, Đại số tuyến tính)', slug: 'toan-cao-cap' },
      { name: 'Xác suất & Thống kê', slug: 'xac-suat-thong-ke' },
    ],
    'vat-ly': [
      { name: 'Vật lý THCS', slug: 'vat-ly-thcs' },
      { name: 'Vật lý THPT & Luyện thi Đại học', slug: 'vat-ly-thpt' },
      { name: 'Cơ học & Nhiệt học', slug: 'co-hoc-nhiet-hoc' },
      { name: 'Điện học & Quang học', slug: 'dien-hoc-quang-hoc' },
    ],
    'hoa-hoc': [
      { name: 'Hóa học THCS', slug: 'hoa-hoc-thcs' },
      { name: 'Hóa học THPT & Luyện thi Đại học', slug: 'hoa-hoc-thpt' },
      { name: 'Hóa vô cơ', slug: 'hoa-vo-co' },
      { name: 'Hóa hữu cơ', slug: 'hoa-huu-co' },
    ],
    'sinh-hoc': [
      { name: 'Sinh học THCS & THPT', slug: 'sinh-hoc-pho-thong' },
      { name: 'Di truyền học & Tiến hóa', slug: 'di-truyen-tien-hoa' },
      { name: 'Luyện thi THPT Quốc gia môn Sinh', slug: 'luyen-thi-sinh' },
    ],
    'ngu-van': [
      { name: 'Đọc hiểu & Làm văn THCS', slug: 'ngu-van-thcs' },
      { name: 'Nghị luận văn học & Nghị luận xã hội', slug: 'nghi-luan-van-hoc' },
      { name: 'Ôn thi vào 10 & THPT Quốc gia', slug: 'on-thi-ngu-van' },
    ],
    'lich-su': [
      { name: 'Lịch sử Việt Nam', slug: 'lich-su-viet-nam' },
      { name: 'Lịch sử Thế giới', slug: 'lich-su-the-gioi' },
      { name: 'Ôn thi THPT Quốc gia môn Sử', slug: 'on-thi-lich-su' },
    ],
    'dia-ly': [
      { name: 'Địa lý tự nhiên & Kinh tế xã hội', slug: 'dia-ly-tu-nhien-kt' },
      { name: 'Kỹ năng đọc Atlat & Biểu đồ', slug: 'ky-nang-atlat-bieu-do' },
      { name: 'Ôn thi THPT Quốc gia môn Địa', slug: 'on-thi-dia-ly' },
    ],
    'lap-trinh': [
      { name: 'Frontend (HTML, CSS, JS, React)', slug: 'frontend-react' },
      { name: 'Backend (Node.js, Express, MongoDB)', slug: 'backend-nodejs' },
      { name: 'Full-stack Development', slug: 'full-stack-dev' },
      { name: 'Lập trình Python từ đầu', slug: 'python-co-ban' },
      { name: 'Java Core & OOP', slug: 'java-core-oop' },
      { name: 'C/C++ & Cấu trúc dữ liệu giải thuật', slug: 'c-cpp-giai-thuat' },
    ],
    'web-development': [
      { name: 'HTML5, CSS3 & TailwindCSS', slug: 'html-css-tailwind' },
      { name: 'JavaScript / TypeScript & React', slug: 'js-ts-react' },
      { name: 'Node.js, REST API & Authentication', slug: 'nodejs-rest-api' },
      { name: 'Next.js & Triển khai Web', slug: 'nextjs-deploy' },
    ],
    'mobile-development': [
      { name: 'React Native đa nền tảng', slug: 'react-native' },
      { name: 'Flutter & Dart', slug: 'flutter-dart' },
      { name: 'Android (Kotlin / Java)', slug: 'android-kotlin' },
      { name: 'iOS (Swift)', slug: 'ios-swift' },
    ],
    database: [
      { name: 'SQL (MySQL, PostgreSQL, SQL Server)', slug: 'sql-relational' },
      { name: 'NoSQL (MongoDB, Redis)', slug: 'nosql-mongodb' },
      { name: 'Thiết kế CSDL & Tối ưu truy vấn', slug: 'db-design-tuning' },
    ],
    'ui-ux-design': [
      { name: 'Figma từ cơ bản đến nâng cao', slug: 'figma-ui-ux' },
      { name: 'Wireframe, Prototype & Design System', slug: 'wireframe-design-system' },
      { name: 'Nghiên cứu trải nghiệm người dùng (UX Research)', slug: 'ux-research' },
    ],
    'data-analysis': [
      { name: 'Python cho phân tích dữ liệu (Pandas, NumPy)', slug: 'python-data-analysis' },
      { name: 'SQL & Trực quan hóa (Power BI, Tableau)', slug: 'bi-visualization' },
      { name: 'Thống kê ứng dụng & Làm sạch dữ liệu', slug: 'applied-statistics' },
    ],
    'ai-machine-learning': [
      { name: 'Machine Learning cơ bản (Scikit-learn)', slug: 'machine-learning-basics' },
      { name: 'Deep Learning & Neural Networks', slug: 'deep-learning' },
      { name: 'NLP & Ứng dụng LLM / Prompt Engineering', slug: 'nlp-llm' },
    ],
    've-hoi-hoa': [
      { name: 'Hình họa chì & Bố cục căn bản', slug: 'hinh-hoa-chi' },
      { name: 'Màu nước & Acrylic', slug: 'mau-nuoc-acrylic' },
      { name: 'Luyện thi khối V, H (Mỹ thuật)', slug: 'luyen-thi-khoi-vh' },
    ],
    'graphic-design': [
      { name: 'Nguyên lý thiết kế & Typography', slug: 'typography-layout' },
      { name: 'Nhận diện thương hiệu (Branding)', slug: 'branding-design' },
      { name: 'Thiết kế ấn phẩm truyền thông', slug: 'media-publication' },
    ],
    photography: [
      { name: 'Làm chủ máy ảnh & Ánh sáng', slug: 'camera-lighting' },
      { name: 'Chụp chân dung & Sản phẩm', slug: 'portrait-product-photo' },
      { name: 'Hậu kỳ ảnh với Lightroom', slug: 'lightroom-retouch' },
    ],
    'video-editing': [
      { name: 'Dựng phim với Premiere Pro / CapCut', slug: 'premiere-capcut' },
      { name: 'Motion Graphics với After Effects', slug: 'after-effects' },
      { name: 'Chỉnh màu & Âm thanh video', slug: 'color-grading-audio' },
    ],
    photoshop: [
      { name: 'Chỉnh sửa ảnh căn bản', slug: 'chinh-sua-anh-can-ban' },
      { name: 'Retouching chân dung', slug: 'retouching-chan-dung' },
      { name: 'Thiết kế Poster & Banner', slug: 'thiet-ke-poster-banner' },
      { name: 'Photo Manipulation', slug: 'photo-manipulation' },
      { name: 'Social Media Design', slug: 'social-media-design' },
    ],
    illustrator: [
      { name: 'Vẽ Vector & Pen Tool căn bản', slug: 'vector-pen-tool' },
      { name: 'Thiết kế Logo & Icon', slug: 'logo-icon-design' },
      { name: 'Minh họa nhân vật & Bao bì', slug: 'illustration-packaging' },
    ],
    'am-nhac': [
      { name: 'Nhạc lý & Xướng âm cơ bản', slug: 'nhac-ly-co-ban' },
      { name: 'Thanh nhạc & Luyện giọng', slug: 'thanh-nhac' },
      { name: 'Hòa âm & Sáng tác', slug: 'hoa-am-sang-tac' },
    ],
    marketing: [
      { name: 'Digital Marketing tổng quan', slug: 'digital-marketing' },
      { name: 'Content Marketing & Copywriting', slug: 'content-marketing' },
      { name: 'Facebook Ads, Google Ads & SEO', slug: 'performance-seo' },
    ],
    'tai-chinh': [
      { name: 'Quản trị tài chính cá nhân', slug: 'tai-chinh-ca-nhan' },
      { name: 'Tài chính doanh nghiệp', slug: 'tai-chinh-doanh-nghiep' },
      { name: 'Phân tích đầu tư cơ bản', slug: 'phan-tich-dau-tu' },
    ],
    'ke-toan': [
      { name: 'Nguyên lý kế toán', slug: 'nguyen-ly-ke-toan' },
      { name: 'Kế toán doanh nghiệp & Báo cáo tài chính', slug: 'ke-toan-doanh-nghiep' },
      { name: 'Kế toán thuế thực hành', slug: 'ke-toan-thue' },
    ],
    'microsoft-excel': [
      { name: 'Excel văn phòng cơ bản & Hàm thông dụng', slug: 'excel-van-phong' },
      { name: 'PivotTable, Dashboard & Phân tích dữ liệu', slug: 'excel-pivot-dashboard' },
      { name: 'Excel VBA & Tự động hóa', slug: 'excel-vba' },
    ],
    powerpoint: [
      { name: 'Thiết kế slide chuyên nghiệp', slug: 'powerpoint-design' },
      { name: 'Animation & Infographic thuyết trình', slug: 'powerpoint-animation' },
    ],
    'thuyet-trinh': [
      { name: 'Cấu trúc bài thuyết trình thuyết phục', slug: 'cau-truc-thuyet-trinh' },
      { name: 'Ngôn ngữ cơ thể & Xử lý câu hỏi', slug: 'ngon-ngu-co-the-qa' },
    ],
    'ky-nang-phong-van': [
      { name: 'Viết CV & Hồ sơ ứng tuyển ấn tượng', slug: 'viet-cv-ung-tuyen' },
      { name: 'Phỏng vấn thử (Mock Interview) & Trả lời tình huống', slug: 'mock-interview' },
    ],
    'giao-tiep-ung-xu': [
      { name: 'Giao tiếp tự tin nơi công sở', slug: 'giao-tiep-cong-so' },
      { name: 'Lắng nghe chủ động & Xử lý mâu thuẫn', slug: 'lang-nghe-xu-ly-mau-thuan' },
    ],
    'quan-ly-thoi-gian': [
      { name: 'Lập kế hoạch mục tiêu & Sắp xếp ưu tiên', slug: 'lap-ke-hoach-uu-tien' },
      { name: 'Phương pháp tập trung & Chống trì hoãn', slug: 'chong-tri-hoan' },
    ],
    'ky-nang-tu-hoc': [
      { name: 'Phương pháp ghi chú & Ghi nhớ hiệu quả', slug: 'ghi-chu-ghi-nho' },
      { name: 'Tự học qua tài liệu & Tư duy phản biện', slug: 'tu-duy-phan-bien' },
    ],
    'public-speaking': [
      { name: 'Vượt qua nỗi sợ đám đông', slug: 'vuot-qua-so-dam-dong' },
      { name: 'Làm chủ giọng nói & Kể chuyện (Storytelling)', slug: 'storytelling-voice' },
    ],
    yoga: [
      { name: 'Yoga cơ bản cho người mới bắt đầu', slug: 'yoga-co-ban' },
      { name: 'Yoga giãn cơ & Trị liệu cột sống', slug: 'yoga-tri-lieu' },
      { name: 'Hít thở & Thiền định giảm căng thẳng', slug: 'yoga-thien-dinh' },
    ],
    fitness: [
      { name: 'Giảm mỡ & Tăng cơ tại nhà', slug: 'giam-mo-tang-co' },
      { name: 'Tập luyện với tạ & Kỹ thuật chuẩn', slug: 'tap-ta-ky-thuat' },
      { name: 'Xây dựng thực đơn dinh dưỡng cá nhân', slug: 'dinh-duong-the-hinh' },
    ],
    guitar: [
      { name: 'Guitar đệm hát cơ bản', slug: 'guitar-dem-hat' },
      { name: 'Fingerstyle & Đọc Tab', slug: 'guitar-fingerstyle' },
      { name: 'Cảm âm & Chuyển hợp âm nâng cao', slug: 'guitar-cam-am' },
    ],
    piano: [
      { name: 'Piano cơ bản & Đọc sheet nhạc', slug: 'piano-co-ban' },
      { name: 'Piano đệm hát & Cover', slug: 'piano-dem-hat' },
      { name: 'Piano cổ điển', slug: 'piano-co-dien' },
    ],
    'nau-an': [
      { name: 'Nấu ăn gia đình cơ bản', slug: 'nau-an-gia-dinh' },
      { name: 'Món ăn Healthy / Eat Clean', slug: 'eat-clean-healthy' },
      { name: 'Làm bánh cơ bản', slug: 'lam-banh-co-ban' },
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
