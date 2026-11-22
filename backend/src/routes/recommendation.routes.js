const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');
const recommendationController = require('../controllers/recommendation.controller');
const { validateRecommendationRequest } = require('../validators/recommendation.validator');

const router = express.Router();

/**
 * Route: Content-based Filtering Tutor Recommendations (Phase 6)
 * POST /api/recommendations/tutors
 * GET  /api/recommendations/tutors
 * Access: Learner (and Admin)
 */
router.post(
  '/tutors',
  authenticate,
  authorize(ROLES.LEARNER, ROLES.ADMIN),
  validateRecommendationRequest,
  recommendationController.getTutorRecommendations
);

router.get(
  '/tutors',
  authenticate,
  authorize(ROLES.LEARNER, ROLES.ADMIN),
  validateRecommendationRequest,
  recommendationController.getTutorRecommendations
);

module.exports = router;
