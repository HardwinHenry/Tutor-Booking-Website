const request = require('supertest');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/user.model');
const Taxonomy = require('../src/models/taxonomy.model');
const { ROLES } = require('../src/constants/roles');
const { TAXONOMY_TYPES } = require('../src/constants/taxonomyTypes');
const { seedTaxonomies } = require('../src/seeds/taxonomy.seed');
const { validateTaxonomyIds } = require('../src/services/taxonomy.service');

describe('Taxonomy & Questionnaire Module (Phase 3)', () => {
  let adminAccessToken = '';
  let learnerAccessToken = '';
  let tutorAccessToken = '';

  let createdCategory = null;
  let createdSubject = null;

  beforeAll(async () => {
    await connectDB();

    // Clean up test data from prior runs
    await User.deleteMany({ email: { $regex: /@test-phase3\.com$/i } });
    await Taxonomy.deleteMany({ slug: { $regex: /^test-/ } });

    // Seed standard taxonomies for testing
    await seedTaxonomies();

    // 1. Create Admin user
    await User.create({
      name: 'System Admin',
      email: 'admin@test-phase3.com',
      passwordHash: await User.hashPassword('AdminPass123'),
      role: ROLES.ADMIN,
    });

    // 2. Create Learner user
    await User.create({
      name: 'Test Learner',
      email: 'learner@test-phase3.com',
      passwordHash: await User.hashPassword('LearnerPass123'),
      role: ROLES.LEARNER,
    });

    // 3. Create Tutor user
    await User.create({
      name: 'Test Tutor',
      email: 'tutor@test-phase3.com',
      passwordHash: await User.hashPassword('TutorPass123'),
      role: ROLES.TUTOR,
    });

    // Login Admin
    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin@test-phase3.com',
      password: 'AdminPass123',
    });
    adminAccessToken = adminLogin.body.data.accessToken;

    // Login Learner
    const learnerLogin = await request(app).post('/api/auth/login').send({
      email: 'learner@test-phase3.com',
      password: 'LearnerPass123',
    });
    learnerAccessToken = learnerLogin.body.data.accessToken;

    // Login Tutor
    const tutorLogin = await request(app).post('/api/auth/login').send({
      email: 'tutor@test-phase3.com',
      password: 'TutorPass123',
    });
    tutorAccessToken = tutorLogin.body.data.accessToken;
  }, 30000);

  afterAll(async () => {
    await User.deleteMany({ email: { $regex: /@test-phase3\.com$/i } });
    await Taxonomy.deleteMany({ slug: { $regex: /^test-/ } });
    await disconnectDB();
  }, 20000);

  // ------------------------------------------------------------------------
  // 1. QUESTIONNAIRE API (28 QUESTIONS FOR LEARNER & TUTOR)
  // ------------------------------------------------------------------------
  describe('GET /api/questionnaires/:role', () => {
    it('should return 28 questions for learner with preloaded root taxonomy options', async () => {
      const res = await request(app).get('/api/questionnaires/learner');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe(ROLES.LEARNER);
      expect(res.body.data.totalQuestions).toBe(28);
      expect(res.body.data.questions).toHaveLength(28);

      // Verify Q1 has preloaded options from category taxonomy
      const q1 = res.body.data.questions.find((q) => q.questionId === 'Q1');
      expect(q1).toBeDefined();
      expect(q1.taxonomyType).toBe(TAXONOMY_TYPES.CATEGORY);
      expect(q1.options.length).toBeGreaterThan(0);

      // Verify Q2 and Q3 have dependency definitions
      const q2 = res.body.data.questions.find((q) => q.questionId === 'Q2');
      expect(q2.dependsOn).toBe('Q1');

      const q3 = res.body.data.questions.find((q) => q.questionId === 'Q3');
      expect(q3.dependsOn).toBe('Q2');

      // Verify maxSelections rule on Q12 and Q22
      const q12 = res.body.data.questions.find((q) => q.questionId === 'Q12');
      expect(q12.maxSelections).toBe(3);

      const q22 = res.body.data.questions.find((q) => q.questionId === 'Q22');
      expect(q22.maxSelections).toBe(3);
    });

    it('should return 28 questions for tutor with role matching', async () => {
      const res = await request(app).get('/api/questionnaires/tutor');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe(ROLES.TUTOR);
      expect(res.body.data.totalQuestions).toBe(28);

      const q1 = res.body.data.questions.find((q) => q.questionId === 'Q1');
      expect(q1.taxonomyType).toBe(TAXONOMY_TYPES.CATEGORY);

      const q2 = res.body.data.questions.find((q) => q.questionId === 'Q2');
      expect(q2.dependsOn).toBe('Q1');
    });

    it('should reject invalid role with 400 Bad Request', async () => {
      const res = await request(app).get('/api/questionnaires/invalid_role');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('không hợp lệ');
    });
  });

  // ------------------------------------------------------------------------
  // 2. TAXONOMIES PUBLIC LIST & FILTERING
  // ------------------------------------------------------------------------
  describe('GET /api/taxonomies & /api/tags', () => {
    it('should retrieve list of taxonomies filtered by type=category', async () => {
      const res = await request(app).get('/api/taxonomies?type=category');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThan(0);
      res.body.data.items.forEach((item) => {
        expect(item.type).toBe(TAXONOMY_TYPES.CATEGORY);
      });
    });

    it('should retrieve subjects with specific parentId (Ngoại ngữ)', async () => {
      // Find Ngoại ngữ category first
      const category = await Taxonomy.findOne({ slug: 'ngoai-ngu', type: TAXONOMY_TYPES.CATEGORY });
      expect(category).toBeDefined();

      const res = await request(app).get(`/api/taxonomies?parentId=${category._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThan(0);
      res.body.data.items.forEach((item) => {
        expect(item.parentId.toString()).toBe(category._id.toString());
      });
    });

    it('should support pagination via page and limit parameters', async () => {
      const res = await request(app).get('/api/taxonomies?page=1&limit=3');

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(3);
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(3);
    });

    it('should search taxonomies by name or slug keyword', async () => {
      const res = await request(app).get('/api/taxonomies?search=IELTS');

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThan(0);
      const found = res.body.data.items.some(
        (i) => i.name.includes('IELTS') || i.slug.includes('ielts')
      );
      expect(found).toBe(true);
    });

    it('should return tags via /api/tags alias endpoint', async () => {
      const res = await request(app).get('/api/tags?type=level');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThan(0);
      res.body.data.items.forEach((item) => {
        expect(item.type).toBe(TAXONOMY_TYPES.LEVEL);
      });
    });
  });

  // ------------------------------------------------------------------------
  // 3. TAXONOMY DETAILS & HIERARCHICAL CHILDREN (Category -> Subject -> Topic)
  // ------------------------------------------------------------------------
  describe('GET /api/taxonomies/:id & /api/taxonomies/:id/children', () => {
    it('should return children of Category (Ngoại ngữ -> Tiếng Anh, Tiếng Trung...)', async () => {
      const category = await Taxonomy.findOne({ slug: 'ngoai-ngu', type: TAXONOMY_TYPES.CATEGORY });

      const res = await request(app).get(`/api/taxonomies/${category._id}/children`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.parent.id).toBe(category._id.toString());
      expect(res.body.data.children.length).toBeGreaterThan(0);

      const subjectSlugs = res.body.data.children.map((c) => c.slug);
      expect(subjectSlugs).toContain('tieng-anh');
      expect(subjectSlugs).toContain('tieng-trung');
    });

    it('should return children of Subject (Tiếng Anh -> IELTS, TOEIC...)', async () => {
      const subject = await Taxonomy.findOne({ slug: 'tieng-anh', type: TAXONOMY_TYPES.SUBJECT });

      const res = await request(app).get(`/api/taxonomies/${subject._id}/children`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.children.length).toBeGreaterThan(0);

      const topicSlugs = res.body.data.children.map((c) => c.slug);
      expect(topicSlugs).toContain('luyen-thi-ielts');
      expect(topicSlugs).toContain('luyen-thi-toeic');
    });

    it('should return taxonomy detail by ID', async () => {
      const item = await Taxonomy.findOne({ slug: 'luyen-thi-ielts' });

      const res = await request(app).get(`/api/taxonomies/${item._id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.item.id).toBe(item._id.toString());
    });

    it('should return 400 Bad Request for malformed ObjectId', async () => {
      const res = await request(app).get('/api/taxonomies/invalid-id-format/children');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 Not Found for non-existent ObjectId', async () => {
      const nonExistentId = '654321654321654321654321';
      const res = await request(app).get(`/api/taxonomies/${nonExistentId}/children`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ------------------------------------------------------------------------
  // 4. ADMIN RBAC & CREATION (POST /api/admin/taxonomies)
  // ------------------------------------------------------------------------
  describe('POST /api/admin/taxonomies (Admin RBAC & Creation)', () => {
    it('should reject unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app).post('/api/admin/taxonomies').send({
        name: 'Test Category',
        type: 'category',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject learner request with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/admin/taxonomies')
        .set('Authorization', `Bearer ${learnerAccessToken}`)
        .send({
          name: 'Test Category',
          type: 'category',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should reject tutor request with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/admin/taxonomies')
        .set('Authorization', `Bearer ${tutorAccessToken}`)
        .send({
          name: 'Test Category',
          type: 'category',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should create new category successfully with Admin token', async () => {
      const res = await request(app)
        .post('/api/admin/taxonomies')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          name: 'Test Danh Mục Mới',
          slug: 'test-danh-muc-moi',
          type: TAXONOMY_TYPES.CATEGORY,
          description: 'Mô tả danh mục test',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.item.name).toBe('Test Danh Mục Mới');
      expect(res.body.data.item.slug).toBe('test-danh-muc-moi');
      expect(res.body.data.item.type).toBe(TAXONOMY_TYPES.CATEGORY);

      createdCategory = res.body.data.item;
    });

    it('should auto-generate slug if slug is omitted', async () => {
      const res = await request(app)
        .post('/api/admin/taxonomies')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          name: 'Test Tự Động Tạo Slug',
          type: TAXONOMY_TYPES.CATEGORY,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.item.slug).toBe('test-tu-dong-tao-slug');

      // Cleanup
      await Taxonomy.findByIdAndDelete(res.body.data.item.id);
    });

    it('should create child subject with parentId pointing to category', async () => {
      const res = await request(app)
        .post('/api/admin/taxonomies')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          name: 'Test Môn Học Con',
          slug: 'test-mon-hoc-con',
          type: TAXONOMY_TYPES.SUBJECT,
          parentId: createdCategory.id,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.item.parentId.toString()).toBe(createdCategory.id.toString());
      createdSubject = res.body.data.item;
    });

    it('should reject duplicate taxonomy (same type, slug and parent) with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/admin/taxonomies')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          name: 'Test Danh Mục Mới',
          slug: 'test-danh-muc-moi',
          type: TAXONOMY_TYPES.CATEGORY,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('đã tồn tại');
    });

    it('should reject creation when parentId does not exist with 400 Bad Request', async () => {
      const nonExistentId = '654321654321654321654321';
      const res = await request(app)
        .post('/api/admin/taxonomies')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          name: 'Invalid Parent Subject',
          type: TAXONOMY_TYPES.SUBJECT,
          parentId: nonExistentId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ------------------------------------------------------------------------
  // 5. ADMIN UPDATE & SOFT DEACTIVATION (PATCH /api/admin/taxonomies/:id)
  // ------------------------------------------------------------------------
  describe('PATCH /api/admin/taxonomies/:id (Admin Update & Soft Delete)', () => {
    it('should update name and sortOrder successfully', async () => {
      const res = await request(app)
        .patch(`/api/admin/taxonomies/${createdCategory.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          name: 'Test Danh Mục Đã Cập Nhật',
          sortOrder: 10,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.item.name).toBe('Test Danh Mục Đã Cập Nhật');
      expect(res.body.data.item.sortOrder).toBe(10);
    });

    it('should soft-deactivate taxonomy by setting active: false', async () => {
      const res = await request(app)
        .patch(`/api/admin/taxonomies/${createdSubject.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          active: false,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.item.active).toBe(false);

      // Verify it is excluded from public search by default
      const publicQuery = await request(app).get(`/api/taxonomies?type=${TAXONOMY_TYPES.SUBJECT}`);
      const ids = publicQuery.body.data.items.map((i) => i.id);
      expect(ids).not.toContain(createdSubject.id);

      // But can be retrieved if active=false query is sent
      const adminQuery = await request(app).get(
        `/api/taxonomies?type=${TAXONOMY_TYPES.SUBJECT}&active=false`
      );
      const inactiveIds = adminQuery.body.data.items.map((i) => i.id);
      expect(inactiveIds).toContain(createdSubject.id);
    });

    it('should reject circular parent reference (parentId = self)', async () => {
      const res = await request(app)
        .patch(`/api/admin/taxonomies/${createdCategory.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          parentId: createdCategory.id,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('không thể làm cha của chính nó');
    });
  });

  // ------------------------------------------------------------------------
  // 6. TAXONOMY VALIDATION UTILITY FOR PHASE 4 ONBOARDING
  // ------------------------------------------------------------------------
  describe('validateTaxonomyIds Service Helper', () => {
    it('should return valid=true when all IDs exist and are active', async () => {
      const categories = await Taxonomy.find({ type: TAXONOMY_TYPES.CATEGORY, active: true }).limit(
        2
      );
      const ids = categories.map((c) => c._id);

      const check = await validateTaxonomyIds(ids, TAXONOMY_TYPES.CATEGORY);
      expect(check.valid).toBe(true);
      expect(check.invalidIds).toHaveLength(0);
    });

    it('should flag non-existent or inactive IDs as invalid', async () => {
      const fakeId = '654321654321654321654321';
      const check = await validateTaxonomyIds([fakeId, createdSubject.id], null, false);

      expect(check.valid).toBe(false);
      expect(check.invalidIds).toContain(fakeId);
      // createdSubject is inactive, so it should be flagged invalid when allowInactive is false
      expect(check.invalidIds).toContain(createdSubject.id);
    });
  });
});
