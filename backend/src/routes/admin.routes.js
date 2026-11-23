const express = require('express');
const taxonomyController = require('../controllers/taxonomy.controller');
const tutorProfileController = require('../controllers/tutorProfile.controller');
const bookingController = require('../controllers/booking.controller');
const adminController = require('../controllers/admin.controller');
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
const {
  validateGetAdminUsers,
  validateUserIdParam,
  validateUpdateUserStatus,
  validateUpdateReviewVisibility,
} = require('../validators/admin.validator');
const { validateAdminCalendarSyncQuery } = require('../validators/calendar.validator');

const router = express.Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate, authorize(ROLES.ADMIN));

// 1. Taxonomy Admin Routes (Phase 3)
router.post('/taxonomies', validateCreateTaxonomy, taxonomyController.createTaxonomy);
router.patch(
  '/taxonomies/:id',
  validateTaxonomyIdParam,
  validateUpdateTaxonomy,
  taxonomyController.updateTaxonomy
);

// 2. Tutor Approval & Management Routes (Phase 5)
router.get('/tutors', validateGetAdminTutors, tutorProfileController.getAdminTutors);
router.get('/tutors/:id', validateTutorIdParam, tutorProfileController.getAdminTutorDetail);
router.patch(
  '/tutors/:id/approval',
  validateTutorIdParam,
  validateTutorApproval,
  tutorProfileController.updateTutorApproval
);

// 3. Booking Management Routes (Phase 8)
router.get('/bookings', validateGetBookingsQuery, bookingController.adminListBookings);

// 4. User Management Routes (Phase 10)
router.get('/users', validateGetAdminUsers, adminController.listUsers);
router.get('/users/:id', validateUserIdParam, adminController.getUserDetail);
router.patch(
  '/users/:id/status',
  validateUserIdParam,
  validateUpdateUserStatus,
  adminController.updateUserStatus
);

// 5. Review Moderation Routes (Phase 10)
router.get('/reviews', adminController.listReviews);
router.patch(
  '/reviews/:id/visibility',
  validateUpdateReviewVisibility,
  adminController.updateReviewVisibility
);

// 6. Calendar Sync Monitoring Route (Phase 9 & 10)
router.get(
  '/calendar-sync',
  validateAdminCalendarSyncQuery,
  adminController.getCalendarSync
);

module.exports = router;
