const express = require('express');
const bookingController = require('../controllers/booking.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');
const {
  validateBookingIdParam,
  validateCreateBooking,
  validateConfirmBooking,
  validateRejectBooking,
  validateCancelBooking,
  validateCompleteBooking,
  validateGetBookingsQuery,
} = require('../validators/booking.validator');

const router = express.Router();

// All booking routes require authentication
router.use(authenticate);

// POST /api/bookings - Learner or Admin creates booking
router.post(
  '/',
  authorize(ROLES.LEARNER, ROLES.ADMIN),
  validateCreateBooking,
  bookingController.createBooking
);

// GET /api/bookings/me - Current user's bookings (learner or tutor)
router.get('/me', validateGetBookingsQuery, bookingController.getMyBookings);

// GET /api/bookings/:id - Single booking detail
router.get('/:id', validateBookingIdParam, bookingController.getBookingById);

// PATCH /api/bookings/:id/confirm - Tutor or Admin confirms booking
router.patch(
  '/:id/confirm',
  authorize(ROLES.TUTOR, ROLES.ADMIN),
  validateBookingIdParam,
  validateConfirmBooking,
  bookingController.confirmBooking
);

// PATCH /api/bookings/:id/reject - Tutor or Admin rejects booking
router.patch(
  '/:id/reject',
  authorize(ROLES.TUTOR, ROLES.ADMIN),
  validateBookingIdParam,
  validateRejectBooking,
  bookingController.rejectBooking
);

// PATCH /api/bookings/:id/cancel - Learner, Tutor, or Admin cancels booking
router.patch(
  '/:id/cancel',
  validateBookingIdParam,
  validateCancelBooking,
  bookingController.cancelBooking
);

// PATCH /api/bookings/:id/complete - Tutor or Admin completes booking
router.patch(
  '/:id/complete',
  authorize(ROLES.TUTOR, ROLES.ADMIN),
  validateBookingIdParam,
  validateCompleteBooking,
  bookingController.completeBooking
);

module.exports = router;
