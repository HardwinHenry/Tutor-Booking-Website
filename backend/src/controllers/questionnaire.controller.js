const questionnaireService = require('../services/questionnaire.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/questionnaires/:role
 * Retrieve the 28-question questionnaire metadata and options for learner or tutor
 */
const getQuestionnaire = asyncHandler(async (req, res) => {
  const { role } = req.params;
  const { version } = req.query;

  const data = await questionnaireService.getQuestionnaireByRole(role, version);
  return ApiResponse.ok(res, data, `Lấy bộ câu hỏi cho vai trò ${role} thành công`);
});

module.exports = {
  getQuestionnaire,
};
