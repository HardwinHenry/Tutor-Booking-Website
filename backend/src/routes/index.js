const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const taxonomyRoutes = require('./taxonomy.routes');
const tagRoutes = require('./tag.routes');
const questionnaireRoutes = require('./questionnaire.routes');
const adminRoutes = require('./admin.routes');
const learnerRoutes = require('./learner.routes');
const tutorRoutes = require('./tutor.routes');
const recommendationRoutes = require('./recommendation.routes');
const availabilityRoutes = require('./availability.routes');

const router = express.Router();

// Mount Module Routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/questionnaires', questionnaireRoutes);
router.use('/taxonomies', taxonomyRoutes);
router.use('/tags', tagRoutes);
router.use('/admin', adminRoutes);
router.use('/learners', learnerRoutes);
router.use('/tutors', tutorRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/availability', availabilityRoutes);

// Root API Information
router.get('/', (req, res) => {
  res.json({
    name: 'Tutor Connect Platform API',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      health: '/api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        refreshToken: 'POST /api/auth/refresh-token',
        logout: 'POST /api/auth/logout',
        me: 'GET /api/auth/me',
      },
      questionnaires: {
        learner: 'GET /api/questionnaires/learner',
        tutor: 'GET /api/questionnaires/tutor',
      },
      taxonomies: {
        list: 'GET /api/taxonomies',
        detail: 'GET /api/taxonomies/:id',
        children: 'GET /api/taxonomies/:id/children',
        tags: 'GET /api/tags',
      },
      learners: {
        myPreference: 'GET /api/learners/preferences/me',
        updatePreference: 'PUT|PATCH /api/learners/preferences/me',
        completePreference: 'POST /api/learners/preferences/complete',
      },
      tutors: {
        search: 'GET /api/tutors',
        myProfile: 'GET /api/tutors/profile/me',
        updateProfile: 'PUT|PATCH /api/tutors/profile/me',
        submitProfile: 'POST /api/tutors/profile/submit',
        publicProfile: 'GET /api/tutors/:id',
      },
      recommendations: {
        tutors: 'POST|GET /api/recommendations/tutors',
      },
      availability: {
        create: 'POST /api/availability',
        mine: 'GET /api/availability/mine',
        detail: 'GET /api/availability/:id',
        update: 'PATCH /api/availability/:id',
        delete: 'DELETE /api/availability/:id',
        tutorAvailability: 'GET /api/tutors/:id/availability',
      },
      admin: {
        createTaxonomy: 'POST /api/admin/taxonomies',
        updateTaxonomy: 'PATCH /api/admin/taxonomies/:id',
        listTutors: 'GET /api/admin/tutors',
        tutorDetail: 'GET /api/admin/tutors/:id',
        approveTutor: 'PATCH /api/admin/tutors/:id/approval',
      },
    },
  });
});

module.exports = router;
