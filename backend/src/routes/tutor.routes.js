const express = require('express');
const { authenticate, optionalAuthenticate, authorize } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');
const tutorProfileController = require('../controllers/tutorProfile.controller');
const {
  validateUpdateTutorProfile,
  validateSubmitTutorProfile,
} = require('../validators/tutorProfile.validator');

const router = express.Router();

// 1. Private Tutor Profile Management (Authenticated Tutor / Admin)
router.get(
  '/profile/me',
  authenticate,
  authorize(ROLES.TUTOR, ROLES.ADMIN),
  tutorProfileController.getMyProfile
);

router.put(
  '/profile/me',
  authenticate,
  authorize(ROLES.TUTOR, ROLES.ADMIN),
  validateUpdateTutorProfile,
  tutorProfileController.updateMyProfile
);

router.patch(
  '/profile/me',
  authenticate,
  authorize(ROLES.TUTOR, ROLES.ADMIN),
  validateUpdateTutorProfile,
  tutorProfileController.updateMyProfile
);

router.post(
  '/profile/submit',
  authenticate,
  authorize(ROLES.TUTOR, ROLES.ADMIN),
  validateSubmitTutorProfile,
  tutorProfileController.submitMyProfile
);

// 2. Public Tutor Profile View (Optional auth for admin checks)
router.get('/:id', optionalAuthenticate, tutorProfileController.getPublicProfile);

module.exports = router;
