const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');
const availabilityController = require('../controllers/availability.controller');
const {
  validateCreateSlot,
  validateUpdateSlot,
  validateSlotIdParam,
  validateGetMySlots,
  validateTutorIdParam,
  validateGetTutorAvailability,
} = require('../validators/availability.validator');

const router = express.Router();

/**
 * 1. Tutor Private Availability Management
 */
router.post(
  '/',
  authenticate,
  authorize(ROLES.TUTOR, ROLES.ADMIN),
  validateCreateSlot,
  availabilityController.createSlot
);

router.get(
  '/mine',
  authenticate,
  authorize(ROLES.TUTOR, ROLES.ADMIN),
  validateGetMySlots,
  availabilityController.getMySlots
);

router.get(
  '/:id',
  authenticate,
  validateSlotIdParam,
  availabilityController.getSlotById
);

router.patch(
  '/:id',
  authenticate,
  authorize(ROLES.TUTOR, ROLES.ADMIN),
  validateUpdateSlot,
  availabilityController.updateSlot
);

router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.TUTOR, ROLES.ADMIN),
  validateSlotIdParam,
  availabilityController.deleteSlot
);

/**
 * 2. Public / Learner check tutor availability
 * GET /api/availability/tutors/:id (also available via /api/tutors/:id/availability)
 */
router.get(
  '/tutors/:id',
  validateTutorIdParam,
  validateGetTutorAvailability,
  availabilityController.getTutorAvailability
);

module.exports = router;
