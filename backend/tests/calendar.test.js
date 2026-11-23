const request = require('supertest');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/user.model');
const TutorProfile = require('../src/models/tutorProfile.model');
const AvailabilitySlot = require('../src/models/availabilitySlot.model');
const Booking = require('../src/models/booking.model');
const CalendarConnection = require('../src/models/calendarConnection.model');
const CalendarEvent = require('../src/models/calendarEvent.model');
const googleCalendarClient = require('../src/integrations/google-calendar/googleCalendar.client');
const calendarService = require('../src/services/calendar.service');
const { encrypt, decrypt, generateOAuthState, verifyOAuthState } = require('../src/utils/crypto.util');
const {
  CALENDAR_SYNC_STATUS,
  CALENDAR_CONNECTION_STATUS,
} = require('../src/constants/calendarStatus');
const { ROLES } = require('../src/constants/roles');
const { APPROVAL_STATUS, COMPLETION_STATUS } = require('../src/constants/profileStatus');
const { BOOKING_STATUS } = require('../src/constants/bookingStatus');
const { bookingEvents, BOOKING_EVENT_NAMES } = require('../src/events/booking.events');

describe('Phase 9: Google Calendar API OAuth & Synchronization Module', () => {
  let learner = null;
  let learnerToken = '';
  let tutor = null;
  let tutorToken = '';
  let otherLearner = null;
  let otherLearnerToken = '';
  let admin = null;
  let adminToken = '';

  let confirmedBooking = null;
  let slot = null;

  // Mock store to capture Google Calendar API calls during tests
  let createdCalendarEvents = [];
  let deletedCalendarEvents = [];
  let revokedTokens = [];
  let shouldFailGoogleApi = false;
  let shouldFailRefresh = false;

  beforeAll(async () => {
    await connectDB();

    // Clean up test collections for phase 9
    await User.deleteMany({ email: { $regex: /@test-phase9-calendar\.com$/i } });
    await Booking.deleteMany({});
    await AvailabilitySlot.deleteMany({});
    await CalendarConnection.deleteMany({});
    await CalendarEvent.deleteMany({});

    // 1. Create Learner
    const lRes = await request(app).post('/api/auth/register').send({
      name: 'Calendar Learner',
      email: 'learner@test-phase9-calendar.com',
      password: 'password123',
      role: ROLES.LEARNER,
    });
    learner = lRes.body.data.user;
    learnerToken = lRes.body.data.accessToken;

    // 2. Create Other Learner
    const olRes = await request(app).post('/api/auth/register').send({
      name: 'Other Calendar Learner',
      email: 'other_learner@test-phase9-calendar.com',
      password: 'password123',
      role: ROLES.LEARNER,
    });
    otherLearner = olRes.body.data.user;
    otherLearnerToken = olRes.body.data.accessToken;

    // 3. Create Tutor
    const tRes = await request(app).post('/api/auth/register').send({
      name: 'Calendar Tutor',
      email: 'tutor@test-phase9-calendar.com',
      password: 'password123',
      role: ROLES.TUTOR,
    });
    tutor = tRes.body.data.user;
    tutorToken = tRes.body.data.accessToken;

    await TutorProfile.create({
      userId: tutor._id,
      headline: 'Chuyên gia Lập trình NodeJS',
      introduction: 'Test-phase9 tutor profile',
      completionStatus: COMPLETION_STATUS.COMPLETED,
      approvalStatus: APPROVAL_STATUS.APPROVED,
      completedAt: new Date(),
      approvedAt: new Date(),
    });

    // 4. Create Admin
    const adminUser = await User.create({
      name: 'Admin Calendar Phase9',
      email: 'admin@test-phase9-calendar.com',
      passwordHash: await User.hashPassword('password123'),
      role: ROLES.ADMIN,
    });
    admin = adminUser;
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'admin@test-phase9-calendar.com',
      password: 'password123',
    });
    adminToken = loginRes.body.data.accessToken;

    // Set up mock transport for GoogleCalendarClient
    googleCalendarClient.setMockTransport(async (url, options = {}) => {
      const urlStr = String(url);

      // 1. Token Exchange or Refresh
      if (urlStr.includes('/token')) {
        if (shouldFailRefresh && options.body?.includes('grant_type=refresh_token')) {
          return {
            ok: false,
            status: 400,
            json: async () => ({ error: 'invalid_grant', error_description: 'Token has been revoked' }),
          };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            access_token: 'mock_google_access_token_' + Date.now(),
            refresh_token: 'mock_google_refresh_token_secret',
            expires_in: 3600,
            token_type: 'Bearer',
            scope: 'https://www.googleapis.com/auth/calendar.events',
          }),
        };
      }

      // 2. User Info Endpoint
      if (urlStr.includes('/userinfo')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: 'google_user_12345',
            email: 'google_account@gmail.com',
          }),
        };
      }

      // 3. Revoke Token Endpoint
      if (urlStr.includes('/revoke')) {
        revokedTokens.push(urlStr);
        return {
          ok: true,
          status: 200,
        };
      }

      // 4. Calendar Events Endpoints
      if (urlStr.includes('/calendar/v3/calendars/')) {
        if (shouldFailGoogleApi) {
          return {
            ok: false,
            status: 503,
            json: async () => ({
              error: {
                code: 503,
                message: 'Service Unavailable: Google Calendar API temporary outage',
              },
            }),
          };
        }

        const method = options.method || 'GET';

        // Create Event (POST)
        if (method === 'POST') {
          const body = JSON.parse(options.body || '{}');
          const eventId = 'g_event_' + Math.random().toString(36).substring(2, 10);
          const responsePayload = {
            id: eventId,
            status: 'confirmed',
            htmlLink: `https://www.google.com/calendar/event?eid=${eventId}`,
            summary: body.summary,
            start: body.start,
            end: body.end,
          };
          createdCalendarEvents.push(responsePayload);
          return {
            ok: true,
            status: 200,
            json: async () => responsePayload,
          };
        }

        // Delete Event (DELETE)
        if (method === 'DELETE') {
          deletedCalendarEvents.push(urlStr);
          return {
            ok: true,
            status: 204,
          };
        }

        // Patch / Update Event
        if (method === 'PATCH') {
          const body = JSON.parse(options.body || '{}');
          return {
            ok: true,
            status: 200,
            json: async () => ({ id: 'updated_event_id', ...body }),
          };
        }
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({}),
      };
    });
  });

  beforeEach(() => {
    createdCalendarEvents = [];
    deletedCalendarEvents = [];
    revokedTokens = [];
    shouldFailGoogleApi = false;
    shouldFailRefresh = false;
  });

  describe('1. Security & Token Cryptography (AES-256-GCM)', () => {
    it('should encrypt and decrypt tokens accurately without data loss', () => {
      const plaintext = 'ya29.a0ARrdaM_test_very_secret_refresh_token_12345';
      const encrypted = encrypt(plaintext);

      expect(encrypted).not.toBe(plaintext);
      expect(encrypted.split(':')).toHaveLength(3); // iv:authTag:cipherHex

      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should fail decryption when ciphertext or auth tag is tampered with', () => {
      const plaintext = 'sensitive_oauth_token';
      const encrypted = encrypt(plaintext);
      const [iv, authTag, cipher] = encrypted.split(':');

      // Corrupt the ciphertext
      const corruptedCipher = cipher.substring(0, cipher.length - 2) + 'ff';
      const tampered = `${iv}:${authTag}:${corruptedCipher}`;

      expect(() => decrypt(tampered)).toThrow();
    });

    it('should generate secure CSRF OAuth state and verify successfully', () => {
      const state = generateOAuthState({ userId: learner._id.toString(), role: ROLES.LEARNER });
      expect(typeof state).toBe('string');

      const verified = verifyOAuthState(state);
      expect(verified.userId).toBe(learner._id.toString());
      expect(verified.role).toBe(ROLES.LEARNER);
      expect(verified.type).toBe('google_calendar_oauth');
    });

    it('should reject tampered or invalid OAuth state token', () => {
      const state = generateOAuthState({ userId: learner._id.toString() });
      const tamperedState = state + 'invalid_signature_byte';

      expect(() => verifyOAuthState(tamperedState)).toThrow();
    });
  });

  describe('2. OAuth 2.0 Authorization Code Flow Endpoints', () => {
    it('GET /api/calendar/oauth should require authentication (401)', async () => {
      const res = await request(app).get('/api/calendar/oauth');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/calendar/oauth should return authorization URL with valid state param', async () => {
      const res = await request(app)
        .get('/api/calendar/oauth')
        .set('Authorization', `Bearer ${learnerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('url');
      expect(res.body.data).toHaveProperty('state');

      const urlObj = new URL(res.body.data.url);
      expect(urlObj.hostname).toBe('accounts.google.com');
      expect(urlObj.searchParams.get('response_type')).toBe('code');
      expect(urlObj.searchParams.get('access_type')).toBe('offline');
      expect(urlObj.searchParams.get('prompt')).toBe('consent');
      expect(urlObj.searchParams.get('state')).toBe(res.body.data.state);

      // Verify decoded state has learner userId
      const decoded = verifyOAuthState(res.body.data.state);
      expect(decoded.userId).toBe(learner._id.toString());
    });

    it('GET /api/calendar/oauth/callback should reject missing code with 400 Bad Request', async () => {
      const state = generateOAuthState({ userId: learner._id.toString() });
      const res = await request(app)
        .get(`/api/calendar/oauth/callback?state=${encodeURIComponent(state)}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/calendar/oauth/callback should reject invalid state (CSRF attack attempt) with 400', async () => {
      const res = await request(app)
        .get('/api/calendar/oauth/callback?code=mock_auth_code_123&state=fake_malicious_state');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Xác thực state thất bại');
    });

    it('GET /api/calendar/oauth/callback should exchange code, encrypt tokens, and connect successfully', async () => {
      const state = generateOAuthState({ userId: learner._id.toString() });
      const res = await request(app)
        .get(`/api/calendar/oauth/callback?code=valid_test_auth_code&state=${encodeURIComponent(state)}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userId).toBe(learner._id.toString());
      expect(res.body.data.email).toBe('google_account@gmail.com');
      expect(res.body.data.status).toBe(CALENDAR_CONNECTION_STATUS.CONNECTED);

      // Verify stored connection in DB
      const connection = await CalendarConnection.findOne({ userId: learner._id });
      expect(connection).toBeDefined();
      expect(connection.status).toBe(CALENDAR_CONNECTION_STATUS.CONNECTED);
      expect(connection.googleEmail).toBe('google_account@gmail.com');

      // Verify tokens are stored encrypted and can be decrypted
      expect(connection.encryptedAccessToken).not.toContain('mock_google_access_token');
      const decrypted = connection.getDecryptedTokens();
      expect(decrypted.accessToken).toContain('mock_google_access_token');
      expect(decrypted.refreshToken).toBe('mock_google_refresh_token_secret');
    });
  });

  describe('3. Connection Status & Disconnect Workflow', () => {
    it('GET /api/calendar/status should return connected=true for connected user and never expose tokens', async () => {
      const res = await request(app)
        .get('/api/calendar/status')
        .set('Authorization', `Bearer ${learnerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.connected).toBe(true);
      expect(res.body.data.email).toBe('google_account@gmail.com');
      expect(res.body.data).toHaveProperty('syncSummary');

      // Security check: must NEVER return encrypted or raw tokens
      expect(res.body.data).not.toHaveProperty('encryptedAccessToken');
      expect(res.body.data).not.toHaveProperty('accessToken');
      expect(res.body.data).not.toHaveProperty('refreshToken');
    });

    it('GET /api/calendar/status should return connected=false for unconnected user', async () => {
      const res = await request(app)
        .get('/api/calendar/status')
        .set('Authorization', `Bearer ${tutorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.connected).toBe(false);
      expect(res.body.data.email).toBeNull();
    });

    it('POST /api/calendar/disconnect should disconnect user and attempt token revocation', async () => {
      const res = await request(app)
        .post('/api/calendar/disconnect')
        .set('Authorization', `Bearer ${learnerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.connected).toBe(false);

      // DB check
      const connection = await CalendarConnection.findOne({ userId: learner._id });
      expect(connection.status).toBe(CALENDAR_CONNECTION_STATUS.DISCONNECTED);
      expect(connection.lastDisconnectedAt).toBeDefined();

      // Verify revoke call was made
      expect(revokedTokens.length).toBeGreaterThan(0);
    });
  });

  describe('4. Token Refresh & Resilience Mechanism', () => {
    it('should automatically refresh access token when token is expired', async () => {
      // Re-connect learner with an already expired access token
      const connection = await CalendarConnection.findOne({ userId: learner._id });
      connection.status = CALENDAR_CONNECTION_STATUS.CONNECTED;
      connection.setTokens({
        accessToken: 'expired_access_token',
        refreshToken: 'valid_refresh_token',
        expiryDate: new Date(Date.now() - 60000), // 1 min in past
        googleEmail: 'learner_refresh@gmail.com',
      });
      await connection.save();

      expect(connection.isTokenExpired()).toBe(true);

      // Request valid token via service
      const freshToken = await calendarService.getValidAccessToken(learner._id);
      expect(freshToken).toBeDefined();
      expect(freshToken).toContain('mock_google_access_token');

      // Connection in DB should have updated expiry
      const updatedConnection = await CalendarConnection.findOne({ userId: learner._id });
      expect(updatedConnection.isTokenExpired()).toBe(false);
    });

    it('should mark connection status as REVOKED if refresh token is rejected by Google (invalid_grant)', async () => {
      shouldFailRefresh = true;

      const connection = await CalendarConnection.findOne({ userId: learner._id });
      connection.tokenExpiry = new Date(Date.now() - 60000);
      await connection.save();

      const token = await calendarService.getValidAccessToken(learner._id);
      expect(token).toBeNull();

      const revokedConn = await CalendarConnection.findOne({ userId: learner._id });
      expect(revokedConn.status).toBe(CALENDAR_CONNECTION_STATUS.REVOKED);
    });
  });

  describe('5. Automatic Synchronization on Booking Lifecycle Events', () => {
    let testSlot = null;
    let bookingToConfirm = null;

    const waitForCondition = async (fn, timeout = 3500, interval = 50) => {
      const start = Date.now();
      while (Date.now() - start < timeout) {
        try {
          if (await fn()) return true;
        } catch {}
        await new Promise((r) => setTimeout(r, interval));
      }
      return false;
    };

    beforeEach(async () => {
      // Re-connect Learner
      let lConn = await CalendarConnection.findOne({ userId: learner._id });
      if (!lConn) lConn = new CalendarConnection({ userId: learner._id });
      lConn.setTokens({
        accessToken: 'valid_learner_access_token',
        refreshToken: 'valid_learner_refresh_token',
        expiryDate: new Date(Date.now() + 3600000),
        googleEmail: 'learner_active@gmail.com',
      });
      await lConn.save();

      // Re-connect Tutor
      let tConn = await CalendarConnection.findOne({ userId: tutor._id });
      if (!tConn) tConn = new CalendarConnection({ userId: tutor._id });
      tConn.setTokens({
        accessToken: 'valid_tutor_access_token',
        refreshToken: 'valid_tutor_refresh_token',
        expiryDate: new Date(Date.now() + 3600000),
        googleEmail: 'tutor_active@gmail.com',
      });
      await tConn.save();

      // Create a slot and pending booking
      const startAt = new Date(Date.now() + 86400000 * 2); // 2 days in future
      const endAt = new Date(startAt.getTime() + 60 * 60 * 1000); // 60 mins

      testSlot = await AvailabilitySlot.create({
        tutorId: tutor._id,
        startAt,
        endAt,
        timezone: 'Asia/Ho_Chi_Minh',
        status: 'available',
      });

      bookingToConfirm = await Booking.create({
        learnerId: learner._id,
        tutorId: tutor._id,
        slotId: testSlot._id,
        status: BOOKING_STATUS.PENDING,
        startAt,
        endAt,
        durationMinutes: 60,
        price: 350000,
        subjectName: 'NodeJS Mastery',
        learningMode: 'online',
      });
    });

    it('Scenario A: Both Learner & Tutor connected -> automatically creates events for both on booking.confirmed', async () => {
      // Confirm booking via PATCH /api/bookings/:id/confirm
      const res = await request(app)
        .patch(`/api/bookings/${bookingToConfirm._id}/confirm`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .send({ tutorNote: 'See you in class!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.booking.status).toBe(BOOKING_STATUS.CONFIRMED);

      await waitForCondition(async () => {
        const lEv = await CalendarEvent.findOne({ bookingId: bookingToConfirm._id, userId: learner._id });
        const tEv = await CalendarEvent.findOne({ bookingId: bookingToConfirm._id, userId: tutor._id });
        return (
          lEv &&
          lEv.syncStatus === CALENDAR_SYNC_STATUS.SYNCED &&
          tEv &&
          tEv.syncStatus === CALENDAR_SYNC_STATUS.SYNCED
        );
      });

      // Verify Google Calendar API was called twice (once for Learner, once for Tutor)
      expect(createdCalendarEvents).toHaveLength(2);

      // Verify CalendarEvent records in DB
      const learnerEvent = await CalendarEvent.findOne({
        bookingId: bookingToConfirm._id,
        userId: learner._id,
      });
      const tutorEvent = await CalendarEvent.findOne({
        bookingId: bookingToConfirm._id,
        userId: tutor._id,
      });

      expect(learnerEvent).toBeDefined();
      expect(learnerEvent.syncStatus).toBe(CALENDAR_SYNC_STATUS.SYNCED);
      expect(learnerEvent.googleEventId).toBeDefined();
      expect(learnerEvent.googleHtmlLink).toBeDefined();

      expect(tutorEvent).toBeDefined();
      expect(tutorEvent.syncStatus).toBe(CALENDAR_SYNC_STATUS.SYNCED);
      expect(tutorEvent.googleEventId).toBeDefined();

      confirmedBooking = bookingToConfirm;
    });

    it('Scenario B: Only Tutor connected, Learner not connected -> syncs Tutor, marks Learner as not_connected', async () => {
      // Disconnect Learner
      await CalendarConnection.deleteOne({ userId: learner._id });

      // Create new slot and booking
      const startAt = new Date(Date.now() + 86400000 * 3);
      const endAt = new Date(startAt.getTime() + 60 * 60000);
      const s = await AvailabilitySlot.create({
        tutorId: tutor._id,
        startAt,
        endAt,
        timezone: 'Asia/Ho_Chi_Minh',
        status: 'available',
      });
      const b = await Booking.create({
        learnerId: learner._id,
        tutorId: tutor._id,
        slotId: s._id,
        status: BOOKING_STATUS.PENDING,
        startAt,
        endAt,
        durationMinutes: 60,
        price: 300000,
        subjectName: 'React Fundamentals',
      });

      const res = await request(app)
        .patch(`/api/bookings/${b._id}/confirm`)
        .set('Authorization', `Bearer ${tutorToken}`);

      expect(res.status).toBe(200);

      await waitForCondition(async () => {
        const tutorEv = await CalendarEvent.findOne({ bookingId: b._id, userId: tutor._id });
        return tutorEv && tutorEv.syncStatus === CALENDAR_SYNC_STATUS.SYNCED;
      });

      // Tutor synced, Learner not_connected
      const tutorEvent = await CalendarEvent.findOne({ bookingId: b._id, userId: tutor._id });
      const learnerEvent = await CalendarEvent.findOne({ bookingId: b._id, userId: learner._id });

      expect(tutorEvent).toBeDefined();
      expect(tutorEvent.syncStatus).toBe(CALENDAR_SYNC_STATUS.SYNCED);
      expect(learnerEvent).toBeDefined();
      expect(learnerEvent.syncStatus).toBe(CALENDAR_SYNC_STATUS.NOT_CONNECTED);
    });

    it('Scenario C: Non-rollback guarantee: Google API error does NOT rollback booking confirmation', async () => {
      shouldFailGoogleApi = true; // Simulate Google 503 outage

      const startAt = new Date(Date.now() + 86400000 * 4);
      const endAt = new Date(startAt.getTime() + 60 * 60000);
      const s = await AvailabilitySlot.create({
        tutorId: tutor._id,
        startAt,
        endAt,
        timezone: 'Asia/Ho_Chi_Minh',
        status: 'available',
      });
      const b = await Booking.create({
        learnerId: learner._id,
        tutorId: tutor._id,
        slotId: s._id,
        status: BOOKING_STATUS.PENDING,
        startAt,
        endAt,
        durationMinutes: 60,
        price: 400000,
        subjectName: 'Python for Beginners',
      });

      const res = await request(app)
        .patch(`/api/bookings/${b._id}/confirm`)
        .set('Authorization', `Bearer ${tutorToken}`);

      // Crucial: Booking MUST stay confirmed even when Google Calendar fails!
      expect(res.status).toBe(200);
      expect(res.body.data.booking.status).toBe(BOOKING_STATUS.CONFIRMED);

      await waitForCondition(async () => {
        const tutorEv = await CalendarEvent.findOne({ bookingId: b._id, userId: tutor._id });
        return tutorEv && tutorEv.syncStatus === CALENDAR_SYNC_STATUS.FAILED;
      });

      const tutorEvent = await CalendarEvent.findOne({ bookingId: b._id, userId: tutor._id });
      expect(tutorEvent).toBeDefined();
      expect(tutorEvent.syncStatus).toBe(CALENDAR_SYNC_STATUS.FAILED);
      expect(tutorEvent.errorCode).toBe('503');
      expect(tutorEvent.errorMessage).toContain('Google Calendar API');
    });

    it('Scenario D: Automatic removal on booking.cancelled -> deletes event on Google Calendar', async () => {
      // First ensure a confirmed booking with synced events exists
      const learnerEventBefore = await CalendarEvent.findOne({
        bookingId: confirmedBooking._id,
        userId: learner._id,
        syncStatus: CALENDAR_SYNC_STATUS.SYNCED,
      });
      expect(learnerEventBefore).toBeDefined();

      // Cancel the booking via learner
      const res = await request(app)
        .patch(`/api/bookings/${confirmedBooking._id}/cancel`)
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({ cancelReason: 'Bận đột xuất vào khung giờ này' });

      expect(res.status).toBe(200);
      expect(res.body.data.booking.status).toBe(BOOKING_STATUS.CANCELLED);

      await waitForCondition(async () => {
        const ev = await CalendarEvent.findOne({
          bookingId: confirmedBooking._id,
          userId: learner._id,
        });
        return ev && ev.syncStatus === CALENDAR_SYNC_STATUS.CANCELLED;
      });

      // Verify Google Calendar DELETE was triggered
      expect(deletedCalendarEvents.length).toBeGreaterThan(0);

      // Verify CalendarEvent status transitions to CANCELLED in DB
      const learnerEventAfter = await CalendarEvent.findOne({
        bookingId: confirmedBooking._id,
        userId: learner._id,
      });
      expect(learnerEventAfter.syncStatus).toBe(CALENDAR_SYNC_STATUS.CANCELLED);
    });
  });

  describe('6. Manual Sync Retry & Idempotency (POST /api/calendar/sync/retry)', () => {
    let failedBooking = null;

    beforeAll(async () => {
      // Create a booking with FAILED sync status to test retry
      const startAt = new Date(Date.now() + 86400000 * 5);
      const endAt = new Date(startAt.getTime() + 60 * 60000);
      const s = await AvailabilitySlot.create({
        tutorId: tutor._id,
        startAt,
        endAt,
        timezone: 'Asia/Ho_Chi_Minh',
        status: 'booked',
      });
      failedBooking = await Booking.create({
        learnerId: learner._id,
        tutorId: tutor._id,
        slotId: s._id,
        status: BOOKING_STATUS.CONFIRMED,
        startAt,
        endAt,
        durationMinutes: 60,
        price: 300000,
        subjectName: 'Data Structures',
      });

      await CalendarEvent.create({
        bookingId: failedBooking._id,
        userId: learner._id,
        userRole: ROLES.LEARNER,
        syncStatus: CALENDAR_SYNC_STATUS.FAILED,
        errorCode: '503',
        errorMessage: 'Temporary network timeout',
        retryCount: 0,
      });
    });

    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app)
        .post('/api/calendar/sync/retry')
        .send({ bookingId: failedBooking._id });
      expect(res.status).toBe(401);
    });

    it('should reject retry for a user not part of the booking with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/calendar/sync/retry')
        .set('Authorization', `Bearer ${otherLearnerToken}`)
        .send({ bookingId: failedBooking._id });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should retry sync successfully, transitioning status from failed -> synced and incrementing retryCount', async () => {
      const res = await request(app)
        .post('/api/calendar/sync/retry')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({ bookingId: failedBooking._id });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.syncStatus).toBe(CALENDAR_SYNC_STATUS.SYNCED);
      expect(res.body.data.googleEventId).toBeDefined();
      expect(res.body.data.retryCount).toBe(1);

      // Verify in DB
      const updated = await CalendarEvent.findOne({
        bookingId: failedBooking._id,
        userId: learner._id,
      });
      expect(updated.syncStatus).toBe(CALENDAR_SYNC_STATUS.SYNCED);
      expect(updated.retryCount).toBe(1);
    });

    it('Idempotency: Re-calling retry on already SYNCED event should NOT duplicate events', async () => {
      const initialCallCount = createdCalendarEvents.length;

      const res = await request(app)
        .post('/api/calendar/sync/retry')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({ bookingId: failedBooking._id });

      expect(res.status).toBe(200);
      expect(res.body.data.syncStatus).toBe(CALENDAR_SYNC_STATUS.SYNCED);

      // Verify no new event was created on Google Calendar
      expect(createdCalendarEvents.length).toBe(initialCallCount);
    });

    it('should allow Admin to retry sync for any booking', async () => {
      const res = await request(app)
        .post('/api/calendar/sync/retry')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ bookingId: failedBooking._id });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('7. Querying Sync History & Admin Monitoring', () => {
    it('GET /api/calendar/sync/:bookingId should return sync logs for authorized participant', async () => {
      const res = await request(app)
        .get(`/api/calendar/sync/${confirmedBooking._id}`)
        .set('Authorization', `Bearer ${learnerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].bookingId.toString()).toBe(confirmedBooking._id.toString());
    });

    it('GET /api/calendar/sync/:bookingId should block unauthorized user with 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/calendar/sync/${confirmedBooking._id}`)
        .set('Authorization', `Bearer ${otherLearnerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/calendar/admin/sync should block non-admin with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/calendar/admin/sync')
        .set('Authorization', `Bearer ${learnerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/calendar/admin/sync should allow Admin to view all sync events with pagination & filters', async () => {
      const res = await request(app)
        .get('/api/calendar/admin/sync?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('items');
      expect(res.body.data).toHaveProperty('pagination');
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(10);
      expect(res.body.data.pagination.total).toBeGreaterThan(0);
    });

    it('GET /api/calendar/admin/sync should filter correctly by syncStatus', async () => {
      const res = await request(app)
        .get(`/api/calendar/admin/sync?syncStatus=${CALENDAR_SYNC_STATUS.SYNCED}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      res.body.data.items.forEach((item) => {
        expect(item.syncStatus).toBe(CALENDAR_SYNC_STATUS.SYNCED);
      });
    });
  });

  afterAll(async () => {
    // Restore mock transport
    googleCalendarClient.clearMockTransport();

    // Clean up test data
    await User.deleteMany({ email: { $regex: /@test-phase9-calendar\.com$/i } });
    await Booking.deleteMany({});
    await AvailabilitySlot.deleteMany({});
    await CalendarConnection.deleteMany({});
    await CalendarEvent.deleteMany({});
    await TutorProfile.deleteMany({ introduction: { $regex: /test-phase9/i } });
    await disconnectDB();
  });
});
