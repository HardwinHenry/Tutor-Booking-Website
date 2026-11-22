const request = require('supertest');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/user.model');
const TutorProfile = require('../src/models/tutorProfile.model');
const AvailabilitySlot = require('../src/models/availabilitySlot.model');
const { ROLES } = require('../src/constants/roles');
const { APPROVAL_STATUS, COMPLETION_STATUS } = require('../src/constants/profileStatus');
const { SLOT_STATUS } = require('../src/constants/availabilityStatus');

describe('Phase 7: Availability CRUD & Availability Checking Module', () => {
  let approvedTutor = null;
  let approvedTutorToken = '';
  let pendingTutor = null;
  let pendingTutorToken = '';
  let otherTutor = null;
  let otherTutorToken = '';
  let learnerUser = null;
  let learnerToken = '';
  let adminUser = null;
  let adminToken = '';

  beforeAll(async () => {
    await connectDB();

    // Clean up test data
    await User.deleteMany({ email: { $regex: /@test-phase7-avail\.com$/i } });
    await AvailabilitySlot.deleteMany({});
    await TutorProfile.deleteMany({
      introduction: { $regex: /test-phase7/i },
    });

    // 1. Create Learner
    const learnerRes = await request(app).post('/api/auth/register').send({
      name: 'Learner Phase 7',
      email: 'learner@test-phase7-avail.com',
      password: 'password123',
      role: ROLES.LEARNER,
    });
    learnerUser = learnerRes.body.data.user;
    learnerToken = learnerRes.body.data.accessToken;

    // 2. Create Approved Tutor
    const approvedTutorRes = await request(app).post('/api/auth/register').send({
      name: 'Approved Tutor Phase 7',
      email: 'approved_tutor@test-phase7-avail.com',
      password: 'password123',
      role: ROLES.TUTOR,
    });
    approvedTutor = approvedTutorRes.body.data.user;
    approvedTutorToken = approvedTutorRes.body.data.accessToken;

    await TutorProfile.create({
      userId: approvedTutor._id,
      headline: 'Gia sư Tiếng Anh IELTS 8.5',
      introduction: 'Test-phase7 profile approved',
      completionStatus: COMPLETION_STATUS.COMPLETED,
      approvalStatus: APPROVAL_STATUS.APPROVED,
      completedAt: new Date(),
      approvedAt: new Date(),
    });

    // 3. Create Pending Tutor (Not yet approved)
    const pendingTutorRes = await request(app).post('/api/auth/register').send({
      name: 'Pending Tutor Phase 7',
      email: 'pending_tutor@test-phase7-avail.com',
      password: 'password123',
      role: ROLES.TUTOR,
    });
    pendingTutor = pendingTutorRes.body.data.user;
    pendingTutorToken = pendingTutorRes.body.data.accessToken;

    await TutorProfile.create({
      userId: pendingTutor._id,
      headline: 'Gia sư Toán chờ duyệt',
      introduction: 'Test-phase7 profile pending',
      completionStatus: COMPLETION_STATUS.COMPLETED,
      approvalStatus: APPROVAL_STATUS.PENDING,
    });

    // 4. Create Other Approved Tutor
    const otherTutorRes = await request(app).post('/api/auth/register').send({
      name: 'Other Tutor Phase 7',
      email: 'other_tutor@test-phase7-avail.com',
      password: 'password123',
      role: ROLES.TUTOR,
    });
    otherTutor = otherTutorRes.body.data.user;
    otherTutorToken = otherTutorRes.body.data.accessToken;

    await TutorProfile.create({
      userId: otherTutor._id,
      headline: 'Gia sư Lập trình',
      introduction: 'Test-phase7 profile other',
      completionStatus: COMPLETION_STATUS.COMPLETED,
      approvalStatus: APPROVAL_STATUS.APPROVED,
      completedAt: new Date(),
      approvedAt: new Date(),
    });

    // 5. Create Admin
    const adminRes = await request(app).post('/api/auth/register').send({
      name: 'Admin Phase 7',
      email: 'admin@test-phase7-avail.com',
      password: 'password123',
      role: ROLES.LEARNER,
    });
    adminUser = adminRes.body.data.user;
    await User.findByIdAndUpdate(adminUser._id, { role: ROLES.ADMIN });
    const adminLoginRes = await request(app).post('/api/auth/login').send({
      email: 'admin@test-phase7-avail.com',
      password: 'password123',
    });
    adminToken = adminLoginRes.body.data.accessToken;
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $regex: /@test-phase7-avail\.com$/i } });
    await AvailabilitySlot.deleteMany({});
    await TutorProfile.deleteMany({
      introduction: { $regex: /test-phase7/i },
    });
    await disconnectDB();
  });

  describe('1. Authentication, Authorization & Tutor Eligibility', () => {
    it('should reject unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/availability')
        .send({
          startAt: new Date(Date.now() + 86400000).toISOString(),
          endAt: new Date(Date.now() + 90000000).toISOString(),
        });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject learner request with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/availability')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({
          startAt: new Date(Date.now() + 86400000).toISOString(),
          endAt: new Date(Date.now() + 90000000).toISOString(),
        });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should reject tutor with unapproved profile (pending) with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/availability')
        .set('Authorization', `Bearer ${pendingTutorToken}`)
        .send({
          startAt: new Date(Date.now() + 86400000).toISOString(),
          endAt: new Date(Date.now() + 90000000).toISOString(),
        });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/phê duyệt|approved/i);
    });
  });

  describe('2. Input Validation (startAt, endAt, timezone, duration)', () => {
    it('should reject unwhitelisted fields with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/availability')
        .set('Authorization', `Bearer ${approvedTutorToken}`)
        .send({
          startAt: new Date(Date.now() + 86400000).toISOString(),
          endAt: new Date(Date.now() + 90000000).toISOString(),
          hackerField: 'injection',
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject when startAt or endAt is missing', async () => {
      const res = await request(app)
        .post('/api/availability')
        .set('Authorization', `Bearer ${approvedTutorToken}`)
        .send({
          startAt: new Date(Date.now() + 86400000).toISOString(),
        });
      expect(res.status).toBe(400);
      expect(res.body.errors.some((e) => e.field === 'endAt')).toBe(true);
    });

    it('should reject when startAt is in the past', async () => {
      const res = await request(app)
        .post('/api/availability')
        .set('Authorization', `Bearer ${approvedTutorToken}`)
        .send({
          startAt: new Date(Date.now() - 3600000).toISOString(),
          endAt: new Date(Date.now() + 3600000).toISOString(),
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/quá khứ/i);
    });

    it('should reject when startAt >= endAt', async () => {
      const nowMs = Date.now() + 86400000;
      const res = await request(app)
        .post('/api/availability')
        .set('Authorization', `Bearer ${approvedTutorToken}`)
        .send({
          startAt: new Date(nowMs + 3600000).toISOString(),
          endAt: new Date(nowMs).toISOString(),
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/startAt < endAt|sau thời gian bắt đầu/i);
    });

    it('should reject when duration is less than 15 minutes', async () => {
      const nowMs = Date.now() + 86400000;
      const res = await request(app)
        .post('/api/availability')
        .set('Authorization', `Bearer ${approvedTutorToken}`)
        .send({
          startAt: new Date(nowMs).toISOString(),
          endAt: new Date(nowMs + 10 * 60000).toISOString(), // 10 mins
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/15 phút/i);
    });

    it('should reject invalid timezone string', async () => {
      const nowMs = Date.now() + 86400000;
      const res = await request(app)
        .post('/api/availability')
        .set('Authorization', `Bearer ${approvedTutorToken}`)
        .send({
          startAt: new Date(nowMs).toISOString(),
          endAt: new Date(nowMs + 3600000).toISOString(),
          timezone: 'Mars/Phobos_Invalid',
        });
      expect(res.status).toBe(400);
      expect(res.body.errors.some((e) => e.field === 'timezone')).toBe(true);
    });
  });

  describe('3. Slot Creation & Overlap Prevention', () => {
    let createdSlot1 = null;

    it('should successfully create a single available slot with valid data', async () => {
      const start = new Date(Date.now() + 86400000); // +1 day
      start.setMinutes(0, 0, 0);
      const end = new Date(start.getTime() + 2 * 3600000); // 2 hours

      const res = await request(app)
        .post('/api/availability')
        .set('Authorization', `Bearer ${approvedTutorToken}`)
        .send({
          startAt: start.toISOString(),
          endAt: end.toISOString(),
          timezone: 'Asia/Ho_Chi_Minh',
          note: 'Lịch dạy sáng thứ Bảy',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slot).toBeDefined();
      expect(res.body.data.slot.status).toBe(SLOT_STATUS.AVAILABLE);
      expect(res.body.data.slot.durationMinutes).toBe(120);
      expect(res.body.data.slot.tutorId.toString()).toBe(approvedTutor._id.toString());

      createdSlot1 = res.body.data.slot;
    });

    it('should reject creating a slot that overlaps with existing slot of the same tutor', async () => {
      // createdSlot1 is [start, start + 2h]
      // Try creating overlapping slot: [start + 1h, start + 3h]
      const startMs = new Date(createdSlot1.startAt).getTime();
      const overlapStart = new Date(startMs + 3600000);
      const overlapEnd = new Date(startMs + 3 * 3600000);

      const res = await request(app)
        .post('/api/availability')
        .set('Authorization', `Bearer ${approvedTutorToken}`)
        .send({
          startAt: overlapStart.toISOString(),
          endAt: overlapEnd.toISOString(),
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/trùng lặp|trùng lấn/i);
    });

    it('should reject creating a slot that completely encloses an existing slot', async () => {
      // createdSlot1 is [start, start + 2h]
      // Try creating slot: [start - 30m, start + 2h30m]
      const startMs = new Date(createdSlot1.startAt).getTime();
      const endMs = new Date(createdSlot1.endAt).getTime();

      const res = await request(app)
        .post('/api/availability')
        .set('Authorization', `Bearer ${approvedTutorToken}`)
        .send({
          startAt: new Date(startMs - 1800000).toISOString(),
          endAt: new Date(endMs + 1800000).toISOString(),
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/trùng lặp|trùng lấn/i);
    });

    it('should allow adjacent slots (where slot1.endAt === slot2.startAt)', async () => {
      // Immediately after createdSlot1
      const start = new Date(createdSlot1.endAt);
      const end = new Date(start.getTime() + 3600000); // 1 hour

      const res = await request(app)
        .post('/api/availability')
        .set('Authorization', `Bearer ${approvedTutorToken}`)
        .send({
          startAt: start.toISOString(),
          endAt: end.toISOString(),
          note: 'Slot liền kề',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slot.durationMinutes).toBe(60);
    });

    it('should allow another tutor to create a slot at the exact same time', async () => {
      // Other tutor creates slot at the exact same time as createdSlot1
      const res = await request(app)
        .post('/api/availability')
        .set('Authorization', `Bearer ${otherTutorToken}`)
        .send({
          startAt: createdSlot1.startAt,
          endAt: createdSlot1.endAt,
          note: 'Slot của gia sư khác',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slot.tutorId.toString()).toBe(otherTutor._id.toString());
    });

    it('should support batch slot creation and validate batch cleanly', async () => {
      const baseMs = Date.now() + 2 * 86400000; // +2 days
      const slots = [
        {
          startAt: new Date(baseMs).toISOString(),
          endAt: new Date(baseMs + 3600000).toISOString(),
          note: 'Batch slot 1',
        },
        {
          startAt: new Date(baseMs + 7200000).toISOString(),
          endAt: new Date(baseMs + 10800000).toISOString(),
          note: 'Batch slot 2',
        },
      ];

      const res = await request(app)
        .post('/api/availability')
        .set('Authorization', `Bearer ${approvedTutorToken}`)
        .send({ slots });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slots).toHaveLength(2);
    });

    it('should reject batch creation if slots within the batch overlap', async () => {
      const baseMs = Date.now() + 3 * 86400000; // +3 days
      const slots = [
        {
          startAt: new Date(baseMs).toISOString(),
          endAt: new Date(baseMs + 7200000).toISOString(), // 2 hours
        },
        {
          startAt: new Date(baseMs + 3600000).toISOString(), // Overlaps!
          endAt: new Date(baseMs + 10800000).toISOString(),
        },
      ];

      const res = await request(app)
        .post('/api/availability')
        .set('Authorization', `Bearer ${approvedTutorToken}`)
        .send({ slots });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/trùng lặp/i);
    });
  });

  describe('4. Tutor View My Slots (GET /api/availability/mine)', () => {
    it('should return tutor slots with pagination and ascending sort', async () => {
      const res = await request(app)
        .get('/api/availability/mine?limit=10')
        .set('Authorization', `Bearer ${approvedTutorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThan(0);
      expect(res.body.data.pagination).toBeDefined();

      // Verify ascending order
      for (let i = 1; i < res.body.data.items.length; i++) {
        const prev = new Date(res.body.data.items[i - 1].startAt).getTime();
        const curr = new Date(res.body.data.items[i].startAt).getTime();
        expect(curr).toBeGreaterThanOrEqual(prev);
      }
    });

    it('should filter my slots by status', async () => {
      const res = await request(app)
        .get('/api/availability/mine?status=available')
        .set('Authorization', `Bearer ${approvedTutorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.every((s) => s.status === SLOT_STATUS.AVAILABLE)).toBe(true);
    });

    it('should filter my slots by date range from and to', async () => {
      const from = new Date(Date.now() + 86400000).toISOString();
      const to = new Date(Date.now() + 4 * 86400000).toISOString();

      const res = await request(app)
        .get(`/api/availability/mine?from=${from}&to=${to}`)
        .set('Authorization', `Bearer ${approvedTutorToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });

    it('should reject invalid query filter', async () => {
      const res = await request(app)
        .get('/api/availability/mine?status=invalid_status')
        .set('Authorization', `Bearer ${approvedTutorToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('5. Update Slot (PATCH /api/availability/:id)', () => {
    let testSlot = null;

    beforeEach(async () => {
      const start = new Date(Date.now() + 5 * 86400000);
      const end = new Date(start.getTime() + 3600000);
      testSlot = await AvailabilitySlot.create({
        tutorId: approvedTutor._id,
        startAt: start,
        endAt: end,
        status: SLOT_STATUS.AVAILABLE,
        note: 'Before update',
      });
    });

    it('should successfully update note and status to closed', async () => {
      const res = await request(app)
        .patch(`/api/availability/${testSlot._id}`)
        .set('Authorization', `Bearer ${approvedTutorToken}`)
        .send({
          note: 'Cập nhật ghi chú mới',
          status: SLOT_STATUS.CLOSED,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.slot.note).toBe('Cập nhật ghi chú mới');
      expect(res.body.data.slot.status).toBe(SLOT_STATUS.CLOSED);
    });

    it('should reject manual update of status to booked', async () => {
      const res = await request(app)
        .patch(`/api/availability/${testSlot._id}`)
        .set('Authorization', `Bearer ${approvedTutorToken}`)
        .send({
          status: SLOT_STATUS.BOOKED,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/booked/i);
    });

    it('should protect booked slots: cannot edit a booked slot', async () => {
      // Mark slot as booked
      testSlot.status = SLOT_STATUS.BOOKED;
      await testSlot.save();

      const res = await request(app)
        .patch(`/api/availability/${testSlot._id}`)
        .set('Authorization', `Bearer ${approvedTutorToken}`)
        .send({
          note: 'Cố ý sửa slot booked',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/booked/i);
    });

    it('should prevent tutor from editing another tutor slot', async () => {
      const res = await request(app)
        .patch(`/api/availability/${testSlot._id}`)
        .set('Authorization', `Bearer ${otherTutorToken}`)
        .send({
          note: 'Hacker sửa slot',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('6. Delete Slot (DELETE /api/availability/:id)', () => {
    let slotToDelete = null;

    beforeEach(async () => {
      const start = new Date(Date.now() + 6 * 86400000);
      const end = new Date(start.getTime() + 3600000);
      slotToDelete = await AvailabilitySlot.create({
        tutorId: approvedTutor._id,
        startAt: start,
        endAt: end,
        status: SLOT_STATUS.AVAILABLE,
      });
    });

    it('should successfully delete an available slot', async () => {
      const res = await request(app)
        .delete(`/api/availability/${slotToDelete._id}`)
        .set('Authorization', `Bearer ${approvedTutorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await AvailabilitySlot.findById(slotToDelete._id);
      expect(check).toBeNull();
    });

    it('should protect booked slots: cannot delete a booked slot', async () => {
      slotToDelete.status = SLOT_STATUS.BOOKED;
      await slotToDelete.save();

      const res = await request(app)
        .delete(`/api/availability/${slotToDelete._id}`)
        .set('Authorization', `Bearer ${approvedTutorToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/booked/i);

      // Verify slot still exists in DB
      const check = await AvailabilitySlot.findById(slotToDelete._id);
      expect(check).not.toBeNull();
    });

    it('should prevent tutor from deleting another tutor slot', async () => {
      const res = await request(app)
        .delete(`/api/availability/${slotToDelete._id}`)
        .set('Authorization', `Bearer ${otherTutorToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('7. Public Tutor Availability Query (GET /api/tutors/:id/availability)', () => {
    beforeAll(async () => {
      // Clear and create a structured set of slots for approvedTutor
      await AvailabilitySlot.deleteMany({ tutorId: approvedTutor._id });

      const day1 = new Date(Date.now() + 86400000);
      day1.setHours(8, 0, 0, 0);

      // 1. Available 60m slot
      await AvailabilitySlot.create({
        tutorId: approvedTutor._id,
        startAt: day1,
        endAt: new Date(day1.getTime() + 3600000), // 60 mins
        status: SLOT_STATUS.AVAILABLE,
      });

      // 2. Available 120m slot
      const day1Slot2 = new Date(day1.getTime() + 4 * 3600000);
      await AvailabilitySlot.create({
        tutorId: approvedTutor._id,
        startAt: day1Slot2,
        endAt: new Date(day1Slot2.getTime() + 7200000), // 120 mins
        status: SLOT_STATUS.AVAILABLE,
      });

      // 3. Booked slot (should NOT be returned in public query)
      const day1Slot3 = new Date(day1.getTime() + 7 * 3600000);
      await AvailabilitySlot.create({
        tutorId: approvedTutor._id,
        startAt: day1Slot3,
        endAt: new Date(day1Slot3.getTime() + 3600000),
        status: SLOT_STATUS.BOOKED,
      });

      // 4. Closed slot (should NOT be returned in public query)
      const day1Slot4 = new Date(day1.getTime() + 9 * 3600000);
      await AvailabilitySlot.create({
        tutorId: approvedTutor._id,
        startAt: day1Slot4,
        endAt: new Date(day1Slot4.getTime() + 3600000),
        status: SLOT_STATUS.CLOSED,
      });

      // 5. Past slot (should NOT be returned)
      const pastStart = new Date(Date.now() - 7200000);
      await AvailabilitySlot.create({
        tutorId: approvedTutor._id,
        startAt: pastStart,
        endAt: new Date(pastStart.getTime() + 3600000),
        status: SLOT_STATUS.AVAILABLE,
      });
    });

    it('should return only available, future slots for approved tutor', async () => {
      const res = await request(app).get(`/api/tutors/${approvedTutor._id}/availability`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tutor).toBeDefined();
      expect(res.body.data.tutor.id.toString()).toBe(approvedTutor._id.toString());
      expect(res.body.data.items).toHaveLength(2);

      // Verify all returned slots are available and in future
      res.body.data.items.forEach((slot) => {
        expect(slot.status).toBe(SLOT_STATUS.AVAILABLE);
        expect(new Date(slot.startAt).getTime()).toBeGreaterThan(Date.now());
      });
    });

    it('should filter slots by minimum duration', async () => {
      // Query duration >= 90 mins (should only match the 120m slot)
      const res = await request(app).get(
        `/api/tutors/${approvedTutor._id}/availability?duration=90`
      );

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      const slot = res.body.data.items[0];
      const dur = (new Date(slot.endAt).getTime() - new Date(slot.startAt).getTime()) / 60000;
      expect(dur).toBeGreaterThanOrEqual(90);
    });

    it('should filter slots by date range from and to', async () => {
      const from = new Date(Date.now() + 86400000).toISOString();
      const to = new Date(Date.now() + 2 * 86400000).toISOString();

      const res = await request(app).get(
        `/api/tutors/${approvedTutor._id}/availability?from=${from}&to=${to}`
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });

    it('should also work via alias GET /api/availability/tutors/:id', async () => {
      const res = await request(app).get(`/api/availability/tutors/${approvedTutor._id}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBe(2);
    });

    it('should reject availability query for tutor with pending profile', async () => {
      const res = await request(app).get(`/api/tutors/${pendingTutor._id}/availability`);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/phê duyệt/i);
    });

    it('should return 404 for non-existent tutor ID', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app).get(`/api/tutors/${fakeId}/availability`);
      expect(res.status).toBe(404);
    });
  });

  describe('8. Atomic Slot Booking & Release Helpers (Phase 8 preparation)', () => {
    let atomicSlot = null;

    beforeEach(async () => {
      const start = new Date(Date.now() + 7 * 86400000);
      const end = new Date(start.getTime() + 3600000);
      atomicSlot = await AvailabilitySlot.create({
        tutorId: approvedTutor._id,
        startAt: start,
        endAt: end,
        status: SLOT_STATUS.AVAILABLE,
      });
    });

    it('should atomically book an available slot', async () => {
      const mockBookingId = '507f1f77bcf86cd799439099';
      const booked = await AvailabilitySlot.atomicBookSlot(atomicSlot._id, mockBookingId);

      expect(booked).not.toBeNull();
      expect(booked.status).toBe(SLOT_STATUS.BOOKED);
      expect(booked.bookingId.toString()).toBe(mockBookingId);

      // Attempting to book again should fail (returns null)
      const secondAttempt = await AvailabilitySlot.atomicBookSlot(
        atomicSlot._id,
        '507f1f77bcf86cd799439088'
      );
      expect(secondAttempt).toBeNull();
    });

    it('should atomically release a booked slot back to available', async () => {
      const mockBookingId = '507f1f77bcf86cd799439099';
      await AvailabilitySlot.atomicBookSlot(atomicSlot._id, mockBookingId);

      const released = await AvailabilitySlot.atomicReleaseSlot(atomicSlot._id, mockBookingId);
      expect(released).not.toBeNull();
      expect(released.status).toBe(SLOT_STATUS.AVAILABLE);
      expect(released.bookingId).toBeNull();
    });
  });
});
