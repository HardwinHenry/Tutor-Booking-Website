const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');
const reviewController = require('../controllers/review.controller');
const {
  validateCreateReview,
  validateTutorReviewsQuery,
  validateReviewIdParam,
  validateTutorResponse,
} = require('../validators/review.validator');

const router = express.Router();

// 1. Create a review for a completed session (Learner only)
router.post(
  '/',
  authenticate,
  authorize(ROLES.LEARNER),
  validateCreateReview,
  reviewController.createReview
);

// 2. Get reviews submitted by current learner
router.get('/mine', authenticate, authorize(ROLES.LEARNER), reviewController.getMyReviews);

// 3. Get review of a specific booking
router.get('/booking/:bookingId', authenticate, reviewController.getBookingReview);

// 4. Tutor response to a review
router.post(
  '/:id/response',
  authenticate,
  authorize(ROLES.TUTOR, ROLES.ADMIN),
  validateReviewIdParam,
  validateTutorResponse,
  reviewController.respondToReview
);

// 5. Direct review route alias for tutor's reviews
router.get('/tutor/:id', validateTutorReviewsQuery, reviewController.getTutorReviews);

module.exports = router;
