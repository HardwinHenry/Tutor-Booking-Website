const request = require('supertest');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/user.model');
const Taxonomy = require('../src/models/taxonomy.model');
const TutorProfile = require('../src/models/tutorProfile.model');
const LearnerPreference = require('../src/models/learnerPreference.model');
const RecommendationLog = require('../src/models/recommendationLog.model');
const { ROLES } = require('../src/constants/roles');
const { USER_STATUS } = require('../src/constants/userStatus');
const { COMPLETION_STATUS, APPROVAL_STATUS } = require('../src/constants/profileStatus');
const { seedTaxonomies } = require('../src/seeds/taxonomy.seed');
const { ALGORITHM_VERSION } = require('../src/constants/recommendation.config');

jest.setTimeout(60000);

describe('Phase 6: Recommendation Service - Content-based Filtering (CBF)', () => {
  let adminToken = '';
  let learnerToken = '';
  let incompleteLearnerToken = '';
  let tutorToken = '';

  let adminUser = null;
  let activeLearnerUser = null;
  let incompleteLearnerUser = null;

  let tutor1PerfectUser = null;
  let tutor2NoReviewUser = null;
  let tutor3PendingUser = null;
  let tutor4LockedUser = null;
  let tutor5WrongSubjectUser = null;
  let tutor6WrongLevelUser = null;
  let tutor7UnverifiedCertUser = null;
  let tutor8VerifiedCertUser = null;
  let tutor9ExpensiveUser = null;

  let foreignCategory = null;
  let itCategory = null;
  let englishSubject = null;
  let itSubject = null;
  let ieltsTopic = null;
  let pythonTopic = null;

  let modeOnline = null;
  let levelBeginner = null;
  let levelIntermediate = null;
  let levelAdvanced = null;

  let purposeCert = null;
  let methodTheoryPractice = null;
  let stylePatient = null;
  let styleFriendly = null;
  let materialSlide = null;
  let timeBandEvening = null;

  beforeAll(async () => {
    await connectDB();

    // Clean up test data
    await User.deleteMany({ email: { $regex: /@test-phase6\.com$/i } });
    await TutorProfile.deleteMany({});
    await LearnerPreference.deleteMany({});
    await RecommendationLog.deleteMany({});

    // Seed taxonomies
    await seedTaxonomies();

    // Fetch taxonomy references
    foreignCategory = await Taxonomy.findOne({ slug: 'ngoai-ngu' });
    itCategory = await Taxonomy.findOne({ slug: 'cong-nghe' });
    englishSubject = await Taxonomy.findOne({ slug: 'tieng-anh' });
    itSubject = await Taxonomy.findOne({ slug: 'lap-trinh' });
    ieltsTopic = await Taxonomy.findOne({ slug: 'luyen-thi-ielts' });
    pythonTopic = await Taxonomy.findOne({ slug: 'python-co-ban' });

    modeOnline = await Taxonomy.findOne({ slug: 'online' });

    levelBeginner = await Taxonomy.findOne({ slug: 'beginner' });
    levelIntermediate = await Taxonomy.findOne({ slug: 'intermediate' });
    levelAdvanced = await Taxonomy.findOne({ slug: 'advanced' });

    purposeCert = await Taxonomy.findOne({ slug: 'certificate-prep' });
    methodTheoryPractice = await Taxonomy.findOne({ slug: 'theory-practice' });
    stylePatient = await Taxonomy.findOne({ slug: 'patient' });
    styleFriendly = await Taxonomy.findOne({ slug: 'friendly' });
    materialSlide = await Taxonomy.findOne({ slug: 'slides' });
    timeBandEvening = await Taxonomy.findOne({ slug: 'evening' });

    // Pre-compute shared password hash to save bcrypt cycles
    const sharedPasswordHash = await User.hashPassword('Pass123456');

    // 1. Create Admin
    adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@test-phase6.com',
      passwordHash: sharedPasswordHash,
      role: ROLES.ADMIN,
      status: USER_STATUS.ACTIVE,
    });

    // 2. Create Completed Learner User
    activeLearnerUser = await User.create({
      name: 'Completed Learner',
      email: 'learner-completed@test-phase6.com',
      passwordHash: sharedPasswordHash,
      role: ROLES.LEARNER,
      status: USER_STATUS.ACTIVE,
    });

    // Create completed preference for learner (Looking for English, IELTS, Intermediate -> Advanced, Online, Budget 200k)
    await LearnerPreference.create({
      userId: activeLearnerUser._id,
      completionStatus: COMPLETION_STATUS.COMPLETED,
      completedAt: new Date(),
      learning: {
        categoryId: foreignCategory._id,
        subjectIds: [englishSubject._id],
        topicIds: [ieltsTopic._id],
        purposes: [purposeCert._id],
        currentLevel: levelIntermediate._id,
        targetLevel: levelAdvanced._id,
        goalTags: ['certificate', 'ielts_target'],
        targetDuration: '3_6_months',
      },
      learningStyle: {
        methods: [methodTheoryPractice._id],
        pace: 'flexible',
        classFormat: 'one_to_one',
        preferredTutorStyles: [stylePatient._id, styleFriendly._id],
        materials: [materialSlide._id],
      },
      schedulePreferences: {
        timeBands: [timeBandEvening._id],
        weekdays: [1, 3, 5],
        sessionsPerWeek: 3,
        durationMinutes: [60, 90],
      },
      constraints: {
        modes: [modeOnline._id],
        budgetMin: 100000,
        budgetMax: 200000,
        currency: 'VND',
      },
      tutorRequirements: {
        experienceRange: '3_5_years',
        certificateRequirement: 'preferred',
        selectionPriorities: [foreignCategory._id], // priority
      },
      supportNeeds: {
        desiredSupport: [methodTheoryPractice._id],
      },
    });

    // 3. Create Incomplete Learner
    incompleteLearnerUser = await User.create({
      name: 'Incomplete Learner',
      email: 'learner-incomplete@test-phase6.com',
      passwordHash: sharedPasswordHash,
      role: ROLES.LEARNER,
      status: USER_STATUS.ACTIVE,
    });

    await LearnerPreference.create({
      userId: incompleteLearnerUser._id,
      completionStatus: COMPLETION_STATUS.IN_PROGRESS,
    });

    // 4. Create Tutor User (for testing tutor-only role blocking)
    await User.create({
      name: 'Tutor Only User',
      email: 'tutor-only@test-phase6.com',
      passwordHash: sharedPasswordHash,
      role: ROLES.TUTOR,
      status: USER_STATUS.ACTIVE,
    });

    // 5. Create Candidate Tutors:

    // Tutor 1: High Match Approved Tutor (English, IELTS, Intermediate, Online, 180k, 5 yrs, 4.9 rating)
    tutor1PerfectUser = await User.create({
      name: 'Top IELTS Expert',
      email: 'tutor1@test-phase6.com',
      passwordHash: sharedPasswordHash,
      role: ROLES.TUTOR,
      status: USER_STATUS.ACTIVE,
    });

    await TutorProfile.create({
      userId: tutor1PerfectUser._id,
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
        supportedPurposes: [purposeCert._id],
        teachableLevels: [levelIntermediate._id, levelAdvanced._id],
        supportedTargetLevels: [levelAdvanced._id],
        supportedGoalTags: ['certificate', 'ielts_target'],
        estimatedDurationRanges: ['3_6_months'],
        methods: [methodTheoryPractice._id],
        pace: 'flexible',
        classFormats: ['one_to_one'],
        styles: [stylePatient._id, styleFriendly._id],
        materials: [materialSlide._id],
      },
      schedulePreferences: {
        timeBands: [timeBandEvening._id],
        weekdays: [1, 3, 5],
        sessionDurationsMinutes: [60, 90],
      },
      teachingConditions: {
        modes: [modeOnline._id],
        priceMin: 180000,
        priceMax: 200000,
        currency: 'VND',
        isNegotiable: false,
      },
      experienceYears: 5,
      qualifications: [
        {
          title: 'IELTS 8.5 Teaching Certificate',
          issuer: 'British Council',
          verified: true,
        },
      ],
      ratingSummary: {
        averageRating: 4.9,
        reviewCount: 20,
      },
      introduction: 'Chuyên gia luyện thi IELTS 8.5 cam kết đầu ra',
    });

    // Tutor 2: Approved Tutor with No Reviews Yet (Neutral rating prior test)
    tutor2NoReviewUser = await User.create({
      name: 'New Approved Tutor',
      email: 'tutor2@test-phase6.com',
      passwordHash: sharedPasswordHash,
      role: ROLES.TUTOR,
      status: USER_STATUS.ACTIVE,
    });

    await TutorProfile.create({
      userId: tutor2NoReviewUser._id,
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
        supportedPurposes: [purposeCert._id],
        teachableLevels: [levelIntermediate._id],
        supportedTargetLevels: [levelAdvanced._id],
        methods: [methodTheoryPractice._id],
      },
      teachingConditions: {
        modes: [modeOnline._id],
        priceMin: 150000,
        priceMax: 150000,
        currency: 'VND',
      },
      experienceYears: 3,
      ratingSummary: {
        averageRating: null,
        reviewCount: 0,
      },
    });

    // Tutor 3: Pending Tutor (must be excluded by Tầng A)
    tutor3PendingUser = await User.create({
      name: 'Pending Tutor',
      email: 'tutor3-pending@test-phase6.com',
      passwordHash: sharedPasswordHash,
      role: ROLES.TUTOR,
      status: USER_STATUS.ACTIVE,
    });

    await TutorProfile.create({
      userId: tutor3PendingUser._id,
      completionStatus: COMPLETION_STATUS.COMPLETED,
      approvalStatus: APPROVAL_STATUS.PENDING,
      expertise: {
        categoryId: foreignCategory._id,
        subjectIds: [englishSubject._id],
      },
      teachingConditions: {
        modes: [modeOnline._id],
      },
    });

    // Tutor 4: Locked User Tutor (must be excluded by Tầng A)
    tutor4LockedUser = await User.create({
      name: 'Locked Tutor',
      email: 'tutor4-locked@test-phase6.com',
      passwordHash: sharedPasswordHash,
      role: ROLES.TUTOR,
      status: USER_STATUS.LOCKED,
    });

    await TutorProfile.create({
      userId: tutor4LockedUser._id,
      completionStatus: COMPLETION_STATUS.COMPLETED,
      approvalStatus: APPROVAL_STATUS.APPROVED,
      expertise: {
        categoryId: foreignCategory._id,
        subjectIds: [englishSubject._id],
      },
      teachingConditions: {
        modes: [modeOnline._id],
      },
    });

    // Tutor 5: Different Subject Tutor (IT/Programming - must be excluded by Subject filter)
    tutor5WrongSubjectUser = await User.create({
      name: 'IT Developer Tutor',
      email: 'tutor5-it@test-phase6.com',
      passwordHash: sharedPasswordHash,
      role: ROLES.TUTOR,
      status: USER_STATUS.ACTIVE,
    });

    await TutorProfile.create({
      userId: tutor5WrongSubjectUser._id,
      completionStatus: COMPLETION_STATUS.COMPLETED,
      approvalStatus: APPROVAL_STATUS.APPROVED,
      expertise: {
        categoryId: itCategory._id,
        subjectIds: [itSubject._id],
        topicIds: [pythonTopic._id],
      },
      teachingCapabilities: {
        teachableLevels: [levelIntermediate._id],
      },
      teachingConditions: {
        modes: [modeOnline._id],
      },
    });

    // Tutor 6: Level Mismatch Tutor (Only teaches Beginner, Learner is Intermediate)
    tutor6WrongLevelUser = await User.create({
      name: 'Kids English Tutor',
      email: 'tutor6-level@test-phase6.com',
      passwordHash: sharedPasswordHash,
      role: ROLES.TUTOR,
      status: USER_STATUS.ACTIVE,
    });

    await TutorProfile.create({
      userId: tutor6WrongLevelUser._id,
      completionStatus: COMPLETION_STATUS.COMPLETED,
      approvalStatus: APPROVAL_STATUS.APPROVED,
      expertise: {
        categoryId: foreignCategory._id,
        subjectIds: [englishSubject._id],
      },
      teachingCapabilities: {
        teachableLevels: [levelBeginner._id], // ONLY beginner
      },
      teachingConditions: {
        modes: [modeOnline._id],
      },
    });

    // Tutor 7: Unverified Certificate Tutor
    tutor7UnverifiedCertUser = await User.create({
      name: 'Unverified Cert Tutor',
      email: 'tutor7-unverified@test-phase6.com',
      passwordHash: sharedPasswordHash,
      role: ROLES.TUTOR,
      status: USER_STATUS.ACTIVE,
    });

    await TutorProfile.create({
      userId: tutor7UnverifiedCertUser._id,
      completionStatus: COMPLETION_STATUS.COMPLETED,
      approvalStatus: APPROVAL_STATUS.APPROVED,
      expertise: {
        categoryId: foreignCategory._id,
        subjectIds: [englishSubject._id],
      },
      teachingCapabilities: {
        teachableLevels: [levelIntermediate._id],
      },
      teachingConditions: {
        modes: [modeOnline._id],
        priceMin: 150000,
        priceMax: 150000,
      },
      qualifications: [
        {
          title: 'Unverified Certificate',
          verified: false,
        },
      ],
    });

    // Tutor 8: Verified Certificate Tutor
    tutor8VerifiedCertUser = await User.create({
      name: 'Verified Cert Tutor',
      email: 'tutor8-verified@test-phase6.com',
      passwordHash: sharedPasswordHash,
      role: ROLES.TUTOR,
      status: USER_STATUS.ACTIVE,
    });

    await TutorProfile.create({
      userId: tutor8VerifiedCertUser._id,
      completionStatus: COMPLETION_STATUS.COMPLETED,
      approvalStatus: APPROVAL_STATUS.APPROVED,
      expertise: {
        categoryId: foreignCategory._id,
        subjectIds: [englishSubject._id],
      },
      teachingCapabilities: {
        teachableLevels: [levelIntermediate._id],
      },
      teachingConditions: {
        modes: [modeOnline._id],
        priceMin: 170000,
        priceMax: 170000,
      },
      qualifications: [
        {
          title: 'TESOL Certified',
          issuer: 'TESOL Org',
          verified: true,
        },
      ],
    });

    // Tutor 9: Expensive Tutor (400k/h vs Learner 200k max)
    tutor9ExpensiveUser = await User.create({
      name: 'Expensive VIP Tutor',
      email: 'tutor9-expensive@test-phase6.com',
      passwordHash: sharedPasswordHash,
      role: ROLES.TUTOR,
      status: USER_STATUS.ACTIVE,
    });

    await TutorProfile.create({
      userId: tutor9ExpensiveUser._id,
      completionStatus: COMPLETION_STATUS.COMPLETED,
      approvalStatus: APPROVAL_STATUS.APPROVED,
      expertise: {
        categoryId: foreignCategory._id,
        subjectIds: [englishSubject._id],
      },
      teachingCapabilities: {
        teachableLevels: [levelIntermediate._id],
      },
      teachingConditions: {
        modes: [modeOnline._id],
        priceMin: 400000,
        priceMax: 500000,
        isNegotiable: false,
      },
    });

    // Log in all actors to get tokens
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test-phase6.com', password: 'Pass123456' });
    adminToken = adminLogin.body.data.accessToken;

    const learnerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'learner-completed@test-phase6.com', password: 'Pass123456' });
    learnerToken = learnerLogin.body.data.accessToken;

    const incLearnerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'learner-incomplete@test-phase6.com', password: 'Pass123456' });
    incompleteLearnerToken = incLearnerLogin.body.data.accessToken;

    const tutorLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'tutor-only@test-phase6.com', password: 'Pass123456' });
    tutorToken = tutorLogin.body.data.accessToken;
  }, 60000);

  afterAll(async () => {
    await User.deleteMany({ email: { $regex: /@test-phase6\.com$/i } });
    await TutorProfile.deleteMany({});
    await LearnerPreference.deleteMany({});
    await RecommendationLog.deleteMany({});
    await disconnectDB();
  });

  describe('Authentication & Access Control', () => {
    it('should reject unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app).post('/api/recommendations/tutors');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject non-learner/non-admin (tutor-only) request with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/recommendations/tutors')
        .set('Authorization', `Bearer ${tutorToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should reject unwhitelisted parameter in query or body with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/recommendations/tutors')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({ maliciousHackField: 'inject_value' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('không hợp lệ');
    });

    it('should reject invalid minScore with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/recommendations/tutors')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({ minScore: 150 });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject incomplete learner profile with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/recommendations/tutors')
        .set('Authorization', `Bearer ${incompleteLearnerToken}`);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Học viên cần hoàn thành khảo sát nhu cầu học tập');
    });
  });

  describe('Tầng A: Candidate Eligibility Filtering', () => {
    it('should exclude pending and locked tutors from recommendations', async () => {
      const res = await request(app)
        .post('/api/recommendations/tutors')
        .set('Authorization', `Bearer ${learnerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const items = res.body.data.items;
      const returnedTutorIds = items.map((i) => i.tutorId);

      // Pending tutor must NOT be included
      expect(returnedTutorIds).not.toContain(tutor3PendingUser._id.toString());
      // Locked tutor must NOT be included
      expect(returnedTutorIds).not.toContain(tutor4LockedUser._id.toString());
    });

    it('should exclude tutors who teach completely different subject/category', async () => {
      const res = await request(app)
        .post('/api/recommendations/tutors')
        .set('Authorization', `Bearer ${learnerToken}`);

      expect(res.status).toBe(200);
      const items = res.body.data.items;
      const returnedTutorIds = items.map((i) => i.tutorId);

      // IT/Programming tutor must NOT be included for an English learner
      expect(returnedTutorIds).not.toContain(tutor5WrongSubjectUser._id.toString());
    });

    it('should exclude tutors who cannot teach learner current level', async () => {
      const res = await request(app)
        .post('/api/recommendations/tutors')
        .set('Authorization', `Bearer ${learnerToken}`);

      expect(res.status).toBe(200);
      const items = res.body.data.items;
      const returnedTutorIds = items.map((i) => i.tutorId);

      // Tutor 6 only teaches Beginner, learner is Intermediate -> Excluded
      expect(returnedTutorIds).not.toContain(tutor6WrongLevelUser._id.toString());
    });

    it('should enforce hard filter on verified certificate when certificateRequirement is required', async () => {
      // Temporarily set learner's certificateRequirement = required
      await LearnerPreference.updateOne(
        { userId: activeLearnerUser._id },
        { 'tutorRequirements.certificateRequirement': 'required' }
      );

      const res = await request(app)
        .post('/api/recommendations/tutors')
        .set('Authorization', `Bearer ${learnerToken}`);

      expect(res.status).toBe(200);
      const items = res.body.data.items;
      const returnedTutorIds = items.map((i) => i.tutorId);

      // Tutor 7 (unverified cert) must be EXCLUDED
      expect(returnedTutorIds).not.toContain(tutor7UnverifiedCertUser._id.toString());
      // Tutor 8 (verified cert) must be INCLUDED
      expect(returnedTutorIds).toContain(tutor8VerifiedCertUser._id.toString());

      // Restore learner requirement to preferred
      await LearnerPreference.updateOne(
        { userId: activeLearnerUser._id },
        { 'tutorRequirements.certificateRequirement': 'preferred' }
      );
    });

    it('should exclude expensive tutors when strictBudget option is set', async () => {
      const res = await request(app)
        .post('/api/recommendations/tutors')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({ strictBudget: true });

      expect(res.status).toBe(200);
      const items = res.body.data.items;
      const returnedTutorIds = items.map((i) => i.tutorId);

      // Tutor 9 (400k/h vs 200k max) must be EXCLUDED under strictBudget
      expect(returnedTutorIds).not.toContain(tutor9ExpensiveUser._id.toString());
    });
  });

  describe('Tầng B: Content-based Scoring, Explanations & Ranking', () => {
    it('should return algorithmVersion cbf-v1 and full score breakdown for each match', async () => {
      const res = await request(app)
        .post('/api/recommendations/tutors')
        .set('Authorization', `Bearer ${learnerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.algorithmVersion).toBe(ALGORITHM_VERSION);

      const items = res.body.data.items;
      expect(items.length).toBeGreaterThan(0);

      // Verify top candidate
      const topMatch = items[0];
      expect(topMatch).toHaveProperty('tutorId');
      expect(topMatch).toHaveProperty('matchScore');
      expect(typeof topMatch.matchScore).toBe('number');
      expect(topMatch.matchScore).toBeGreaterThanOrEqual(0);
      expect(topMatch.matchScore).toBeLessThanOrEqual(100);

      // Verify 8 breakdown components
      const b = topMatch.scoreBreakdown;
      expect(b).toHaveProperty('subject');
      expect(b).toHaveProperty('levelGoal');
      expect(b).toHaveProperty('budget');
      expect(b).toHaveProperty('modeLocation');
      expect(b).toHaveProperty('teachingFit');
      expect(b).toHaveProperty('availability');
      expect(b).toHaveProperty('experienceQualification');
      expect(b).toHaveProperty('rating');

      // Verify explanations
      expect(Array.isArray(topMatch.matchedReasons)).toBe(true);
      expect(topMatch.matchedReasons.length).toBeGreaterThan(0);
      expect(Array.isArray(topMatch.missingOrWeakMatches)).toBe(true);

      // Verify sanitized tutor data (no sensitive fields)
      expect(topMatch.tutor.userId).toBeDefined();
      expect(topMatch.tutor.userId.phone).toBeUndefined();
      expect(topMatch.tutor.rejectionReason).toBeUndefined();
      expect(topMatch.tutor.approvedBy).toBeUndefined();
    });

    it('should rank perfect match tutor highest with exceptional score', async () => {
      const res = await request(app)
        .post('/api/recommendations/tutors')
        .set('Authorization', `Bearer ${learnerToken}`);

      expect(res.status).toBe(200);
      const items = res.body.data.items;

      // Tutor 1 (Perfect match) should be ranked first
      expect(items[0].tutorId).toBe(tutor1PerfectUser._id.toString());
      expect(items[0].matchScore).toBeGreaterThanOrEqual(90);
      expect(items[0].matchedReasons).toContain('Có dạy đúng môn học bạn đang tìm kiếm');
    });

    it('should assign neutral prior score for unreviewed tutor without fake review reason', async () => {
      const res = await request(app)
        .post('/api/recommendations/tutors')
        .set('Authorization', `Bearer ${learnerToken}`);

      expect(res.status).toBe(200);
      const items = res.body.data.items;
      const unreviewedTutorMatch = items.find(
        (i) => i.tutorId === tutor2NoReviewUser._id.toString()
      );

      expect(unreviewedTutorMatch).toBeDefined();
      expect(unreviewedTutorMatch.scoreBreakdown.rating).toBe(75); // Neutral 75/100
      // Must NOT contain deceptive text claiming high reviews
      const hasRatingReason = unreviewedTutorMatch.matchedReasons.some((r) =>
        r.includes('Được đánh giá cao')
      );
      expect(hasRatingReason).toBe(false);
    });

    it('should support minScore filter', async () => {
      const res = await request(app)
        .post('/api/recommendations/tutors')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({ minScore: 90 });

      expect(res.status).toBe(200);
      const items = res.body.data.items;
      for (const item of items) {
        expect(item.matchScore).toBeGreaterThanOrEqual(90);
      }
    });

    it('should support pagination (page and limit)', async () => {
      const res = await request(app)
        .post('/api/recommendations/tutors')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({ page: 1, limit: 2 });

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(2);
      expect(res.body.data.items.length).toBeLessThanOrEqual(2);
    });

    it('should allow GET request to /api/recommendations/tutors as convenient alias', async () => {
      const res = await request(app)
        .get('/api/recommendations/tutors?limit=3')
        .set('Authorization', `Bearer ${learnerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBeLessThanOrEqual(3);
    });

    it('should allow Admin to preview recommendations for any learner via learnerId parameter', async () => {
      const res = await request(app)
        .post('/api/recommendations/tutors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ learnerId: activeLearnerUser._id });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThan(0);
    });

    it('should record recommendation telemetry in RecommendationLog', async () => {
      const log = await RecommendationLog.findOne({ learnerId: activeLearnerUser._id });
      expect(log).toBeDefined();
      expect(log.algorithmVersion).toBe(ALGORITHM_VERSION);
      expect(log.topRecommendations.length).toBeGreaterThan(0);
    });
  });
});
