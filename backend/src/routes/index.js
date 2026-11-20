const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const taxonomyRoutes = require('./taxonomy.routes');
const tagRoutes = require('./tag.routes');
const questionnaireRoutes = require('./questionnaire.routes');
const adminRoutes = require('./admin.routes');

const router = express.Router();

// Mount Module Routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/questionnaires', questionnaireRoutes);
router.use('/taxonomies', taxonomyRoutes);
router.use('/tags', tagRoutes);
router.use('/admin', adminRoutes);

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
      admin: {
        createTaxonomy: 'POST /api/admin/taxonomies',
        updateTaxonomy: 'PATCH /api/admin/taxonomies/:id',
      },
    },
  });
});

module.exports = router;
