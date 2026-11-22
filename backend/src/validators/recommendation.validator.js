const mongoose = require('mongoose');
const ApiError = require('../utils/apiError');
const { ROLES } = require('../constants/roles');

const isValidObjectId = (id) => id && mongoose.Types.ObjectId.isValid(id);

const ALLOWED_RECOMMENDATION_KEYS = new Set([
  'page',
  'limit',
  'minScore',
  'categoryId',
  'subjectId',
  'mode',
  'strictBudget',
  'learnerId',
]);

/**
 * Middleware: Validate recommendation request parameters
 */
const validateRecommendationRequest = (req, res, next) => {
  const errors = [];
  const source = { ...req.query, ...req.body };

  // Check unwhitelisted keys
  for (const key of Object.keys(source)) {
    if (!ALLOWED_RECOMMENDATION_KEYS.has(key)) {
      errors.push({
        field: key,
        message: `Tham số "${key}" không nằm trong danh sách cho phép (whitelist)`,
      });
    }
  }

  // Validate ObjectId fields
  if (source.categoryId && !isValidObjectId(source.categoryId)) {
    errors.push({
      field: 'categoryId',
      message: 'Category ID phải là ObjectId hợp lệ',
    });
  }

  if (source.subjectId && !isValidObjectId(source.subjectId)) {
    errors.push({
      field: 'subjectId',
      message: 'Subject ID phải là ObjectId hợp lệ',
    });
  }

  if (source.mode && !isValidObjectId(source.mode)) {
    errors.push({
      field: 'mode',
      message: 'Mode ID phải là ObjectId hợp lệ',
    });
  }

  if (source.learnerId) {
    if (!isValidObjectId(source.learnerId)) {
      errors.push({
        field: 'learnerId',
        message: 'Learner ID phải là ObjectId hợp lệ',
      });
    }
    // Only Admin is allowed to specify a target learnerId
    if (req.user && req.user.role !== ROLES.ADMIN) {
      delete source.learnerId;
      if (req.body) delete req.body.learnerId;
      if (req.query) delete req.query.learnerId;
    }
  }

  // Validate pagination
  if (source.page !== undefined) {
    const pageNum = Number(source.page);
    if (!Number.isInteger(pageNum) || pageNum < 1) {
      errors.push({
        field: 'page',
        message: 'Trang (page) phải là số nguyên dương lớn hơn hoặc bằng 1',
      });
    }
  }

  if (source.limit !== undefined) {
    const limitNum = Number(source.limit);
    if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 50) {
      errors.push({
        field: 'limit',
        message: 'Giới hạn (limit) phải là số nguyên từ 1 đến 50',
      });
    }
  }

  // Validate minScore
  if (source.minScore !== undefined) {
    const minScoreNum = Number(source.minScore);
    if (isNaN(minScoreNum) || minScoreNum < 0 || minScoreNum > 100) {
      errors.push({
        field: 'minScore',
        message: 'Điểm sàn gợi ý (minScore) phải là số từ 0 đến 100',
      });
    }
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Dữ liệu yêu cầu gợi ý gia sư không hợp lệ', errors));
  }

  next();
};

module.exports = {
  validateRecommendationRequest,
};
