const request = require('supertest');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/user.model');
const Taxonomy = require('../src/models/taxonomy.model');
const TutorProfile = require('../src/models/tutorProfile.model');
const { ROLES } = require('../src/constants/roles');
const { USER_STATUS } = require('../src/constants/userStatus');
const { COMPLETION_STATUS, APPROVAL_STATUS } = require('../src/constants/profileStatus');
const { seedTaxonomies } = require('../src/seeds/taxonomy.seed');

describe('Phase 5: Tutor Search & Admin Approval Module', () => {
  let adminToken = '';
  let learnerToken = '';
  let tutorToken = '';

  let adminUser = null;
  let activeApprovedTutor1 = null;
  let activeApprovedTutor2 = null;
  let pendingTutorUser = null;
  let rejectedTutorUser = null;
  let lockedTutorUser = null;

  let profileTutor1 = null;
  let profileTutor3Pending = null;
  let profileTutor4Rejected = null;
  let profileTutor5Locked = null;

  let foreignCategory = null;
  let itCategory = null;
  let englishSubject = null;
  let itSubject = null;
  let ieltsTopic = null;
  let modeOnline = null;
  let modeOffline = null;
  let levelIntermediate = null;

  beforeAll(async () => {
    await connectDB();

    // Clean up test data
    await User.deleteMany({ email: { $regex: /@test-phase5\.com$/i } });
    await TutorProfile.deleteMany({});

    // Seed taxonomies
    await seedTaxonomies();

    // Look up taxonomy references
    foreignCategory = await Taxonomy.findOne({ slug: 'ngoai-ngu' });
    itCategory = await Taxonomy.findOne({ slug: 'cong-nghe' });
    englishSubject = await Taxonomy.findOne({ slug: 'tieng-anh' });
    itSubject = await Taxonomy.findOne({ slug: 'lap-trinh' });
    ieltsTopic = await Taxonomy.findOne({ slug: 'luyen-thi-ielts' });
    modeOnline = await Taxonomy.findOne({ slug: 'online' });
    modeOffline = await Taxonomy.findOne({ slug: 'offline' });
    levelIntermediate = await Taxonomy.findOne({ slug: 'intermediate' });

    // 1. Create Admin
    adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@test-phase5.com',
      passwordHash: await User.hashPassword('AdminPass123'),
      role: ROLES.ADMIN,
      status: USER_STATUS.ACTIVE,
    });

    // 2. Create Learner
    await User.create({
      name: 'Test Learner User',
      email: 'learner@test-phase5.com',
      passwordHash: await User.hashPassword('LearnerPass123'),
      role: ROLES.LEARNER,
      status: USER_STATUS.ACTIVE,
    });

    // 3. Create Approved Tutor 1 (English, IELTS, Online, 200k, 5 yrs, 4.8 rating)
    activeApprovedTutor1 = await User.create({
      name: 'Teacher Tran IELTS',
      email: 'tutor1@test-phase5.com',
      passwordHash: await User.hashPassword('TutorPass123'),
      role: ROLES.TUTOR,
      status: USER_STATUS.ACTIVE,
      phone: '0988111222',
      avatar: 'https://example.com/avatar1.jpg',
    });

    profileTutor1 = await TutorProfile.create({
      userId: activeApprovedTutor1._id,
      completionStatus: COMPLETION_STATUS.COMPLETED,
      approvalStatus: APPROVAL_STATUS.APPROVED,
      approvedAt: new Date(),
      approvedBy: adminUser._id,
      expertise: {
        categoryId: foreignCategory._id,
        subjectIds: [englishSubject._id],
        topicIds: [ieltsTopic._id],
      },
      teachingCapabilities: {
        teachableLevels: [levelIntermediate._id],
        supportedTargetLevels: [levelIntermediate._id],
      },
      teachingConditions: {
        modes: [modeOnline._id],
        serviceAreas: ['Quận 1', 'Quận 3'],
        priceRangeId: '200k_300k',
        priceMin: 200000,
        priceMax: 300000,
        currency: 'VND',
        isNegotiable: false,
      },
      experienceYears: 5,
      ratingSummary: {
        averageRating: 4.8,
        reviewCount: 20,
      },
      introduction: 'Chuyên luyện thi IELTS cấp tốc từ 5.0 lên 7.5+',
      qualifications: [
        {
          title: 'IELTS Certificate 8.5',
          issuer: 'British Council',
          issueYear: 2023,
          credentialUrl: 'https://example.com/cert-ielts.pdf',
          verified: false,
        },
      ],
      submittedAt: new Date(Date.now() - 3600000 * 24),
    });

    // 4. Create Approved Tutor 2 (Programming Python, Offline & Online, 400k, 3 yrs, 4.5 rating)
    activeApprovedTutor2 = await User.create({
      name: 'Le IT Developer',
      email: 'tutor2@test-phase5.com',
      passwordHash: await User.hashPassword('TutorPass123'),
      role: ROLES.TUTOR,
      status: USER_STATUS.ACTIVE,
      phone: '0977222333',
      avatar: 'https://example.com/avatar2.jpg',
    });

    await TutorProfile.create({
      userId: activeApprovedTutor2._id,
      completionStatus: COMPLETION_STATUS.COMPLETED,
      approvalStatus: APPROVAL_STATUS.APPROVED,
      approvedAt: new Date(),
      approvedBy: adminUser._id,
      expertise: {
        categoryId: itCategory._id,
        subjectIds: [itSubject._id],
        topicIds: [],
      },
      teachingCapabilities: {
        teachableLevels: [levelIntermediate._id],
        supportedTargetLevels: [],
      },
      teachingConditions: {
        modes: [modeOnline._id, modeOffline._id],
        serviceAreas: ['Quận Cầu Giấy', 'Hà Nội'],
        priceRangeId: '300k_500k',
        priceMin: 350000,
        priceMax: 450000,
        currency: 'VND',
        isNegotiable: false,
      },
      experienceYears: 3,
      ratingSummary: {
        averageRating: 4.5,
        reviewCount: 10,
      },
      introduction: 'Lập trình viên Fullstack nhận dạy kèm Node.js và Python thực chiến',
      qualifications: [
        {
          title: 'Bằng Cử nhân CNTT Đại học Bách Khoa',
          issuer: 'ĐHBK',
          issueYear: 2021,
          credentialUrl: 'https://example.com/degree.pdf',
          verified: true,
        },
      ],
      submittedAt: new Date(Date.now() - 3600000 * 12),
    });

    // 5. Create Pending Tutor 3
    pendingTutorUser = await User.create({
      name: 'Pham Pending Tutor',
      email: 'tutor3-pending@test-phase5.com',
      passwordHash: await User.hashPassword('TutorPass123'),
      role: ROLES.TUTOR,
      status: USER_STATUS.ACTIVE,
      phone: '0966333444',
    });

    profileTutor3Pending = await TutorProfile.create({
      userId: pendingTutorUser._id,
      completionStatus: COMPLETION_STATUS.COMPLETED,
      approvalStatus: APPROVAL_STATUS.PENDING,
      expertise: {
        categoryId: foreignCategory._id,
        subjectIds: [englishSubject._id],
      },
      teachingConditions: {
        priceMin: 150000,
        priceMax: 200000,
      },
      experienceYears: 2,
      introduction: 'Gia sư Tiếng Anh mới nộp hồ sơ chờ duyệt',
      qualifications: [
        {
          title: 'TOEIC 900',
          issuer: 'IIG',
          issueYear: 2024,
          credentialUrl: 'https://example.com/toeic.pdf',
          verified: false,
        },
      ],
      submittedAt: new Date(),
    });

    // 6. Create Rejected Tutor 4
    rejectedTutorUser = await User.create({
      name: 'Hoang Rejected Tutor',
      email: 'tutor4-rejected@test-phase5.com',
      passwordHash: await User.hashPassword('TutorPass123'),
      role: ROLES.TUTOR,
      status: USER_STATUS.ACTIVE,
      phone: '0955444555',
    });

    profileTutor4Rejected = await TutorProfile.create({
      userId: rejectedTutorUser._id,
      completionStatus: COMPLETION_STATUS.COMPLETED,
      approvalStatus: APPROVAL_STATUS.REJECTED,
      rejectionReason: 'Bằng cấp không rõ ràng, ảnh chụp bị mờ',
      expertise: {
        categoryId: foreignCategory._id,
        subjectIds: [englishSubject._id],
      },
      teachingConditions: {
        priceMin: 100000,
        priceMax: 150000,
      },
      submittedAt: new Date(Date.now() - 3600000 * 48),
    });

    // 7. Create Locked Tutor 5 (Profile approved, but user account is locked)
    lockedTutorUser = await User.create({
      name: 'Vu Locked Tutor',
      email: 'tutor5-locked@test-phase5.com',
      passwordHash: await User.hashPassword('TutorPass123'),
      role: ROLES.TUTOR,
      status: USER_STATUS.LOCKED,
      phone: '0944555666',
    });

    profileTutor5Locked = await TutorProfile.create({
      userId: lockedTutorUser._id,
      completionStatus: COMPLETION_STATUS.COMPLETED,
      approvalStatus: APPROVAL_STATUS.APPROVED,
      approvedAt: new Date(),
      approvedBy: adminUser._id,
      expertise: {
        categoryId: itCategory._id,
        subjectIds: [itSubject._id],
      },
      teachingConditions: {
        priceMin: 200000,
        priceMax: 300000,
      },
    });

    // Logins
    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin@test-phase5.com',
      password: 'AdminPass123',
    });
    adminToken = adminLogin.body.data.accessToken;

    const learnerLogin = await request(app).post('/api/auth/login').send({
      email: 'learner@test-phase5.com',
      password: 'LearnerPass123',
    });
    learnerToken = learnerLogin.body.data.accessToken;

    const tutorLogin = await request(app).post('/api/auth/login').send({
      email: 'tutor1@test-phase5.com',
      password: 'TutorPass123',
    });
    tutorToken = tutorLogin.body.data.accessToken;
  }, 35000);

  afterAll(async () => {
    await User.deleteMany({ email: { $regex: /@test-phase5\.com$/i } });
    await TutorProfile.deleteMany({});
    await disconnectDB();
  }, 25000);

  // ==========================================
  // 1. PUBLIC TUTOR SEARCH (GET /api/tutors)
  // ==========================================
  describe('GET /api/tutors - Public Tutor Search', () => {
    it('should return only approved, completed profiles belonging to active users', async () => {
      const res = await request(app).get('/api/tutors');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeDefined();

      const items = res.body.data.items;
      // Should include Tutor 1 & Tutor 2, but NOT Tutor 3 (pending), Tutor 4 (rejected), Tutor 5 (locked user)
      const returnedUserIds = items.map((t) => t.userId._id || t.userId.id || t.userId);
      expect(returnedUserIds).toContain(activeApprovedTutor1._id.toString());
      expect(returnedUserIds).toContain(activeApprovedTutor2._id.toString());
      expect(returnedUserIds).not.toContain(pendingTutorUser._id.toString());
      expect(returnedUserIds).not.toContain(rejectedTutorUser._id.toString());
      expect(returnedUserIds).not.toContain(lockedTutorUser._id.toString());

      // Check pagination metadata
      expect(res.body.data.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
    });

    it('should sanitize public tutor data (phone, rejectionReason, approvedBy must be removed)', async () => {
      const res = await request(app).get('/api/tutors');
      expect(res.status).toBe(200);
      const tutor1Item = res.body.data.items.find(
        (t) => (t.userId._id || t.userId) === activeApprovedTutor1._id.toString()
      );
      expect(tutor1Item).toBeDefined();
      expect(tutor1Item.userId.name).toBe('Teacher Tran IELTS');
      expect(tutor1Item.userId.phone).toBeUndefined(); // Masked for privacy
      expect(tutor1Item.rejectionReason).toBeUndefined();
      expect(tutor1Item.approvedBy).toBeUndefined();
    });

    it('should filter by Category (expertise.categoryId)', async () => {
      const res = await request(app).get(`/api/tutors?category=${foreignCategory._id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].userId.name).toBe('Teacher Tran IELTS');
    });

    it('should filter by Subject (expertise.subjectIds)', async () => {
      const res = await request(app).get(`/api/tutors?subject=${itSubject._id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].userId.name).toBe('Le IT Developer');
    });

    it('should filter by Learning Mode (online vs offline)', async () => {
      // Offline mode is only supported by Tutor 2
      const resOffline = await request(app).get(`/api/tutors?mode=${modeOffline._id}`);
      expect(resOffline.status).toBe(200);
      expect(resOffline.body.data.items.length).toBe(1);
      expect(resOffline.body.data.items[0].userId.name).toBe('Le IT Developer');

      // Online mode is supported by both Tutor 1 and Tutor 2
      const resOnline = await request(app).get(`/api/tutors?mode=${modeOnline._id}`);
      expect(resOnline.status).toBe(200);
      expect(resOnline.body.data.items.length).toBe(2);
    });

    it('should filter by Price Range (priceMin and priceMax)', async () => {
      // Price <= 300,000 matches Tutor 1 (200k-300k)
      const resCheap = await request(app).get('/api/tutors?priceMax=300000');
      expect(resCheap.status).toBe(200);
      expect(resCheap.body.data.items.length).toBe(1);
      expect(resCheap.body.data.items[0].userId.name).toBe('Teacher Tran IELTS');

      // Price >= 350,000 matches Tutor 2 (350k-450k)
      const resHigh = await request(app).get('/api/tutors?priceMin=350000');
      expect(resHigh.status).toBe(200);
      expect(resHigh.body.data.items.length).toBe(1);
      expect(resHigh.body.data.items[0].userId.name).toBe('Le IT Developer');
    });

    it('should filter by service area with regex', async () => {
      const resArea = await request(app).get('/api/tutors?area=Cầu Giấy');
      expect(resArea.status).toBe(200);
      expect(resArea.body.data.items.length).toBe(1);
      expect(resArea.body.data.items[0].userId.name).toBe('Le IT Developer');
    });

    it('should search keyword (q / search) matching name or introduction', async () => {
      const resName = await request(app).get('/api/tutors?q=Tran');
      expect(resName.status).toBe(200);
      expect(resName.body.data.items.length).toBe(1);
      expect(resName.body.data.items[0].userId.name).toBe('Teacher Tran IELTS');

      const resIntro = await request(app).get('/api/tutors?search=Node.js');
      expect(resIntro.status).toBe(200);
      expect(resIntro.body.data.items.length).toBe(1);
      expect(resIntro.body.data.items[0].userId.name).toBe('Le IT Developer');
    });

    it('should sort results correctly by price and experience', async () => {
      // Sort price ascending (Tutor 1 min 200k < Tutor 2 min 350k)
      const resPriceAsc = await request(app).get('/api/tutors?sort=price:asc');
      expect(resPriceAsc.status).toBe(200);
      expect(resPriceAsc.body.data.items[0].userId.name).toBe('Teacher Tran IELTS');
      expect(resPriceAsc.body.data.items[1].userId.name).toBe('Le IT Developer');

      // Sort price descending (Tutor 2 max 450k > Tutor 1 max 300k)
      const resPriceDesc = await request(app).get('/api/tutors?sort=price:desc');
      expect(resPriceDesc.status).toBe(200);
      expect(resPriceDesc.body.data.items[0].userId.name).toBe('Le IT Developer');
      expect(resPriceDesc.body.data.items[1].userId.name).toBe('Teacher Tran IELTS');

      // Sort experience descending (Tutor 1: 5 yrs > Tutor 2: 3 yrs)
      const resExpDesc = await request(app).get('/api/tutors?sort=experience:desc');
      expect(resExpDesc.status).toBe(200);
      expect(resExpDesc.body.data.items[0].userId.name).toBe('Teacher Tran IELTS');
      expect(resExpDesc.body.data.items[1].userId.name).toBe('Le IT Developer');
    });

    it('should support pagination (page and limit)', async () => {
      const res = await request(app).get('/api/tutors?page=1&limit=1');
      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.pagination).toMatchObject({
        page: 1,
        limit: 1,
        total: 2,
        totalPages: 2,
        hasNext: true,
        hasPrev: false,
      });

      const resPage2 = await request(app).get('/api/tutors?page=2&limit=1');
      expect(resPage2.status).toBe(200);
      expect(resPage2.body.data.items.length).toBe(1);
      expect(resPage2.body.data.pagination).toMatchObject({
        page: 2,
        limit: 1,
        total: 2,
        totalPages: 2,
        hasNext: false,
        hasPrev: true,
      });
    });

    it('should reject unwhitelisted query parameter with 400 Bad Request', async () => {
      const res = await request(app).get('/api/tutors?hackAttack=true');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors[0].message).toContain('không nằm trong danh sách cho phép');
    });

    it('should reject invalid ObjectId in filter with 400 Bad Request', async () => {
      const res = await request(app).get('/api/tutors?category=invalid-id-format');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject priceMin greater than priceMax with 400 Bad Request', async () => {
      const res = await request(app).get('/api/tutors?priceMin=500000&priceMax=200000');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ==========================================
  // 2. PUBLIC TUTOR DETAIL (GET /api/tutors/:id)
  // ==========================================
  describe('GET /api/tutors/:id - Public Tutor Profile Detail', () => {
    it('should return public profile for approved active tutor', async () => {
      const res = await request(app).get(`/api/tutors/${profileTutor1._id}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile.userId.name).toBe('Teacher Tran IELTS');
      expect(res.body.data.profile.userId.phone).toBeUndefined(); // Masked
    });

    it('should return 404 for pending tutor profile when accessed by public/learner', async () => {
      const res = await request(app).get(`/api/tutors/${profileTutor3Pending._id}`);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 for rejected tutor profile when accessed by public/learner', async () => {
      const res = await request(app).get(`/api/tutors/${profileTutor4Rejected._id}`);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 for tutor whose user account is locked', async () => {
      const res = await request(app).get(`/api/tutors/${profileTutor5Locked._id}`);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should allow admin to view pending or rejected profile via public endpoint', async () => {
      const res = await request(app)
        .get(`/api/tutors/${profileTutor3Pending._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile.approvalStatus).toBe(APPROVAL_STATUS.PENDING);
    });
  });

  // ==========================================
  // 3. ADMIN TUTOR LIST (GET /api/admin/tutors)
  // ==========================================
  describe('GET /api/admin/tutors - Admin Tutor Management Listing', () => {
    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/admin/tutors');
      expect(res.status).toBe(401);
    });

    it('should reject learner request with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/tutors')
        .set('Authorization', `Bearer ${learnerToken}`);
      expect(res.status).toBe(403);
    });

    it('should reject tutor request with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/tutors')
        .set('Authorization', `Bearer ${tutorToken}`);
      expect(res.status).toBe(403);
    });

    it('should allow admin to list all tutors including pending and rejected', async () => {
      const res = await request(app)
        .get('/api/admin/tutors')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeDefined();

      const items = res.body.data.items;
      expect(items.length).toBeGreaterThanOrEqual(4);

      // Check admin receives unmasked phone number
      const tutor1Item = items.find(
        (t) => (t.userId._id || t.userId) === activeApprovedTutor1._id.toString()
      );
      expect(tutor1Item).toBeDefined();
      expect(tutor1Item.userId.phone).toBe('0988111222');
    });

    it('should filter by approvalStatus=pending for admin queue', async () => {
      const res = await request(app)
        .get('/api/admin/tutors?approvalStatus=pending')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].userId.name).toBe('Pham Pending Tutor');
      expect(res.body.data.items[0].approvalStatus).toBe(APPROVAL_STATUS.PENDING);
    });

    it('should filter by approvalStatus=rejected', async () => {
      const res = await request(app)
        .get('/api/admin/tutors?approvalStatus=rejected')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].userId.name).toBe('Hoang Rejected Tutor');
      expect(res.body.data.items[0].rejectionReason).toBe('Bằng cấp không rõ ràng, ảnh chụp bị mờ');
    });

    it('should search tutor by name or phone for admin', async () => {
      const res = await request(app)
        .get('/api/admin/tutors?search=0966333444')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].userId.name).toBe('Pham Pending Tutor');
    });
  });

  // ==========================================
  // 4. ADMIN TUTOR DETAIL (GET /api/admin/tutors/:id)
  // ==========================================
  describe('GET /api/admin/tutors/:id - Admin Tutor Detail View', () => {
    it('should allow admin to view full tutor details with unmasked phone and qualifications', async () => {
      const res = await request(app)
        .get(`/api/admin/tutors/${profileTutor3Pending._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile.userId.name).toBe('Pham Pending Tutor');
      expect(res.body.data.profile.userId.phone).toBe('0966333444');
      expect(res.body.data.profile.qualifications).toHaveLength(1);
      expect(res.body.data.profile.qualifications[0].title).toBe('TOEIC 900');
    });

    it('should return 404 for non-existent tutor ID', async () => {
      const fakeId = new User()._id.toString();
      const res = await request(app)
        .get(`/api/admin/tutors/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ==========================================
  // 5. ADMIN APPROVAL & REJECTION (PATCH /api/admin/tutors/:id/approval)
  // ==========================================
  describe('PATCH /api/admin/tutors/:id/approval - Approve & Reject Workflow', () => {
    it('should reject non-admin request with 403 Forbidden', async () => {
      const res = await request(app)
        .patch(`/api/admin/tutors/${profileTutor3Pending._id}/approval`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({ approvalStatus: 'approved' });
      expect(res.status).toBe(403);
    });

    it('should reject invalid approvalStatus with 400 Bad Request', async () => {
      const res = await request(app)
        .patch(`/api/admin/tutors/${profileTutor3Pending._id}/approval`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ approvalStatus: 'invalid_status' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject rejection when rejectionReason is missing with 400 Bad Request', async () => {
      const res = await request(app)
        .patch(`/api/admin/tutors/${profileTutor3Pending._id}/approval`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ approvalStatus: 'rejected' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Dữ liệu phê duyệt gia sư không hợp lệ');
    });

    it('should approve pending tutor and verify selected qualifications', async () => {
      const qualId = profileTutor3Pending.qualifications[0]._id.toString();

      const res = await request(app)
        .patch(`/api/admin/tutors/${profileTutor3Pending._id}/approval`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          approvalStatus: 'approved',
          verifiedQualifications: [qualId],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile.approvalStatus).toBe(APPROVAL_STATUS.APPROVED);
      expect(res.body.data.profile.approvedAt).toBeDefined();
      expect(res.body.data.profile.approvedBy).toBeDefined();
      expect(res.body.data.profile.rejectionReason).toBeNull();

      // Check qualification was verified
      const updatedQual = res.body.data.profile.qualifications.find(
        (q) => (q._id || q.id) === qualId
      );
      expect(updatedQual.verified).toBe(true);
    });

    it('should reject tutor and record rejectionReason, clearing approval timestamp and approver', async () => {
      const res = await request(app)
        .patch(`/api/admin/tutors/${profileTutor3Pending._id}/approval`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          approvalStatus: 'rejected',
          rejectionReason: 'Chứng chỉ ngoại ngữ đã quá hạn 2 năm',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile.approvalStatus).toBe(APPROVAL_STATUS.REJECTED);
      expect(res.body.data.profile.rejectionReason).toBe('Chứng chỉ ngoại ngữ đã quá hạn 2 năm');
      expect(res.body.data.profile.approvedAt).toBeNull();
      expect(res.body.data.profile.approvedBy).toBeNull();
    });

    it('should re-approve tutor when they update profile satisfactorily', async () => {
      const res = await request(app)
        .patch(`/api/admin/tutors/${profileTutor3Pending._id}/approval`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          approvalStatus: 'approved',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.profile.approvalStatus).toBe(APPROVAL_STATUS.APPROVED);
      expect(res.body.data.profile.rejectionReason).toBeNull();
    });
  });
});
