const request = require('supertest');
const express = require('express');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/user.model');
const { ROLES } = require('../src/constants/roles');
const { USER_STATUS } = require('../src/constants/userStatus');
const { authenticate, authorize } = require('../src/middlewares/auth');
const errorHandler = require('../src/middlewares/errorHandler');

// Create an isolated sub-app to test RBAC protected endpoints via HTTP
const rbacTestApp = express();
rbacTestApp.use(express.json());
rbacTestApp.get('/test/learner-only', authenticate, authorize(ROLES.LEARNER), (req, res) => {
  res.status(200).json({ success: true, message: 'Learner access granted' });
});
rbacTestApp.get('/test/tutor-only', authenticate, authorize(ROLES.TUTOR), (req, res) => {
  res.status(200).json({ success: true, message: 'Tutor access granted' });
});
rbacTestApp.get('/test/admin-only', authenticate, authorize(ROLES.ADMIN), (req, res) => {
  res.status(200).json({ success: true, message: 'Admin access granted' });
});
rbacTestApp.use(errorHandler);

describe('Authentication & Authorization Module (Phase 2)', () => {
  beforeAll(async () => {
    await connectDB();
    // Clean up test users from previous runs
    await User.deleteMany({ email: { $regex: /@test-phase2\.com$/i } });
  }, 20000);

  afterAll(async () => {
    await User.deleteMany({ email: { $regex: /@test-phase2\.com$/i } });
    await disconnectDB();
  }, 20000);

  const testLearner = {
    name: 'Nguyen Van A',
    email: 'learner1@test-phase2.com',
    password: 'Password123',
    role: 'learner',
  };

  const testTutor = {
    name: 'Tran Thi B',
    email: 'tutor1@test-phase2.com',
    password: 'Password456',
    role: 'tutor',
  };

  let learnerAccessToken = '';
  let learnerRefreshToken = '';
  let tutorAccessToken = '';

  // ----------------------------------------------------
  // 1. REGISTRATION TESTS
  // ----------------------------------------------------
  describe('POST /api/auth/register', () => {
    it('should register a new learner successfully with status 201', async () => {
      const res = await request(app).post('/api/auth/register').send(testLearner);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');

      // Ensure sensitive data is not returned
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.user.email).toBe(testLearner.email);
      expect(res.body.data.user.role).toBe(ROLES.LEARNER);
      expect(res.body.data.user.status).toBe(USER_STATUS.ACTIVE);
      expect(res.body.data.user.passwordHash).toBeUndefined();
      expect(res.body.data.user.refreshToken).toBeUndefined();
    });

    it('should register a tutor account successfully', async () => {
      const res = await request(app).post('/api/auth/register').send(testTutor);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe(ROLES.TUTOR);
      tutorAccessToken = res.body.data.accessToken;
    });

    it('should reject registration when email already exists with 409 Conflict', async () => {
      const res = await request(app).post('/api/auth/register').send(testLearner);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('đã được sử dụng');
    });

    it('should reject registration when name is missing or too short', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'A',
        email: 'invalid-name@test-phase2.com',
        password: 'Password123',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'name' })])
      );
    });

    it('should reject registration with invalid email format', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'invalid-email-format',
        password: 'Password123',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'email' })])
      );
    });

    it('should reject registration when password is less than 6 characters', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'shortpass@test-phase2.com',
        password: '123',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'password' })])
      );
    });

    it('should reject registration attempting to set admin role', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Hacker Admin',
        email: 'hacker@test-phase2.com',
        password: 'Password123',
        role: 'admin',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'role' })])
      );
    });
  });

  // ----------------------------------------------------
  // 2. LOGIN TESTS
  // ----------------------------------------------------
  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials and return tokens', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testLearner.email,
        password: testLearner.password,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.user.email).toBe(testLearner.email);

      learnerAccessToken = res.body.data.accessToken;
      learnerRefreshToken = res.body.data.refreshToken;
    });

    it('should normalize email on login (case insensitive)', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'LEARNER1@TEST-PHASE2.COM',
        password: testLearner.password,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      learnerAccessToken = res.body.data.accessToken;
      learnerRefreshToken = res.body.data.refreshToken;
    });

    it('should reject login when password is incorrect with 401', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testLearner.email,
        password: 'WrongPassword999',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('không chính xác');
    });

    it('should reject login when email does not exist with 401', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@test-phase2.com',
        password: 'Password123',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject login when account is locked with 403 Forbidden', async () => {
      // Create a locked user
      const lockedUser = await User.create({
        name: 'Locked User',
        email: 'locked@test-phase2.com',
        passwordHash: await User.hashPassword('Password123'),
        role: ROLES.LEARNER,
        status: USER_STATUS.LOCKED,
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'locked@test-phase2.com',
        password: 'Password123',
      });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('bị khóa');

      await User.findByIdAndDelete(lockedUser._id);
    });

    it('should reject login when account is disabled with 403 Forbidden', async () => {
      // Create a disabled user
      const disabledUser = await User.create({
        name: 'Disabled User',
        email: 'disabled@test-phase2.com',
        passwordHash: await User.hashPassword('Password123'),
        role: ROLES.LEARNER,
        status: USER_STATUS.DISABLED,
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'disabled@test-phase2.com',
        password: 'Password123',
      });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('bị vô hiệu hóa');

      await User.findByIdAndDelete(disabledUser._id);
    });
  });

  // ----------------------------------------------------
  // 3. REFRESH TOKEN TESTS
  // ----------------------------------------------------
  describe('POST /api/auth/refresh-token & /api/auth/refresh', () => {
    it('should issue new access and refresh token using /api/auth/refresh', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: learnerRefreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');

      // Update test variables with rotated refresh token
      learnerAccessToken = res.body.data.accessToken;
      learnerRefreshToken = res.body.data.refreshToken;
    });

    it('should issue new access and refresh token when given valid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: learnerRefreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');

      // Update test variables with rotated refresh token
      learnerAccessToken = res.body.data.accessToken;
      const oldRefreshToken = learnerRefreshToken;
      learnerRefreshToken = res.body.data.refreshToken;

      // Old refresh token must be invalidated (Token Rotation)
      const reuseRes = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: oldRefreshToken });

      expect(reuseRes.status).toBe(401);
      expect(reuseRes.body.success).toBe(false);
    });

    it('should reject invalid refresh token with 401', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalid.jwt.token' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject when refresh token is missing with 400', async () => {
      const res = await request(app).post('/api/auth/refresh-token').send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ----------------------------------------------------
  // 4. GET /api/auth/me (CURRENT USER PROFILE)
  // ----------------------------------------------------
  describe('GET /api/auth/me', () => {
    it('should return profile of currently authenticated user', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${learnerAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testLearner.email);
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('should reject access with 401 when no token is provided', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject access with 401 when token is invalid', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer totally.invalid.token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ----------------------------------------------------
  // 5. ROLE-BASED ACCESS CONTROL (RBAC) TESTS
  // ----------------------------------------------------
  describe('RBAC Middleware (authorize)', () => {
    it('should allow learner to access learner-only route', async () => {
      const res = await request(rbacTestApp)
        .get('/test/learner-only')
        .set('Authorization', `Bearer ${learnerAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should block learner from tutor-only route with 403 Forbidden', async () => {
      const res = await request(rbacTestApp)
        .get('/test/tutor-only')
        .set('Authorization', `Bearer ${learnerAccessToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Bạn không có quyền');
    });

    it('should allow tutor to access tutor-only route', async () => {
      const res = await request(rbacTestApp)
        .get('/test/tutor-only')
        .set('Authorization', `Bearer ${tutorAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should block tutor from admin-only route with 403 Forbidden', async () => {
      const res = await request(rbacTestApp)
        .get('/test/admin-only')
        .set('Authorization', `Bearer ${tutorAccessToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // ----------------------------------------------------
  // 6. LOGOUT TESTS
  // ----------------------------------------------------
  describe('POST /api/auth/logout', () => {
    it('should log out successfully and revoke refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${learnerAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Using the refresh token after logout must now fail
      const refreshAfterLogout = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: learnerRefreshToken });

      expect(refreshAfterLogout.status).toBe(401);
      expect(refreshAfterLogout.body.success).toBe(false);
    });
  });
});
