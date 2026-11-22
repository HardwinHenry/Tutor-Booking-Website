const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');
const learnerPreferenceController = require('../controllers/learnerPreference.controller');
const {
  validateUpdateLearnerPreference,
  validateCompleteLearnerPreference,
} = require('../validators/learnerPreference.validator');

const router = express.Router();

// All learner preference routes require authentication and learner/admin role
router.use(authenticate);
router.use(authorize(ROLES.LEARNER, ROLES.ADMIN));

router.get('/preferences/me', learnerPreferenceController.getMyPreference);
router.put(
  '/preferences/me',
  validateUpdateLearnerPreference,
  learnerPreferenceController.updateMyPreference
);
router.patch(
  '/preferences/me',
  validateUpdateLearnerPreference,
  learnerPreferenceController.updateMyPreference
);
router.post(
  '/preferences/complete',
  validateCompleteLearnerPreference,
  learnerPreferenceController.completeMyPreference
);

module.exports = router;
