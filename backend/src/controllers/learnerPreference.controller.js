const learnerPreferenceService = require('../services/learnerPreference.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get current learner's preference
 * GET /api/learners/preferences/me
 */
const getMyPreference = asyncHandler(async (req, res) => {
  const shouldPopulate = req.query.populate !== 'false';
  const preference = await learnerPreferenceService.getPreferenceByUserId(req.user._id, {
    populate: shouldPopulate,
  });
  return ApiResponse.ok(res, { preference }, 'Lấy thông tin nhu cầu học tập thành công');
});

/**
 * Update / save draft of learner preference
 * PUT /api/learners/preferences/me, PATCH /api/learners/preferences/me
 */
const updateMyPreference = asyncHandler(async (req, res) => {
  const preference = await learnerPreferenceService.updatePreference(req.user._id, req.body);
  return ApiResponse.ok(res, { preference }, 'Cập nhật tiến độ nhu cầu học tập thành công');
});

/**
 * Complete learner onboarding
 * POST /api/learners/preferences/complete
 */
const completeMyPreference = asyncHandler(async (req, res) => {
  const preference = await learnerPreferenceService.completePreference(req.user._id, req.body);
  return ApiResponse.ok(res, { preference }, 'Hoàn tất onboarding nhu cầu học tập thành công');
});

module.exports = {
  getMyPreference,
  updateMyPreference,
  completeMyPreference,
};
