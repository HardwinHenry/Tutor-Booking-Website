const request = require('supertest');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/user.model');
const TutorProfile = require('../src/models/tutorProfile.model');
const AvailabilitySlot = require('../src/models/availabilitySlot.model');
const Booking = require('../src/models/booking.model');
const Review = require('../src/models/review.model');
const { ROLES } = require('../src/constants/roles');
const { USER_STATUS } = require('../src/constants/userStatus');
const { APPROVAL_STATUS, COMPLETION_STATUS } = require('../src/constants/profileStatus');
const { BOOKING_STATUS } = require('../src/constants/bookingStatus');
const { SLOT_STATUS } = require('../src/constants/availabilityStatus');

describe('Phase 10: Review, Rating, Admin Management, Security & Operations', () => {
  let learner1 = null;
  let learner1Token = '';
  let learner2 = null;
  let learner2Token = '';
  let tutor1 = null;
  let tutor1Token = '';
  let tutor2 = null;
  let tutor2Token = '';
  let admin = null;
  let adminToken = '';

  let completedBooking1 = null;
  let completedBooking2 = null;
  let confirmedBooking = null;

  beforeAll(async () => {
    await connectDB();

    // Clean up test collections for phase 10
    await User.deleteMany({ email: { $regex: /@test-phase10\.com$/i } });
    await Review.deleteMany({});
    await Booking.deleteMany({ learnerNote: { $regex: /test-phase10/i } });
    await AvailabilitySlot.deleteMany({});
    await TutorProfile.deleteMany({ introduction: { $regex: /test-phase10/i } });

    // 1. Create Learner 1
    const l1Res = await request(app).post('/api/auth/register').send({
      name: 'Phase10 Learner One',
      email: 'learner1@test-phase10.com',
      password: 'password123',
      role: ROLES.LEARNER,
    });
    learner1 = l1Res.body.data.user;
    learner1Token = l1Res.body.data.accessToken;

    // 2. Create Learner 2
    const l2Res = await request(app).post('/api/auth/register').send({
      name: 'Phase10 Learner Two',
      email: 'learner2@test-phase10.com',
      password: 'password123',
      role: ROLES.LEARNER,
    });
    learner2 = l2Res.body.data.user;
    learner2Token = l2Res.body.data.accessToken;

    // 3. Create Tutor 1
    const t1Res = await request(app).post('/api/auth/register').send({
      name: 'Phase10 Master Tutor',
      email: 'tutor1@test-phase10.com',
      password: 'password123',
      role: ROLES.TUTOR,
    });
    tutor1 = t1Res.body.data.user;
    tutor1Token = t1Res.body.data.accessToken;

    await TutorProfile.create({
      userId: tutor1._id,
      headline: 'Chuyên gia Luyện thi ĐH Toán',
      introduction: 'Test-phase10 tutor 1 profile',
      completionStatus: COMPLETION_STATUS.COMPLETED,
      approvalStatus: APPROVAL_STATUS.APPROVED,
      completedAt: new Date(),
      approvedAt: new Date(),
      ratingSummary: {
        averageRating: null,
        reviewCount: 0,
      },
    });

    // 4. Create Tutor 2
    const t2Res = await request(app).post('/api/auth/register').send({
      name: 'Phase10 Physics Tutor',
      email: 'tutor2@test-phase10.com',
      password: 'password123',
      role: ROLES.TUTOR,
    });
    tutor2 = t2Res.body.data.user;
    tutor2Token = t2Res.body.data.accessToken;

    await TutorProfile.create({
      userId: tutor2._id,
      headline: 'Giáo viên Vật lý THPT',
      introduction: 'Test-phase10 tutor 2 profile',
      completionStatus: COMPLETION_STATUS.COMPLETED,
      approvalStatus: APPROVAL_STATUS.APPROVED,
      completedAt: new Date(),
      approvedAt: new Date(),
    });

    // 5. Create Admin
    const adminUser = await User.create({
      name: 'Phase10 Super Admin',
      email: 'admin@test-phase10.com',
      passwordHash: await User.hashPassword('admin123456'),
      role: ROLES.ADMIN,
      status: USER_STATUS.ACTIVE,
    });
    admin = adminUser.toJSON();

    const adminLoginRes = await request(app).post('/api/auth/login').send({
      email: 'admin@test-phase10.com',
      password: 'admin123456',
    });
    adminToken = adminLoginRes.body.data.accessToken;

    // Create Slots
    const slot1 = await AvailabilitySlot.create({
      tutorId: tutor1._id,
      startAt: new Date(Date.now() - 7200000), // 2 hours ago
      endAt: new Date(Date.now() - 3600000), // 1 hour ago
      durationMinutes: 60,
      status: SLOT_STATUS.BOOKED,
    });

    const slot2 = await AvailabilitySlot.create({
      tutorId: tutor1._id,
      startAt: new Date(Date.now() - 14400000), // 4 hours ago
      endAt: new Date(Date.now() - 10800000), // 3 hours ago
      durationMinutes: 60,
      status: SLOT_STATUS.BOOKED,
    });

    const slot3 = await AvailabilitySlot.create({
      tutorId: tutor1._id,
      startAt: new Date(Date.now() + 3600000),
      endAt: new Date(Date.now() + 7200000),
      durationMinutes: 60,
      status: SLOT_STATUS.BOOKED,
    });

    // Create Bookings
    completedBooking1 = await Booking.create({
      learnerId: learner1._id,
      tutorId: tutor1._id,
      slotId: slot1._id,
      status: BOOKING_STATUS.COMPLETED,
      startAt: slot1.startAt,
      endAt: slot1.endAt,
      durationMinutes: 60,
      price: 300000,
      subjectName: 'Toán Giải tích 12',
      learnerNote: 'test-phase10 booking 1',
    });

    completedBooking2 = await Booking.create({
      learnerId: learner2._id,
      tutorId: tutor1._id,
      slotId: slot2._id,
      status: BOOKING_STATUS.COMPLETED,
      startAt: slot2.startAt,
      endAt: slot2.endAt,
      durationMinutes: 60,
      price: 300000,
      subjectName: 'Hình học không gian',
      learnerNote: 'test-phase10 booking 2',
    });

    confirmedBooking = await Booking.create({
      learnerId: learner1._id,
      tutorId: tutor1._id,
      slotId: slot3._id,
      status: BOOKING_STATUS.CONFIRMED,
      startAt: slot3.startAt,
      endAt: slot3.endAt,
      durationMinutes: 60,
      price: 300000,
      subjectName: 'Toán Hình',
      learnerNote: 'test-phase10 confirmed booking',
    });
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $regex: /@test-phase10\.com$/i } });
    await Review.deleteMany({});
    await Booking.deleteMany({ learnerNote: { $regex: /test-phase10/i } });
    await AvailabilitySlot.deleteMany({});
    await TutorProfile.deleteMany({ introduction: { $regex: /test-phase10/i } });
    await disconnectDB();
  });

  describe('1. Review & Rating System (Learner & Tutor Lifecycle)', () => {
    let createdReviewId = '';

    it('should reject unauthenticated review submission with 401 Unauthorized', async () => {
      const res = await request(app).post('/api/reviews').send({
        bookingId: completedBooking1._id,
        rating: 5,
        comment: 'Tuyệt vời',
      });

      expect(res.status).toBe(401);
    });

    it('should reject review creation by Tutor role with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${tutor1Token}`)
        .send({
          bookingId: completedBooking1._id,
          rating: 5,
          comment: 'Tự đánh giá chính mình',
        });

      expect(res.status).toBe(403);
    });

    it('should reject review creation for non-existent booking with 404 Not Found', async () => {
      const nonExistentId = '666666666666666666666666';
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({
          bookingId: nonExistentId,
          rating: 5,
        });

      expect(res.status).toBe(404);
    });

    it('should reject review creation by a learner who did not attend the booking with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${learner2Token}`)
        .send({
          bookingId: completedBooking1._id, // Belongs to learner1
          rating: 5,
          comment: 'Learner 2 attempting to review Learner 1 session',
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/chỉ học viên tham gia/i);
    });

    it('should reject review creation for booking that is NOT completed (e.g. confirmed) with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({
          bookingId: confirmedBooking._id,
          rating: 5,
          comment: 'Đánh giá trước khi buổi học hoàn tất',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/chỉ có thể đánh giá buổi học đã hoàn thành/i);
    });

    it('should reject review creation with invalid rating values (e.g. 0, 6, decimal) with 400 Bad Request', async () => {
      const testCases = [0, 6, -1, 4.5, 'five'];

      for (const rating of testCases) {
        const res = await request(app)
          .post('/api/reviews')
          .set('Authorization', `Bearer ${learner1Token}`)
          .send({
            bookingId: completedBooking1._id,
            rating,
          });

        expect(res.status).toBe(400);
      }
    });

    it('should successfully create review for completed booking and recalculate Tutor ratingSummary', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({
          bookingId: completedBooking1._id,
          rating: 5,
          comment: 'Thầy giảng rất dễ hiểu và tận tâm!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.review.rating).toBe(5);
      expect(res.body.data.review.comment).toBe('Thầy giảng rất dễ hiểu và tận tâm!');
      expect(res.body.data.tutorRatingSummary.averageRating).toBe(5);
      expect(res.body.data.tutorRatingSummary.reviewCount).toBe(1);

      createdReviewId = res.body.data.review.id;

      // Verify TutorProfile persisted rating
      const profile = await TutorProfile.findOne({ userId: tutor1._id });
      expect(profile.ratingSummary.averageRating).toBe(5);
      expect(profile.ratingSummary.reviewCount).toBe(1);
    });

    it('should enforce 1 review per booking policy: reject duplicate review with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({
          bookingId: completedBooking1._id,
          rating: 4,
          comment: 'Đánh giá lần 2 cho cùng booking',
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/đã được đánh giá/i);
    });

    it('should accurately calculate average rating when second review is submitted', async () => {
      // Learner 2 reviews booking 2 with 4 stars
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${learner2Token}`)
        .send({
          bookingId: completedBooking2._id,
          rating: 4,
          comment: 'Bài tập hơi khó nhưng giải thích rõ ràng.',
        });

      expect(res.status).toBe(201);
      // (5 + 4) / 2 = 4.5
      expect(res.body.data.tutorRatingSummary.averageRating).toBe(4.5);
      expect(res.body.data.tutorRatingSummary.reviewCount).toBe(2);

      const profile = await TutorProfile.findOne({ userId: tutor1._id });
      expect(profile.ratingSummary.averageRating).toBe(4.5);
      expect(profile.ratingSummary.reviewCount).toBe(2);
    });

    it('should allow public access to GET /api/tutors/:id/reviews with pagination and breakdown', async () => {
      const res = await request(app).get(`/api/tutors/${tutor1._id}/reviews`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reviews).toHaveLength(2);
      expect(res.body.data.ratingSummary.averageRating).toBe(4.5);
      expect(res.body.data.ratingSummary.reviewCount).toBe(2);
      expect(res.body.data.ratingSummary.breakdown[5]).toBe(1);
      expect(res.body.data.ratingSummary.breakdown[4]).toBe(1);
      expect(res.body.data.ratingSummary.breakdown[1]).toBe(0);
    });

    it('should filter reviews by rating in GET /api/tutors/:id/reviews?rating=5', async () => {
      const res = await request(app).get(`/api/tutors/${tutor1._id}/reviews?rating=5`);

      expect(res.status).toBe(200);
      expect(res.body.data.reviews).toHaveLength(1);
      expect(res.body.data.reviews[0].rating).toBe(5);
    });

    it('should allow learner to view their own reviews via GET /api/reviews/mine', async () => {
      const res = await request(app)
        .get('/api/reviews/mine')
        .set('Authorization', `Bearer ${learner1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.reviews).toHaveLength(1);
      expect(res.body.data.reviews[0].comment).toMatch(/thầy giảng rất dễ hiểu/i);
    });

    it('should allow querying review for a booking via GET /api/reviews/booking/:bookingId', async () => {
      const res = await request(app)
        .get(`/api/reviews/booking/${completedBooking1._id}`)
        .set('Authorization', `Bearer ${learner1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.rating).toBe(5);
    });

    it('should allow tutor to respond to a review via POST /api/reviews/:id/response', async () => {
      const res = await request(app)
        .post(`/api/reviews/${createdReviewId}/response`)
        .set('Authorization', `Bearer ${tutor1Token}`)
        .send({
          comment: 'Cảm ơn em đã cố gắng trong buổi học!',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.tutorResponse).toBeDefined();
      expect(res.body.data.tutorResponse.comment).toBe('Cảm ơn em đã cố gắng trong buổi học!');
      expect(res.body.data.tutorResponse.respondedAt).toBeDefined();
    });

    it('should reject response to review by a different tutor with 403 Forbidden', async () => {
      const res = await request(app)
        .post(`/api/reviews/${createdReviewId}/response`)
        .set('Authorization', `Bearer ${tutor2Token}`)
        .send({
          comment: 'Gia sư khác không được phản hồi',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('2. Expanded Admin Dashboard & User Management', () => {
    it('should reject user listing without admin role with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${learner1Token}`);

      expect(res.status).toBe(403);
    });

    it('should allow admin to list all users with pagination and summary stats', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.users)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.summary).toBeDefined();
      expect(res.body.data.summary.totalUsers).toBeGreaterThanOrEqual(5);
    });

    it('should allow admin to filter users by role and status', async () => {
      const res = await request(app)
        .get('/api/admin/users?role=tutor&status=active')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.users.every((u) => u.role === ROLES.TUTOR)).toBe(true);
      expect(res.body.data.users.every((u) => u.status === USER_STATUS.ACTIVE)).toBe(true);
    });

    it('should allow admin to search users by keyword', async () => {
      const res = await request(app)
        .get('/api/admin/users?search=Phase10 Master')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.users).toHaveLength(1);
      expect(res.body.data.users[0].name).toBe('Phase10 Master Tutor');
    });

    it('should allow admin to view full user detail with profile and booking stats', async () => {
      const res = await request(app)
        .get(`/api/admin/users/${tutor1._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('tutor1@test-phase10.com');
      expect(res.body.data.profile).toBeDefined();
      expect(res.body.data.bookingStats.completed).toBe(2);
    });

    it('should prevent admin from locking or disabling their own account with 400 Bad Request', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${admin._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: USER_STATUS.LOCKED,
          reason: 'Tự khóa',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/không thể tự khóa/i);
    });

    it('should allow admin to lock user account and invalidate their session', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${learner2._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: USER_STATUS.LOCKED,
          reason: 'Vi phạm chính sách cộng đồng',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.status).toBe(USER_STATUS.LOCKED);

      // Verify that locked user cannot perform authenticated actions
      const testAction = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${learner2Token}`);

      expect(testAction.status).toBe(403);
      expect(testAction.body.message).toMatch(/khóa/i);
    });

    it('should allow admin to unlock user account back to active', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${learner2._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: USER_STATUS.ACTIVE,
          reason: 'Đã xác minh và mở khóa tài khoản',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.status).toBe(USER_STATUS.ACTIVE);
    });

    it('should allow admin to moderate reviews: toggle isPublic and recalculate rating', async () => {
      // 1. List reviews for admin
      const listRes = await request(app)
        .get('/api/admin/reviews')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.reviews.length).toBeGreaterThanOrEqual(2);

      const reviewToHide = listRes.body.data.reviews[0];

      // 2. Hide review (isPublic: false)
      const hideRes = await request(app)
        .patch(`/api/admin/reviews/${reviewToHide.id}/visibility`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isPublic: false });

      expect(hideRes.status).toBe(200);
      expect(hideRes.body.data.isPublic).toBe(false);

      // Verify tutor's rating was recalculated excluding hidden review
      const profileAfterHide = await TutorProfile.findOne({ userId: tutor1._id });
      expect(profileAfterHide.ratingSummary.reviewCount).toBe(1);

      // 3. Unhide review back
      const unhideRes = await request(app)
        .patch(`/api/admin/reviews/${reviewToHide.id}/visibility`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isPublic: true });

      expect(unhideRes.status).toBe(200);
      expect(unhideRes.body.data.isPublic).toBe(true);

      const profileAfterUnhide = await TutorProfile.findOne({ userId: tutor1._id });
      expect(profileAfterUnhide.ratingSummary.reviewCount).toBe(2);
    });

    it('should allow admin to monitor calendar sync logs via GET /api/admin/calendar-sync', async () => {
      const res = await request(app)
        .get('/api/admin/calendar-sync')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeDefined();
    });
  });

  describe('3. Security Enhancements: NoSQL Injection & Input Sanitization', () => {
    it('should intercept and reject NoSQL Injection attempts with MongoDB operators ($gt) in body', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: { $gt: '' },
          password: 'password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/NoSQL Injection detected/i);
    });

    it('should intercept and reject NoSQL Injection attempts in query parameters', async () => {
      const res = await request(app).get('/api/tutors?filter[$gt]=1');

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/NoSQL Injection detected/i);
    });

    it('should sanitize dangerous <script> tags from string body inputs', async () => {
      const maliciousScript = 'Học tốt <script>alert("hacked")</script> thầy rất vui tính';
      const cleanSlot = await AvailabilitySlot.create({
        tutorId: tutor1._id,
        startAt: new Date(Date.now() - 3600000),
        endAt: new Date(Date.now() - 1800000),
        durationMinutes: 30,
        status: SLOT_STATUS.BOOKED,
      });

      const tempBooking = await Booking.create({
        learnerId: learner1._id,
        tutorId: tutor1._id,
        slotId: cleanSlot._id,
        status: BOOKING_STATUS.COMPLETED,
        startAt: cleanSlot.startAt,
        endAt: cleanSlot.endAt,
        durationMinutes: 30,
      });

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({
          bookingId: tempBooking._id,
          rating: 5,
          comment: maliciousScript,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.review.comment).not.toContain('<script>');
      expect(res.body.data.review.comment).not.toContain('</script>');
      expect(res.body.data.review.comment).toContain('Học tốt');
    });
  });

  describe('4. Operational Health & System Metrics Monitoring', () => {
    it('should return enhanced health check with system uptime, memory, and database status', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('healthy');
      expect(res.body.data.uptimeSeconds).toBeDefined();
      expect(res.body.data.system).toBeDefined();
      expect(res.body.data.system.memory.heapUsedMb).toBeGreaterThan(0);
      expect(res.body.data.database.connected).toBe(true);
    });
  });
});
