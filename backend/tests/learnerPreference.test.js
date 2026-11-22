const request = require('supertest');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/user.model');
const Taxonomy = require('../src/models/taxonomy.model');
const LearnerPreference = require('../src/models/learnerPreference.model');
const { ROLES } = require('../src/constants/roles');
const { COMPLETION_STATUS } = require('../src/constants/profileStatus');
const { seedTaxonomies } = require('../src/seeds/taxonomy.seed');

describe('Learner Preference & Onboarding Module (Phase 4)', () => {
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
  let priorityExpertise = null;
  let difficultyTheory = null;
  let supportExercises = null;
  let trackingWeekly = null;

  beforeAll(async () => {
    await connectDB();

    // Clean up test users and preferences
    await User.deleteMany({ email: { $regex: /@test-phase4-learner\.com$/i } });
    await LearnerPreference.deleteMany({});

    // Seed base taxonomies
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
    priorityExpertise = await Taxonomy.findOne({ slug: 'tutor-expertise' });
    difficultyTheory = await Taxonomy.findOne({ slug: 'theory-confusion' });
    supportExercises = await Taxonomy.findOne({ slug: 'correct-homework' });
    trackingWeekly = await Taxonomy.findOne({ slug: 'weekly' });

    // Create test learner
    await User.create({
      name: 'Nguyen Learner',
      email: 'learner@test-phase4-learner.com',
      passwordHash: await User.hashPassword('Learner123'),
      role: ROLES.LEARNER,
    });

    // Create test tutor
    await User.create({
      name: 'Tran Tutor',
      email: 'tutor@test-phase4-learner.com',
      passwordHash: await User.hashPassword('Tutor123'),
      role: ROLES.TUTOR,
    });

    // Login Learner
    const learnerLogin = await request(app).post('/api/auth/login').send({
      email: 'learner@test-phase4-learner.com',
      password: 'Learner123',
    });
    learnerToken = learnerLogin.body.data.accessToken;

    // Login Tutor
    const tutorLogin = await request(app).post('/api/auth/login').send({
      email: 'tutor@test-phase4-learner.com',
      password: 'Tutor123',
    });
    tutorToken = tutorLogin.body.data.accessToken;
  }, 25000);

  afterAll(async () => {
    await User.deleteMany({ email: { $regex: /@test-phase4-learner\.com$/i } });
    await LearnerPreference.deleteMany({});
    await disconnectDB();
  }, 20000);

  describe('RBAC & Access Control', () => {
    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/learners/preferences/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject tutor user trying to access learner preferences with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/learners/preferences/me')
        .set('Authorization', `Bearer ${tutorToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow learner user to access learner preferences', async () => {
      const res = await request(app)
        .get('/api/learners/preferences/me')
        .set('Authorization', `Bearer ${learnerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.preference).toBeDefined();
      expect(res.body.data.preference.completionStatus).toBe(COMPLETION_STATUS.NOT_STARTED);
    });
  });

  describe('PUT /api/learners/preferences/me (Draft Save & Partial Updates)', () => {
    it('should successfully save draft preference and update completionStatus to in_progress', async () => {
      const payload = {
        learning: {
          categoryId: foreignCategory._id,
          goalText: 'Mục tiêu đạt IELTS 6.5 trong 6 tháng',
          targetDuration: '6_12_months',
        },
        constraints: {
          budgetRangeId: '100k_200k',
        },
        additionalNote: 'Cần gia sư kiên nhẫn',
      };

      const res = await request(app)
        .put('/api/learners/preferences/me')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const pref = res.body.data.preference;
      expect(pref.completionStatus).toBe(COMPLETION_STATUS.IN_PROGRESS);
      expect(pref.learning.goalText).toBe('Mục tiêu đạt IELTS 6.5 trong 6 tháng');
      expect(pref.constraints.budgetMin).toBe(100000);
      expect(pref.constraints.budgetMax).toBe(200000);
      expect(pref.additionalNote).toBe('Cần gia sư kiên nhẫn');
    });

    it('should reject invalid ObjectId format in draft update', async () => {
      const payload = {
        learning: {
          categoryId: 'invalid-object-id',
        },
      };

      const res = await request(app)
        .put('/api/learners/preferences/me')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject draft update when preferredTutorStyles exceeds 3 selections', async () => {
      const payload = {
        learningStyle: {
          preferredTutorStyles: [
            stylePatient._id,
            styleFriendly._id,
            styleDisciplined._id,
            styleCreative._id, // 4 items (exceeds limit 3)
          ],
        },
      };

      const res = await request(app)
        .put('/api/learners/preferences/me')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some((e) => e.field === 'learningStyle.preferredTutorStyles')).toBe(
        true
      );
    });

    it('should reject draft update with invalid weekday (out of range 0-6)', async () => {
      const payload = {
        schedulePreferences: {
          weekdays: [1, 3, 7], // 7 is invalid
        },
      };

      const res = await request(app)
        .patch('/api/learners/preferences/me')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/learners/preferences/complete (Onboarding Completion & Hierarchy)', () => {
    it('should reject submission if required questions are missing', async () => {
      const incompletePayload = {
        learning: {
          categoryId: foreignCategory._id,
          // Missing subjectIds, topicIds, etc.
        },
      };

      const res = await request(app)
        .post('/api/learners/preferences/complete')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send(incompletePayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it('should reject submission if Offline mode is selected but offlineLocations is empty', async () => {
      const payloadWithOfflineNoLocation = {
        learning: {
          categoryId: foreignCategory._id,
          subjectIds: [englishSubject._id],
          topicIds: [ieltsTopic._id],
          purposes: [purposePrep._id],
          currentLevel: levelBeginner._id,
          targetLevel: levelAdvanced._id,
          targetDuration: '6_12_months',
        },
        learningStyle: {
          methods: [methodTheoryPractice._id],
          pace: 'moderate',
          classFormat: 'one_to_one',
          preferredTutorStyles: [stylePatient._id, styleFriendly._id],
          materials: [materialSlide._id],
          interactionLevel: interactionFrequent._id,
        },
        schedulePreferences: {
          timeBands: [timeBandMorning._id],
          weekdays: [1, 3, 5],
          sessionsPerWeek: 3,
          durationMinutes: [90],
        },
        constraints: {
          modes: [modeOffline._id], // Offline selected!
          offlineLocations: [], // Empty! Should fail conditional requirement Q20
          budgetRangeId: '100k_200k',
        },
        tutorRequirements: {
          selectionPriorities: [priorityExpertise ? priorityExpertise._id : stylePatient._id],
          experienceRange: '3_5_years',
          certificateRequirement: 'required',
        },
        supportNeeds: {
          difficulties: [difficultyTheory._id],
          desiredSupport: [supportExercises._id],
          progressTracking: trackingWeekly._id,
        },
      };

      const res = await request(app)
        .post('/api/learners/preferences/complete')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send(payloadWithOfflineNoLocation);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some((e) => e.field === 'constraints.offlineLocations')).toBe(true);
    });

    it('should reject submission when Subject does not belong to Category (Q1 -> Q2 mismatch)', async () => {
      const mismatchedHierarchyPayload = {
        learning: {
          categoryId: foreignCategory._id, // Ngoại ngữ
          subjectIds: [programmingSubject._id], // Lập trình (belongs to Công nghệ, NOT Ngoại ngữ!)
          topicIds: [ieltsTopic._id],
          purposes: [purposePrep._id],
          currentLevel: levelBeginner._id,
          targetLevel: levelAdvanced._id,
          targetDuration: '6_12_months',
        },
        learningStyle: {
          methods: [methodTheoryPractice._id],
          pace: 'moderate',
          classFormat: 'one_to_one',
          preferredTutorStyles: [stylePatient._id, styleFriendly._id],
          materials: [materialSlide._id],
          interactionLevel: interactionFrequent._id,
        },
        schedulePreferences: {
          timeBands: [timeBandMorning._id],
          weekdays: [1, 3, 5],
          sessionsPerWeek: 3,
          durationMinutes: [90],
        },
        constraints: {
          modes: [modeOnline._id],
          budgetRangeId: '100k_200k',
        },
        tutorRequirements: {
          selectionPriorities: [priorityExpertise ? priorityExpertise._id : stylePatient._id],
          experienceRange: '3_5_years',
          certificateRequirement: 'required',
        },
        supportNeeds: {
          difficulties: [difficultyTheory._id],
          desiredSupport: [supportExercises._id],
          progressTracking: trackingWeekly._id,
        },
      };

      const res = await request(app)
        .post('/api/learners/preferences/complete')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send(mismatchedHierarchyPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some((e) => e.field === 'learning.subjectIds')).toBe(true);
    });

    it('should successfully complete onboarding when all questions are valid and properly hierarchical', async () => {
      const validPayload = {
        learning: {
          categoryId: foreignCategory._id,
          subjectIds: [englishSubject._id],
          topicIds: [ieltsTopic._id],
          purposes: [purposePrep._id],
          currentLevel: levelBeginner._id,
          targetLevel: levelAdvanced._id,
          targetDuration: '6_12_months',
          goalText: 'IELTS 6.5 du học',
        },
        learningStyle: {
          methods: [methodTheoryPractice._id],
          pace: 'moderate',
          classFormat: 'one_to_one',
          preferredTutorStyles: [stylePatient._id, styleFriendly._id],
          materials: [materialSlide._id],
          interactionLevel: interactionFrequent._id,
        },
        schedulePreferences: {
          timeBands: [timeBandMorning._id],
          weekdays: [1, 3, 5],
          sessionsPerWeek: 3,
          durationMinutes: [90],
        },
        constraints: {
          modes: [modeOnline._id, modeOffline._id],
          offlineLocations: [offlineHome._id],
          budgetRangeId: '100k_200k',
        },
        tutorRequirements: {
          selectionPriorities: [priorityExpertise ? priorityExpertise._id : stylePatient._id],
          experienceRange: '3_5_years',
          certificateRequirement: 'preferred',
        },
        supportNeeds: {
          difficulties: [difficultyTheory._id],
          desiredSupport: [supportExercises._id],
          progressTracking: trackingWeekly._id,
        },
        additionalNote: 'Muốn học tập trung vào Speaking và Writing',
      };

      const res = await request(app)
        .post('/api/learners/preferences/complete')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send(validPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const pref = res.body.data.preference;
      expect(pref.completionStatus).toBe(COMPLETION_STATUS.COMPLETED);
      expect(pref.completedAt).toBeDefined();
      expect(pref.learning.categoryId.name).toBe('Ngoại ngữ');
      expect(pref.learning.subjectIds[0].name).toBe('Tiếng Anh');
      expect(pref.learning.topicIds[0].name).toBe('Luyện thi IELTS');
    });
  });
});
