const express = require('express');
const taxonomyController = require('../controllers/taxonomy.controller');

const router = express.Router();

// GET /api/tags - Convenience endpoint for taxonomies and general tags
router.get('/', taxonomyController.getTags);

module.exports = router;
