const express = require('express');
const taxonomyController = require('../controllers/taxonomy.controller');
const tutorProfileController = require('../controllers/tutorProfile.controller');
const bookingController = require('../controllers/booking.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');
const {
  validateTaxonomyIdParam,
  validateCreateTaxonomy,
  validateUpdateTaxonomy,
} = require('../validators/taxonomy.validator');
const {
  validateTutorIdParam,
  validateTutorApproval,
  validateGetAdminTutors,
} = require('../validators/tutorProfile.validator');
const { validateGetBookingsQuery } = require('../validators/booking.validator');

const router = express.Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate, authorize(ROLES.ADMIN));

// Taxonomy Admin Routes
router.post('/taxonomies', validateCreateTaxonomy, taxonomyController.createTaxonomy);
router.patch(
  '/taxonomies/:id',
  validateTaxonomyIdParam,
  validateUpdateTaxonomy,
  taxonomyController.updateTaxonomy
);

// Tutor Approval & Management Routes (Phase 5)
router.get('/tutors', validateGetAdminTutors, tutorProfileController.getAdminTutors);
router.get('/tutors/:id', validateTutorIdParam, tutorProfileController.getAdminTutorDetail);
router.patch(
  '/tutors/:id/approval',
  validateTutorIdParam,
  validateTutorApproval,
  tutorProfileController.updateTutorApproval
);

// Booking Management Routes (Phase 8)
router.get('/bookings', validateGetBookingsQuery, bookingController.adminListBookings);

module.exports = router;
