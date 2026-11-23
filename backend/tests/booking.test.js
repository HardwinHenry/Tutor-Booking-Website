const request = require('supertest');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/user.model');
const TutorProfile = require('../src/models/tutorProfile.model');
const AvailabilitySlot = require('../src/models/availabilitySlot.model');
const Booking = require('../src/models/booking.model');
const { ROLES } = require('../src/constants/roles');
const { APPROVAL_STATUS, COMPLETION_STATUS } = require('../src/constants/profileStatus');
const { SLOT_STATUS } = require('../src/constants/availabilityStatus');
const { BOOKING_STATUS } = require('../src/constants/bookingStatus');
const { bookingEvents, BOOKING_EVENT_NAMES } = require('../src/events/booking.events');

describe('Phase 8: Booking & Request Lifecycle Management Module', () => {
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

  let availableSlot1 = null;
  let availableSlot2 = null;
  let pastSlot = null;

  beforeAll(async () => {
    await connectDB();

    // Clean up test data for phase 8
    await User.deleteMany({ email: { $regex: /@test-phase8-booking\.com$/i } });
    await Booking.deleteMany({});
    await AvailabilitySlot.deleteMany({});
    await TutorProfile.deleteMany({ introduction: { $regex: /test-phase8/i } });

    // 1. Create Learner 1
    const l1Res = await request(app).post('/api/auth/register').send({
      name: 'Learner One',
      email: 'learner1@test-phase8-booking.com',
      password: 'password123',
      role: ROLES.LEARNER,
    });
    learner1 = l1Res.body.data.user;
    learner1Token = l1Res.body.data.accessToken;

    // 2. Create Learner 2
    const l2Res = await request(app).post('/api/auth/register').send({
      name: 'Learner Two',
      email: 'learner2@test-phase8-booking.com',
      password: 'password123',
      role: ROLES.LEARNER,
    });
    learner2 = l2Res.body.data.user;
    learner2Token = l2Res.body.data.accessToken;

    // 3. Create Approved Tutor 1
    const t1Res = await request(app).post('/api/auth/register').send({
      name: 'Tutor One Master',
      email: 'tutor1@test-phase8-booking.com',
      password: 'password123',
      role: ROLES.TUTOR,
    });
    tutor1 = t1Res.body.data.user;
    tutor1Token = t1Res.body.data.accessToken;

    await TutorProfile.create({
      userId: tutor1._id,
      headline: 'Thạc sĩ Toán học ĐH Sư Phạm',
      introduction: 'Test-phase8 tutor 1 profile',
      completionStatus: COMPLETION_STATUS.COMPLETED,
      approvalStatus: APPROVAL_STATUS.APPROVED,
      completedAt: new Date(),
      approvedAt: new Date(),
      teachingConditions: {
        priceMin: 300000,
        priceMax: 500000,
        currency: 'VND',
      },
    });

    // 4. Create Approved Tutor 2
    const t2Res = await request(app).post('/api/auth/register').send({
      name: 'Tutor Two English',
      email: 'tutor2@test-phase8-booking.com',
      password: 'password123',
      role: ROLES.TUTOR,
    });
    tutor2 = t2Res.body.data.user;
    tutor2Token = t2Res.body.data.accessToken;

    await TutorProfile.create({
      userId: tutor2._id,
      headline: 'IELTS 8.5 Teacher',
      introduction: 'Test-phase8 tutor 2 profile',
      completionStatus: COMPLETION_STATUS.COMPLETED,
      approvalStatus: APPROVAL_STATUS.APPROVED,
      completedAt: new Date(),
      approvedAt: new Date(),
      teachingConditions: {
        priceMin: 400000,
        currency: 'VND',
      },
    });

    // 5. Create Admin
    const adminUser = await User.create({
      name: 'Admin Booking Phase8',
      email: 'admin@test-phase8-booking.com',
      passwordHash: await User.hashPassword('password123'),
      role: ROLES.ADMIN,
    });
    admin = adminUser;
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'admin@test-phase8-booking.com',
      password: 'password123',
    });
    adminToken = loginRes.body.data.accessToken;

    // 6. Seed slots for Tutor 1
    const futureDate1Start = new Date(Date.now() + 86400000 * 2); // 2 days later
    const futureDate1End = new Date(futureDate1Start.getTime() + 60 * 60000); // 60 mins

    availableSlot1 = await AvailabilitySlot.create({
      tutorId: tutor1._id,
      startAt: futureDate1Start,
      endAt: futureDate1End,
      timezone: 'Asia/Ho_Chi_Minh',
      status: SLOT_STATUS.AVAILABLE,
      note: 'Buổi sáng chủ nhật',
    });

    const futureDate2Start = new Date(Date.now() + 86400000 * 3); // 3 days later
    const futureDate2End = new Date(futureDate2Start.getTime() + 90 * 60000); // 90 mins

    availableSlot2 = await AvailabilitySlot.create({
      tutorId: tutor1._id,
      startAt: futureDate2Start,
      endAt: futureDate2End,
      timezone: 'Asia/Ho_Chi_Minh',
      status: SLOT_STATUS.AVAILABLE,
      note: 'Buổi chiều thứ hai',
    });

    // Past slot
    pastSlot = await AvailabilitySlot.create({
      tutorId: tutor1._id,
      startAt: new Date(Date.now() - 3600000 * 5),
      endAt: new Date(Date.now() - 3600000 * 4),
      timezone: 'Asia/Ho_Chi_Minh',
      status: SLOT_STATUS.AVAILABLE,
    });
  });

  describe('1. Create Booking (POST /api/bookings)', () => {
    it('should reject unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app).post('/api/bookings').send({
        slotId: availableSlot1._id,
      });

      expect(res.status).toBe(401);
    });

    it('should reject tutor attempting to create a booking with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${tutor2Token}`)
        .send({
          slotId: availableSlot1._id,
        });

      expect(res.status).toBe(403);
    });

    it('should reject booking when slotId is missing with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({
          subjectName: 'Toán học',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/không hợp lệ/i);
    });

    it('should reject booking with unwhitelisted fields with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({
          slotId: availableSlot1._id,
          hackerField: 'malicious',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/trường không được phép/i);
    });

    it('should reject booking when slot does not exist with 404 Not Found', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({
          slotId: fakeId,
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Không tìm thấy/i);
    });

    it('should reject booking a slot whose startAt is in the past with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({
          slotId: pastSlot._id,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/đã qua/i);
    });

    it('should create a booking successfully by learner with status pending and correct snapshots', async () => {
      let eventFired = false;
      bookingEvents.once(BOOKING_EVENT_NAMES.CREATED, () => {
        eventFired = true;
      });

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({
          slotId: availableSlot1._id,
          subjectName: 'Toán lớp 12',
          learningMode: 'online',
          location: 'https://meet.google.com/abc-def-ghi',
          learnerNote: 'Em muốn ôn tập phần khảo sát hàm số',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const booking = res.body.data.booking;
      expect(booking).toHaveProperty('_id');
      expect(booking.learnerId._id.toString()).toBe(learner1._id.toString());
      expect(booking.tutorId._id.toString()).toBe(tutor1._id.toString());
      expect(booking.slotId._id.toString()).toBe(availableSlot1._id.toString());
      expect(booking.status).toBe(BOOKING_STATUS.PENDING);
      expect(booking.durationMinutes).toBe(60);
      expect(booking.price).toBe(300000); // 300,000 VND / hour
      expect(booking.currency).toBe('VND');
      expect(booking.subjectName).toBe('Toán lớp 12');
      expect(booking.learningMode).toBe('online');
      expect(booking.location).toBe('https://meet.google.com/abc-def-ghi');
      expect(booking.learnerNote).toBe('Em muốn ôn tập phần khảo sát hàm số');
      expect(eventFired).toBe(true);

      // Verify that in MVP, the slot is STILL 'available' until tutor confirms
      const slotAfter = await AvailabilitySlot.findById(availableSlot1._id);
      expect(slotAfter.status).toBe(SLOT_STATUS.AVAILABLE);
    });

    it('should reject duplicate pending booking by the same learner for the same slot with 400', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({
          slotId: availableSlot1._id,
          subjectName: 'Toán lớp 12',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/đã gửi một yêu cầu/i);
    });

    it('should allow another learner to send a pending request for the same slot before confirmation', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${learner2Token}`)
        .send({
          slotId: availableSlot1._id,
          subjectName: 'Toán ôn thi đại học',
          learnerNote: 'Học sinh thứ 2 muốn đăng ký',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.booking.status).toBe(BOOKING_STATUS.PENDING);
    });
  });

  describe('2. Query Bookings (GET /api/bookings/me & GET /api/bookings/:id)', () => {
    it('should return bookings of current learner', async () => {
      const res = await request(app)
        .get('/api/bookings/me')
        .set('Authorization', `Bearer ${learner1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
      res.body.data.items.forEach((item) => {
        expect(item.learnerId._id.toString()).toBe(learner1._id.toString());
      });
      expect(res.body.data.pagination).toHaveProperty('total');
      expect(res.body.data.pagination).toHaveProperty('totalPages');
    });

    it('should return bookings sent to current tutor', async () => {
      const res = await request(app)
        .get('/api/bookings/me')
        .set('Authorization', `Bearer ${tutor1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(2);
      res.body.data.items.forEach((item) => {
        expect(item.tutorId._id.toString()).toBe(tutor1._id.toString());
      });
    });

    it('should filter bookings by status', async () => {
      const res = await request(app)
        .get('/api/bookings/me?status=pending')
        .set('Authorization', `Bearer ${tutor1Token}`);

      expect(res.status).toBe(200);
      res.body.data.items.forEach((item) => {
        expect(item.status).toBe(BOOKING_STATUS.PENDING);
      });
    });

    it('should reject unwhitelisted query parameter with 400 Bad Request', async () => {
      const res = await request(app)
        .get('/api/bookings/me?evilFilter=test')
        .set('Authorization', `Bearer ${learner1Token}`);

      expect(res.status).toBe(400);
    });

    it('should allow learner and tutor to view booking detail by ID', async () => {
      const myBookings = await request(app)
        .get('/api/bookings/me')
        .set('Authorization', `Bearer ${learner1Token}`);

      const bookingId = myBookings.body.data.items[0]._id;

      // Learner 1 views their booking
      const resLearner = await request(app)
        .get(`/api/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${learner1Token}`);

      expect(resLearner.status).toBe(200);
      expect(resLearner.body.data.booking._id.toString()).toBe(bookingId);

      // Tutor 1 views booking assigned to them
      const resTutor = await request(app)
        .get(`/api/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${tutor1Token}`);

      expect(resTutor.status).toBe(200);

      // Learner 2 (stranger) is blocked with 403 Forbidden
      const resStranger = await request(app)
        .get(`/api/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${learner2Token}`);

      expect(resStranger.status).toBe(403);
    });
  });

  describe('3. Confirm Booking & Atomic Slot Lock (PATCH /api/bookings/:id/confirm)', () => {
    let bookingToConfirm = null;
    let competingBooking = null;

    beforeEach(async () => {
      // Ensure slot is available and create clean bookings
      await AvailabilitySlot.findByIdAndUpdate(availableSlot1._id, {
        status: SLOT_STATUS.AVAILABLE,
        bookingId: null,
      });
      await Booking.deleteMany({ slotId: availableSlot1._id });

      bookingToConfirm = await Booking.create({
        learnerId: learner1._id,
        tutorId: tutor1._id,
        slotId: availableSlot1._id,
        status: BOOKING_STATUS.PENDING,
        startAt: availableSlot1.startAt,
        endAt: availableSlot1.endAt,
        durationMinutes: 60,
        price: 300000,
        currency: 'VND',
        subjectName: 'Toán lớp 12',
      });

      competingBooking = await Booking.create({
        learnerId: learner2._id,
        tutorId: tutor1._id,
        slotId: availableSlot1._id,
        status: BOOKING_STATUS.PENDING,
        startAt: availableSlot1.startAt,
        endAt: availableSlot1.endAt,
        durationMinutes: 60,
        price: 300000,
        currency: 'VND',
        subjectName: 'Toán ôn thi đại học',
      });
    });

    it('should reject confirmation by learner with 403 Forbidden', async () => {
      const res = await request(app)
        .patch(`/api/bookings/${bookingToConfirm._id}/confirm`)
        .set('Authorization', `Bearer ${learner1Token}`)
        .send();

      expect(res.status).toBe(403);
    });

    it('should reject confirmation by a different tutor with 403 Forbidden', async () => {
      const res = await request(app)
        .patch(`/api/bookings/${bookingToConfirm._id}/confirm`)
        .set('Authorization', `Bearer ${tutor2Token}`)
        .send();

      expect(res.status).toBe(403);
    });

    it('should allow assigned tutor to confirm booking: status becomes confirmed and slot atomically becomes booked', async () => {
      let eventFired = false;
      bookingEvents.once(BOOKING_EVENT_NAMES.CONFIRMED, () => {
        eventFired = true;
      });

      const res = await request(app)
        .patch(`/api/bookings/${bookingToConfirm._id}/confirm`)
        .set('Authorization', `Bearer ${tutor1Token}`)
        .send({
          tutorNote: 'Thầy đã nhận lịch và chuẩn bị tài liệu nhé!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const confirmedBooking = res.body.data.booking;
      expect(confirmedBooking.status).toBe(BOOKING_STATUS.CONFIRMED);
      expect(confirmedBooking.confirmedAt).toBeTruthy();
      expect(confirmedBooking.tutorNote).toBe('Thầy đã nhận lịch và chuẩn bị tài liệu nhé!');
      expect(eventFired).toBe(true);

      // Verify slot is atomically changed to BOOKED
      const updatedSlot = await AvailabilitySlot.findById(availableSlot1._id);
      expect(updatedSlot.status).toBe(SLOT_STATUS.BOOKED);
      expect(updatedSlot.bookingId.toString()).toBe(bookingToConfirm._id.toString());

      // Verify competing booking on the same slot is auto-rejected
      const competingAfter = await Booking.findById(competingBooking._id);
      expect(competingAfter.status).toBe(BOOKING_STATUS.REJECTED);
      expect(competingAfter.rejectionReason).toMatch(/đã được gia sư xác nhận cho học viên khác/i);
    });

    it('should reject re-confirming an already confirmed booking with 400 Bad Request', async () => {
      // First confirm it
      await request(app)
        .patch(`/api/bookings/${bookingToConfirm._id}/confirm`)
        .set('Authorization', `Bearer ${tutor1Token}`)
        .send();

      // Try confirming again
      const res = await request(app)
        .patch(`/api/bookings/${bookingToConfirm._id}/confirm`)
        .set('Authorization', `Bearer ${tutor1Token}`)
        .send();

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Không thể xác nhận booking đang ở trạng thái "confirmed"/i);
    });
  });

  describe('4. Reject Booking (PATCH /api/bookings/:id/reject)', () => {
    let pendingBooking = null;

    beforeEach(async () => {
      // Create a fresh pending booking for slot2
      const slot2 = await AvailabilitySlot.findById(availableSlot2._id);
      slot2.status = SLOT_STATUS.AVAILABLE;
      slot2.bookingId = null;
      await slot2.save();

      await Booking.deleteMany({ slotId: availableSlot2._id });

      pendingBooking = await Booking.create({
        learnerId: learner1._id,
        tutorId: tutor1._id,
        slotId: availableSlot2._id,
        status: BOOKING_STATUS.PENDING,
        startAt: slot2.startAt,
        endAt: slot2.endAt,
        durationMinutes: 90,
        price: 450000,
        currency: 'VND',
        subjectName: 'Vật lý 12',
      });
    });

    it('should reject when rejectionReason is missing or too short with 400 Bad Request', async () => {
      const res = await request(app)
        .patch(`/api/bookings/${pendingBooking._id}/reject`)
        .set('Authorization', `Bearer ${tutor1Token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/rejectionReason/i);
    });

    it('should allow tutor to reject pending booking with reason and slot remains available', async () => {
      let eventFired = false;
      bookingEvents.once(BOOKING_EVENT_NAMES.REJECTED, () => {
        eventFired = true;
      });

      const res = await request(app)
        .patch(`/api/bookings/${pendingBooking._id}/reject`)
        .set('Authorization', `Bearer ${tutor1Token}`)
        .send({
          rejectionReason: 'Thầy bận đột xuất vào khung giờ này',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.booking.status).toBe(BOOKING_STATUS.REJECTED);
      expect(res.body.data.booking.rejectionReason).toBe('Thầy bận đột xuất vào khung giờ này');
      expect(res.body.data.booking.rejectedAt).toBeTruthy();
      expect(eventFired).toBe(true);

      const slot = await AvailabilitySlot.findById(availableSlot2._id);
      expect(slot.status).toBe(SLOT_STATUS.AVAILABLE);
    });

    it('should reject attempting to reject an already rejected booking with 400', async () => {
      pendingBooking.status = BOOKING_STATUS.REJECTED;
      pendingBooking.rejectedAt = new Date();
      pendingBooking.rejectionReason = 'Đã từ chối trước đó';
      await pendingBooking.save();

      const res = await request(app)
        .patch(`/api/bookings/${pendingBooking._id}/reject`)
        .set('Authorization', `Bearer ${tutor1Token}`)
        .send({
          rejectionReason: 'Từ chối lần 2',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('5. Cancel Booking (PATCH /api/bookings/:id/cancel)', () => {
    let pendingBooking = null;
    let confirmedBooking = null;

    beforeEach(async () => {
      // Create slot and pending booking
      const newSlot = await AvailabilitySlot.create({
        tutorId: tutor1._id,
        startAt: new Date(Date.now() + 86400000 * 5),
        endAt: new Date(Date.now() + 86400000 * 5 + 3600000),
        status: SLOT_STATUS.AVAILABLE,
      });

      pendingBooking = await Booking.create({
        learnerId: learner1._id,
        tutorId: tutor1._id,
        slotId: newSlot._id,
        status: BOOKING_STATUS.PENDING,
        startAt: newSlot.startAt,
        endAt: newSlot.endAt,
        durationMinutes: 60,
        price: 300000,
        currency: 'VND',
      });

      // Create confirmed slot and confirmed booking
      const bookedSlot = await AvailabilitySlot.create({
        tutorId: tutor1._id,
        startAt: new Date(Date.now() + 86400000 * 6),
        endAt: new Date(Date.now() + 86400000 * 6 + 3600000),
        status: SLOT_STATUS.BOOKED,
      });

      confirmedBooking = await Booking.create({
        learnerId: learner1._id,
        tutorId: tutor1._id,
        slotId: bookedSlot._id,
        status: BOOKING_STATUS.CONFIRMED,
        startAt: bookedSlot.startAt,
        endAt: bookedSlot.endAt,
        durationMinutes: 60,
        price: 300000,
        currency: 'VND',
        confirmedAt: new Date(),
      });

      bookedSlot.bookingId = confirmedBooking._id;
      await bookedSlot.save();
    });

    it('should reject cancellation when cancelReason is missing with 400 Bad Request', async () => {
      const res = await request(app)
        .patch(`/api/bookings/${pendingBooking._id}/cancel`)
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cancelReason/i);
    });

    it('should allow learner to cancel a pending booking', async () => {
      const res = await request(app)
        .patch(`/api/bookings/${pendingBooking._id}/cancel`)
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({
          cancelReason: 'Em đổi lịch học khác',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.booking.status).toBe(BOOKING_STATUS.CANCELLED);
      expect(res.body.data.booking.cancelledByRole).toBe('learner');
      expect(res.body.data.booking.cancelReason).toBe('Em đổi lịch học khác');
    });

    it('should prevent tutor from cancelling a pending booking (tutor must use reject)', async () => {
      const res = await request(app)
        .patch(`/api/bookings/${pendingBooking._id}/cancel`)
        .set('Authorization', `Bearer ${tutor1Token}`)
        .send({
          cancelReason: 'Thầy không rảnh',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/từ chối/i);
    });

    it('should allow learner to cancel a confirmed booking and atomically release the slot to available', async () => {
      let eventFired = false;
      bookingEvents.once(BOOKING_EVENT_NAMES.CANCELLED, () => {
        eventFired = true;
      });

      const res = await request(app)
        .patch(`/api/bookings/${confirmedBooking._id}/cancel`)
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({
          cancelReason: 'Em bận việc gia đình đột xuất',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.booking.status).toBe(BOOKING_STATUS.CANCELLED);
      expect(eventFired).toBe(true);

      // Verify the slot is atomically released back to AVAILABLE and bookingId is null
      const slot = await AvailabilitySlot.findById(confirmedBooking.slotId);
      expect(slot.status).toBe(SLOT_STATUS.AVAILABLE);
      expect(slot.bookingId).toBeNull();
    });

    it('should allow tutor to cancel a confirmed booking and release slot', async () => {
      // Reset booking to confirmed
      const slot = await AvailabilitySlot.findById(confirmedBooking.slotId);
      slot.status = SLOT_STATUS.BOOKED;
      slot.bookingId = confirmedBooking._id;
      await slot.save();

      confirmedBooking.status = BOOKING_STATUS.CONFIRMED;
      await confirmedBooking.save();

      const res = await request(app)
        .patch(`/api/bookings/${confirmedBooking._id}/cancel`)
        .set('Authorization', `Bearer ${tutor1Token}`)
        .send({
          cancelReason: 'Thầy có lịch công tác đột xuất',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.booking.status).toBe(BOOKING_STATUS.CANCELLED);
      expect(res.body.data.booking.cancelledByRole).toBe('tutor');

      const slotAfter = await AvailabilitySlot.findById(confirmedBooking.slotId);
      expect(slotAfter.status).toBe(SLOT_STATUS.AVAILABLE);
      expect(slotAfter.bookingId).toBeNull();
    });
  });

  describe('6. Complete Booking (PATCH /api/bookings/:id/complete)', () => {
    let futureConfirmedBooking = null;
    let pastConfirmedBooking = null;

    beforeEach(async () => {
      // Future confirmed session
      futureConfirmedBooking = await Booking.create({
        learnerId: learner1._id,
        tutorId: tutor1._id,
        slotId: availableSlot1._id,
        status: BOOKING_STATUS.CONFIRMED,
        startAt: new Date(Date.now() + 86400000),
        endAt: new Date(Date.now() + 86400000 + 3600000),
        durationMinutes: 60,
        price: 300000,
        currency: 'VND',
        confirmedAt: new Date(),
      });

      // Past confirmed session (ended 30 mins ago)
      pastConfirmedBooking = await Booking.create({
        learnerId: learner1._id,
        tutorId: tutor1._id,
        slotId: availableSlot1._id,
        status: BOOKING_STATUS.CONFIRMED,
        startAt: new Date(Date.now() - 7200000),
        endAt: new Date(Date.now() - 3600000),
        durationMinutes: 60,
        price: 300000,
        currency: 'VND',
        confirmedAt: new Date(Date.now() - 86400000),
      });
    });

    it('should reject completion by learner with 403 Forbidden', async () => {
      const res = await request(app)
        .patch(`/api/bookings/${pastConfirmedBooking._id}/complete`)
        .set('Authorization', `Bearer ${learner1Token}`)
        .send();

      expect(res.status).toBe(403);
    });

    it('should prevent tutor from completing a session before its end time with 400 Bad Request', async () => {
      const res = await request(app)
        .patch(`/api/bookings/${futureConfirmedBooking._id}/complete`)
        .set('Authorization', `Bearer ${tutor1Token}`)
        .send();

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/kết thúc buổi học đã qua/i);
    });

    it('should allow tutor to complete session after end time: status becomes completed', async () => {
      let eventFired = false;
      bookingEvents.once(BOOKING_EVENT_NAMES.COMPLETED, () => {
        eventFired = true;
      });

      const res = await request(app)
        .patch(`/api/bookings/${pastConfirmedBooking._id}/complete`)
        .set('Authorization', `Bearer ${tutor1Token}`)
        .send({
          tutorNote: 'Học viên tiếp thu tốt, làm đủ bài tập.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.booking.status).toBe(BOOKING_STATUS.COMPLETED);
      expect(res.body.data.booking.completedAt).toBeTruthy();
      expect(res.body.data.booking.tutorNote).toBe('Học viên tiếp thu tốt, làm đủ bài tập.');
      expect(eventFired).toBe(true);
    });

    it('should reject completing an already completed booking with 400', async () => {
      pastConfirmedBooking.status = BOOKING_STATUS.COMPLETED;
      pastConfirmedBooking.completedAt = new Date();
      await pastConfirmedBooking.save();

      const res = await request(app)
        .patch(`/api/bookings/${pastConfirmedBooking._id}/complete`)
        .set('Authorization', `Bearer ${tutor1Token}`)
        .send();

      expect(res.status).toBe(400);
    });
  });

  describe('7. Admin Booking Management (GET /api/admin/bookings)', () => {
    it('should reject non-admin request with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/bookings')
        .set('Authorization', `Bearer ${learner1Token}`);

      expect(res.status).toBe(403);
    });

    it('should allow admin to list all bookings across system with pagination and filters', async () => {
      const res = await request(app)
        .get('/api/admin/bookings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThan(0);
      expect(res.body.data.pagination).toHaveProperty('total');
    });

    it('should allow admin to filter bookings by learnerId and status', async () => {
      const res = await request(app)
        .get(`/api/admin/bookings?learnerId=${learner1._id}&status=cancelled`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      res.body.data.items.forEach((item) => {
        expect(item.learnerId._id.toString()).toBe(learner1._id.toString());
        expect(item.status).toBe(BOOKING_STATUS.CANCELLED);
      });
    });
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ email: { $regex: /@test-phase8-booking\.com$/i } });
    await Booking.deleteMany({});
    await AvailabilitySlot.deleteMany({});
    await TutorProfile.deleteMany({ introduction: { $regex: /test-phase8/i } });
    await disconnectDB();
  });
});
