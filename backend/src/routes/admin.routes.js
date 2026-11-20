const express = require('express');
const taxonomyController = require('../controllers/taxonomy.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');
const {
  validateTaxonomyIdParam,
  validateCreateTaxonomy,
  validateUpdateTaxonomy,
} = require('../validators/taxonomy.validator');

const router = express.Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate, authorize(ROLES.ADMIN));

// POST /api/admin/taxonomies - Create new taxonomy
router.post('/taxonomies', validateCreateTaxonomy, taxonomyController.createTaxonomy);

// PATCH /api/admin/taxonomies/:id - Update or deactivate taxonomy
router.patch(
  '/taxonomies/:id',
  validateTaxonomyIdParam,
  validateUpdateTaxonomy,
  taxonomyController.updateTaxonomy
);

module.exports = router;
