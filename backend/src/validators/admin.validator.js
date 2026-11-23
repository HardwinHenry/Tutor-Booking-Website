const mongoose = require('mongoose');
const { ALL_ROLES } = require('../constants/roles');
const { ALL_USER_STATUSES } = require('../constants/userStatus');
const ApiError = require('../utils/apiError');

/**
 * Validate admin query for listing users
 */
const validateGetAdminUsers = (req, res, next) => {
  const { role, status, page, limit, sortBy, sortOrder } = req.query;
  const errors = [];

  if (role && !ALL_ROLES.includes(role)) {
    errors.push(`Vai trò (role) không hợp lệ. Cho phép: ${ALL_ROLES.join(', ')}`);
  }

  if (status && !ALL_USER_STATUSES.includes(status)) {
    errors.push(`Trạng thái (status) không hợp lệ. Cho phép: ${ALL_USER_STATUSES.join(', ')}`);
  }

  if (page !== undefined) {
    const pageNum = Number(page);
    if (!Number.isInteger(pageNum) || pageNum < 1) {
      errors.push('Trang (page) phải là số nguyên dương >= 1');
    }
  }

  if (limit !== undefined) {
    const limitNum = Number(limit);
    if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push('Số lượng (limit) phải là số nguyên dương từ 1 đến 100');
    }
  }

  const allowedSortBy = ['createdAt', 'name', 'email', 'status', 'role', 'updatedAt'];
  if (sortBy && !allowedSortBy.includes(sortBy)) {
    errors.push(`Trường sắp xếp không hợp lệ. Cho phép: ${allowedSortBy.join(', ')}`);
  }

  if (sortOrder && !['asc', 'desc'].includes(sortOrder.toLowerCase())) {
    errors.push('Thứ tự sắp xếp phải là "asc" hoặc "desc"');
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Tham số lọc người dùng không hợp lệ', errors));
  }

  next();
};

/**
 * Validate user ID param
 */
const validateUserIdParam = (req, res, next) => {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return next(ApiError.badRequest('ID người dùng không hợp lệ'));
  }
  next();
};

/**
 * Validate update user status
 */
const validateUpdateUserStatus = (req, res, next) => {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return next(ApiError.badRequest('ID người dùng không hợp lệ'));
  }

  const { status, reason } = req.body;
  const errors = [];

  if (!status) {
    errors.push('Trạng thái (status) là bắt buộc');
  } else if (!ALL_USER_STATUSES.includes(status)) {
    errors.push(`Trạng thái không hợp lệ. Cho phép: ${ALL_USER_STATUSES.join(', ')}`);
  }

  if (reason !== undefined && reason !== null) {
    if (typeof reason !== 'string') {
      errors.push('Lý do (reason) phải là chuỗi ký tự');
    } else if (reason.length > 500) {
      errors.push('Lý do không được vượt quá 500 ký tự');
    }
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Dữ liệu cập nhật trạng thái không hợp lệ', errors));
  }

  next();
};

/**
 * Validate update review visibility
 */
const validateUpdateReviewVisibility = (req, res, next) => {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return next(ApiError.badRequest('ID đánh giá không hợp lệ'));
  }

  const { isPublic } = req.body;
  if (typeof isPublic !== 'boolean') {
    return next(ApiError.badRequest('Trường isPublic là bắt buộc và phải có kiểu boolean'));
  }

  next();
};

module.exports = {
  validateGetAdminUsers,
  validateUserIdParam,
  validateUpdateUserStatus,
  validateUpdateReviewVisibility,
};
