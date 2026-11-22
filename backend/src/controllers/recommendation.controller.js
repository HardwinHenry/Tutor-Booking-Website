const recommendationService = require('../services/recommendation.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../constants/roles');

/**
 * Get personalized tutor recommendations for authenticated learner
 * POST /api/recommendations/tutors, GET /api/recommendations/tutors
 */
const getTutorRecommendations = asyncHandler(async (req, res) => {
  // Always derive learnerId from authenticated token.
  // Only Admin can optionally provide a target learnerId to preview recommendations.
  let targetLearnerId = req.user._id;
  if (req.user.role === ROLES.ADMIN && (req.body.learnerId || req.query.learnerId)) {
    targetLearnerId = req.body.learnerId || req.query.learnerId;
  }

  const options = {
    ...req.query,
    ...req.body,
  };

  const result = await recommendationService.getRecommendationsForLearner(targetLearnerId, options);

  return ApiResponse.ok(res, result, 'Lấy danh sách gợi ý gia sư thành công');
});

module.exports = {
  getTutorRecommendations,
};
