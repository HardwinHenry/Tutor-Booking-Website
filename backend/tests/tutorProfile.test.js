const request = require('supertest');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/user.model');
const Taxonomy = require('../src/models/taxonomy.model');
const TutorProfile = require('../src/models/tutorProfile.model');
const { ROLES } = require('../src/constants/roles');
const { COMPLETION_STATUS, APPROVAL_STATUS } = require('../src/constants/profileStatus');
const { seedTaxonomies } = require('../src/seeds/taxonomy.seed');

describe('Tutor Profile & Onboarding Module (Phase 4)', () => {
  let tutorUser = null;
  let learnerToken = '';
  let tutorToken = '';

  let foreignCategory = null;
  let englishSubject = null;
  let programmingSubject = null;
  let ieltsTopic = null;
  let purposePrep = null;
  let levelBeginner = null;
  let levelAdvanced = null;
  let methodTheoryPractice = null;
  let stylePatient = null;
  let styleFriendly = null;
  let styleDisciplined = null;
  let styleCreative = null;
  let materialSlide = null;
  let interactionFrequent = null;
  let timeBandMorning = null;
  let modeOnline = null;
  let modeOffline = null;
  let offlineHome = null;
  let approachSimplify = null;
  let supportExercises = null;
  let trackingWeekly = null;

  beforeAll(async () => {
    await connectDB();

    // Clean up test data
    await User.deleteMany({ email: { $regex: /@test-phase4-tutor\.com$/i } });
    await TutorProfile.deleteMany({});

    // Seed taxonomies
    await seedTaxonomies();

    // Lookup taxonomy items for testing
    foreignCategory = await Taxonomy.findOne({ slug: 'ngoai-ngu' });
    englishSubject = await Taxonomy.findOne({ slug: 'tieng-anh' });
    programmingSubject = await Taxonomy.findOne({ slug: 'lap-trinh' });
    ieltsTopic = await Taxonomy.findOne({ slug: 'luyen-thi-ielts' });
    purposePrep = await Taxonomy.findOne({ slug: 'certificate-prep' });
    levelBeginner = await Taxonomy.findOne({ slug: 'beginner' });
    levelAdvanced = await Taxonomy.findOne({ slug: 'advanced' });
    methodTheoryPractice = await Taxonomy.findOne({ slug: 'theory-practice' });
    stylePatient = await Taxonomy.findOne({ slug: 'patient' });
    styleFriendly = await Taxonomy.findOne({ slug: 'friendly' });
    styleDisciplined = await Taxonomy.findOne({ slug: 'disciplined' });
    styleCreative = await Taxonomy.findOne({ slug: 'creative' });
    materialSlide = await Taxonomy.findOne({ slug: 'slides' });
    interactionFrequent = await Taxonomy.findOne({ slug: 'frequent-qa' });
    timeBandMorning = await Taxonomy.findOne({ slug: 'morning' });
    modeOnline = await Taxonomy.findOne({ slug: 'online' });
    modeOffline = await Taxonomy.findOne({ slug: 'offline' });
    offlineHome = await Taxonomy.findOne({ slug: 'tutor-home' });
    approachSimplify = await Taxonomy.findOne({ slug: 'simplify-explanation' });
    supportExercises = await Taxonomy.findOne({ slug: 'correct-homework' });
    trackingWeekly = await Taxonomy.findOne({ slug: 'weekly' });

    // Create test learner
    await User.create({
      name: 'Test Learner User',
      email: 'learner@test-phase4-tutor.com',
      passwordHash: await User.hashPassword('Learner123'),
      role: ROLES.LEARNER,
    });

    // Create test tutor
    tutorUser = await User.create({
      name: 'Nguyen Van Tutor',
      email: 'tutor@test-phase4-tutor.com',
      passwordHash: await User.hashPassword('Tutor123'),
      role: ROLES.TUTOR,
      phone: '0912345678',
    });

    // Login Learner
    const learnerLogin = await request(app).post('/api/auth/login').send({
      email: 'learner@test-phase4-tutor.com',
      password: 'Learner123',
    });
    learnerToken = learnerLogin.body.data.accessToken;

    // Login Tutor
    const tutorLogin = await request(app).post('/api/auth/login').send({
      email: 'tutor@test-phase4-tutor.com',
      password: 'Tutor123',
    });
    tutorToken = tutorLogin.body.data.accessToken;
  }, 25000);

  afterAll(async () => {
    await User.deleteMany({ email: { $regex: /@test-phase4-tutor\.com$/i } });
    await TutorProfile.deleteMany({});
    await disconnectDB();
  }, 20000);

  describe('RBAC & Access Control', () => {
    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/tutors/profile/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject learner user trying to access tutor profile with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/tutors/profile/me')
        .set('Authorization', `Bearer ${learnerToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow tutor user to access their own profile', async () => {
      const res = await request(app)
        .get('/api/tutors/profile/me')
        .set('Authorization', `Bearer ${tutorToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile).toBeDefined();
      expect(res.body.data.profile.completionStatus).toBe(COMPLETION_STATUS.NOT_STARTED);
      expect(res.body.data.profile.approvalStatus).toBe(APPROVAL_STATUS.PENDING);
    });
  });

  describe('PUT /api/tutors/profile/me (Draft Save & Anti-tampering)', () => {
    it('should save draft and prevent client from self-approving or self-verifying certificates', async () => {
      const maliciousPayload = {
        expertise: {
          categoryId: foreignCategory._id,
        },
        teachingConditions: {
          priceRangeId: '200k_300k',
        },
        // Malicious client fields that should be sanitized / stripped
        approvalStatus: 'approved',
        ratingSummary: { averageRating: 5.0, reviewCount: 100 },
        qualifications: [
          {
            title: 'Chứng chỉ IELTS 8.5',
            issuer: 'IDP Education',
            verified: true, // Should be forced to false!
          },
        ],
        introduction: 'Gia sư giàu kinh nghiệm luyện thi IELTS',
      };

      const res = await request(app)
        .put('/api/tutors/profile/me')
        .set('Authorization', `Bearer ${tutorToken}`)
        .send(maliciousPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const prof = res.body.data.profile;

      // Status should remain pending, NOT approved
      expect(prof.approvalStatus).toBe(APPROVAL_STATUS.PENDING);
      expect(prof.completionStatus).toBe(COMPLETION_STATUS.IN_PROGRESS);

      // Rating summary should not be altered by client
      expect(prof.ratingSummary.averageRating).toBeNull();
      expect(prof.ratingSummary.reviewCount).toBe(0);

      // Qualification verified flag must be false
      expect(prof.qualifications[0].verified).toBe(false);
      expect(prof.qualifications[0].title).toBe('Chứng chỉ IELTS 8.5');

      // Price preset normalized
      expect(prof.teachingConditions.priceMin).toBe(200000);
      expect(prof.teachingConditions.priceMax).toBe(300000);
    });

    it('should reject draft update when styles exceeds 3 selections', async () => {
      const payload = {
        teachingCapabilities: {
          styles: [stylePatient._id, styleFriendly._id, styleDisciplined._id, styleCreative._id],
        },
      };

      const res = await request(app)
        .put('/api/tutors/profile/me')
        .set('Authorization', `Bearer ${tutorToken}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some((e) => e.field === 'teachingCapabilities.styles')).toBe(true);
    });
  });

  describe('POST /api/tutors/profile/submit (Submission & Validation)', () => {
    it('should reject submission if mandatory questions are missing', async () => {
      const incompletePayload = {
        expertise: {
          categoryId: foreignCategory._id,
        },
      };

      const res = await request(app)
        .post('/api/tutors/profile/submit')
        .set('Authorization', `Bearer ${tutorToken}`)
        .send(incompletePayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it('should reject submission if Offline is selected but offlineLocations is empty', async () => {
      const payloadOfflineMissingLocation = {
        expertise: {
          categoryId: foreignCategory._id,
          subjectIds: [englishSubject._id],
          topicIds: [ieltsTopic._id],
        },
        teachingCapabilities: {
          supportedPurposes: [purposePrep._id],
          teachableLevels: [levelBeginner._id],
          supportedTargetLevels: [levelAdvanced._id],
          supportedGoalTags: ['certificate', 'fluent_communication'],
          estimatedDurationRanges: ['3_6_months'],
          methods: [methodTheoryPractice._id],
          pace: 'flexible',
          classFormats: ['one_to_one'],
          styles: [stylePatient._id, styleFriendly._id],
          materials: [materialSlide._id],
          interactionLevel: interactionFrequent._id,
        },
        schedulePreferences: {
          timeBands: [timeBandMorning._id],
          weekdays: [1, 3, 5],
          maxSessionsPerWeek: '5_6',
          sessionDurationsMinutes: [90],
        },
        teachingConditions: {
          modes: [modeOffline._id], // Offline selected!
          offlineLocations: [], // Empty! Should trigger error
          priceRangeId: '200k_300k',
        },
        experienceRange: '3_5_years',
        supportApproaches: [approachSimplify._id],
        availableSupport: [supportExercises._id],
        assessmentMethods: [trackingWeekly._id],
      };

      const res = await request(app)
        .post('/api/tutors/profile/submit')
        .set('Authorization', `Bearer ${tutorToken}`)
        .send(payloadOfflineMissingLocation);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some((e) => e.field === 'teachingConditions.offlineLocations')).toBe(
        true
      );
    });

    it('should reject submission when Subject does not belong to Category (Q1 -> Q2 mismatch)', async () => {
      const mismatchedPayload = {
        expertise: {
          categoryId: foreignCategory._id, // Ngoại ngữ
          subjectIds: [programmingSubject._id], // Lập trình (belongs to Công nghệ!)
          topicIds: [ieltsTopic._id],
        },
        teachingCapabilities: {
          supportedPurposes: [purposePrep._id],
          teachableLevels: [levelBeginner._id],
          supportedTargetLevels: [levelAdvanced._id],
          supportedGoalTags: ['certificate'],
          estimatedDurationRanges: ['3_6_months'],
          methods: [methodTheoryPractice._id],
          pace: 'flexible',
          classFormats: ['one_to_one'],
          styles: [stylePatient._id],
          materials: [materialSlide._id],
          interactionLevel: interactionFrequent._id,
        },
        schedulePreferences: {
          timeBands: [timeBandMorning._id],
          weekdays: [1, 3, 5],
          maxSessionsPerWeek: '5_6',
          sessionDurationsMinutes: [90],
        },
        teachingConditions: {
          modes: [modeOnline._id],
          priceRangeId: '200k_300k',
        },
        experienceRange: '3_5_years',
        supportApproaches: [approachSimplify._id],
        availableSupport: [supportExercises._id],
        assessmentMethods: [trackingWeekly._id],
      };

      const res = await request(app)
        .post('/api/tutors/profile/submit')
        .set('Authorization', `Bearer ${tutorToken}`)
        .send(mismatchedPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some((e) => e.field === 'expertise.subjectIds')).toBe(true);
    });

    it('should successfully submit profile for approval when all mandatory fields are valid', async () => {
      const validPayload = {
        expertise: {
          categoryId: foreignCategory._id,
          subjectIds: [englishSubject._id],
          topicIds: [ieltsTopic._id],
        },
        teachingCapabilities: {
          supportedPurposes: [purposePrep._id],
          teachableLevels: [levelBeginner._id],
          supportedTargetLevels: [levelAdvanced._id],
          supportedGoalTags: ['certificate', 'fluent_communication'],
          estimatedDurationRanges: ['3_6_months', '6_12_months'],
          methods: [methodTheoryPractice._id],
          pace: 'flexible',
          classFormats: ['one_to_one', 'small_group'],
          styles: [stylePatient._id, styleFriendly._id],
          materials: [materialSlide._id],
          interactionLevel: interactionFrequent._id,
        },
        schedulePreferences: {
          timeBands: [timeBandMorning._id],
          weekdays: [1, 3, 5],
          maxSessionsPerWeek: '5_6',
          sessionDurationsMinutes: [60, 90],
        },
        teachingConditions: {
          modes: [modeOnline._id, modeOffline._id],
          offlineLocations: [offlineHome._id],
          serviceAreas: ['Cầu Giấy, Hà Nội'],
          travelRadiusKm: 5,
          priceRangeId: '200k_300k',
        },
        experienceRange: '3_5_years',
        experienceYears: 4,
        qualifications: [
          {
            title: 'IELTS Academic 8.0',
            issuer: 'British Council',
            issueYear: 2023,
          },
        ],
        supportApproaches: [approachSimplify._id],
        availableSupport: [supportExercises._id],
        assessmentMethods: [trackingWeekly._id],
        introduction: 'Giáo viên chuyên luyện thi IELTS Speaking và Writing.',
      };

      const res = await request(app)
        .post('/api/tutors/profile/submit')
        .set('Authorization', `Bearer ${tutorToken}`)
        .send(validPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const prof = res.body.data.profile;
      expect(prof.completionStatus).toBe(COMPLETION_STATUS.COMPLETED);
      expect(prof.approvalStatus).toBe(APPROVAL_STATUS.PENDING);
      expect(prof.submittedAt).toBeDefined();
      expect(prof.completedAt).toBeDefined();
      expect(prof.expertise.categoryId.name).toBe('Ngoại ngữ');
      expect(prof.expertise.subjectIds[0].name).toBe('Tiếng Anh');
      expect(prof.expertise.topicIds[0].name).toBe('Luyện thi IELTS');
    });
  });

  describe('GET /api/tutors/:id (Public Profile View & Data Masking)', () => {
    it('should return 404 when profile is still pending approval', async () => {
      const res = await request(app).get(`/api/tutors/${tutorUser._id}`);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return sanitized profile when profile is approved (masking phone number and rejection details)', async () => {
      // Simulate admin approving tutor profile
      await TutorProfile.findOneAndUpdate(
        { userId: tutorUser._id },
        { approvalStatus: APPROVAL_STATUS.APPROVED, approvedAt: new Date() }
      );

      const res = await request(app).get(`/api/tutors/${tutorUser._id}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const pubProfile = res.body.data.profile;
      expect(pubProfile.userId.name).toBe('Nguyen Van Tutor');
      expect(pubProfile.userId.phone).toBeUndefined(); // Phone stripped for privacy
      expect(pubProfile.approvalStatus).toBe(APPROVAL_STATUS.APPROVED);
      expect(pubProfile.rejectionReason).toBeUndefined();
    });
  });
});
