const express = require('express');
const taxonomyController = require('../controllers/taxonomy.controller');
const { validateTaxonomyIdParam } = require('../validators/taxonomy.validator');

const router = express.Router();

// GET /api/taxonomies - List taxonomies with filter (type, parentId, active, search)
router.get('/', taxonomyController.getTaxonomies);

// GET /api/taxonomies/:id/children - List direct children (Category -> Subject -> Topic)
router.get('/:id/children', validateTaxonomyIdParam, taxonomyController.getChildren);

// GET /api/taxonomies/:id - Get specific taxonomy details
router.get('/:id', validateTaxonomyIdParam, taxonomyController.getTaxonomyById);

module.exports = router;
