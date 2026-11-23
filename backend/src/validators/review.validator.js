const mongoose = require('mongoose');
const ApiError = require('../utils/apiError');

/**
 * Validate review creation payload
 * Body: { bookingId, rating, comment }
 */
const validateCreateReview = (req, res, next) => {
  const { bookingId, rating, comment } = req.body;
  const errors = [];

  if (!bookingId) {
    errors.push('ID booking (bookingId) là bắt buộc');
  } else if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    errors.push('ID booking (bookingId) không đúng định dạng');
  }

  if (rating === undefined || rating === null) {
    errors.push('Điểm đánh giá (rating) là bắt buộc');
  } else if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.push('Điểm đánh giá (rating) phải là số nguyên từ 1 đến 5 sao');
  }

  if (comment !== undefined && comment !== null) {
    if (typeof comment !== 'string') {
      errors.push('Nội dung đánh giá (comment) phải là chuỗi văn bản');
    } else if (comment.trim().length > 1000) {
      errors.push('Nội dung đánh giá không được vượt quá 1000 ký tự');
    }
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Dữ liệu đánh giá không hợp lệ', errors));
  }

  // Sanitize comment
  if (req.body.comment) {
    req.body.comment = req.body.comment.trim();
  }

  next();
};

/**
 * Validate tutor ID param for fetching reviews
 */
const validateTutorReviewsQuery = (req, res, next) => {
  const { id } = req.params;
  const errors = [];

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    errors.push('ID gia sư không đúng định dạng');
  }

  const { page, limit, rating } = req.query;

  if (page !== undefined) {
    const pageNum = Number(page);
    if (!Number.isInteger(pageNum) || pageNum < 1) {
      errors.push('Trang (page) phải là số nguyên dương >= 1');
    }
  }

  if (limit !== undefined) {
    const limitNum = Number(limit);
    if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 50) {
      errors.push('Số lượng (limit) phải là số nguyên dương từ 1 đến 50');
    }
  }

  if (rating !== undefined) {
    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      errors.push('Bộ lọc điểm số (rating) phải từ 1 đến 5');
    }
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Tham số truy vấn không hợp lệ', errors));
  }

  next();
};

/**
 * Validate review ID param
 */
const validateReviewIdParam = (req, res, next) => {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return next(ApiError.badRequest('ID đánh giá không hợp lệ'));
  }
  next();
};

/**
 * Validate tutor response payload
 */
const validateTutorResponse = (req, res, next) => {
  const { comment } = req.body;
  const errors = [];

  if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
    errors.push('Nội dung phản hồi (comment) là bắt buộc');
  } else if (comment.trim().length > 1000) {
    errors.push('Nội dung phản hồi không được vượt quá 1000 ký tự');
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Dữ liệu phản hồi không hợp lệ', errors));
  }

  req.body.comment = comment.trim();
  next();
};

module.exports = {
  validateCreateReview,
  validateTutorReviewsQuery,
  validateReviewIdParam,
  validateTutorResponse,
};
