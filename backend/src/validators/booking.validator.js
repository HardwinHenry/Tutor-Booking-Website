const mongoose = require('mongoose');
const ApiError = require('../utils/apiError');
const { ALL_BOOKING_STATUSES } = require('../constants/bookingStatus');

const isValidObjectId = (id) => id && mongoose.Types.ObjectId.isValid(id);

const isValidISODate = (val) => {
  if (!val) return false;
  const d = new Date(val);
  return !isNaN(d.getTime());
};

/**
 * Validate booking ID in route parameters
 */
const validateBookingIdParam = (req, res, next) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return next(ApiError.badRequest('ID booking không đúng định dạng ObjectId'));
  }
  next();
};

/**
 * Validate booking creation request
 * POST /api/bookings
 */
const validateCreateBooking = (req, res, next) => {
  req.body = req.body || {};
  const allowedKeys = [
    'slotId',
    'subjectId',
    'subjectName',
    'learningMode',
    'location',
    'learnerNote',
  ];

  const extraKeys = Object.keys(req.body).filter((key) => !allowedKeys.includes(key));
  if (extraKeys.length > 0) {
    return next(
      ApiError.badRequest(
        `Dữ liệu gửi lên chứa trường không được phép: ${extraKeys.join(', ')}`
      )
    );
  }

  const { slotId, subjectId, subjectName, learningMode, location, learnerNote } = req.body;
  const errors = [];

  // slotId is required
  if (!slotId) {
    errors.push({ field: 'slotId', message: 'ID lịch dạy (slotId) là bắt buộc' });
  } else if (!isValidObjectId(slotId)) {
    errors.push({ field: 'slotId', message: 'slotId không đúng định dạng ObjectId' });
  }

  // subjectId is optional
  if (subjectId !== undefined && subjectId !== null && !isValidObjectId(subjectId)) {
    errors.push({ field: 'subjectId', message: 'subjectId không đúng định dạng ObjectId' });
  }

  // subjectName
  if (subjectName !== undefined && typeof subjectName !== 'string') {
    errors.push({ field: 'subjectName', message: 'Tên môn học phải là chuỗi' });
  } else if (subjectName && subjectName.length > 100) {
    errors.push({ field: 'subjectName', message: 'Tên môn học không được vượt quá 100 ký tự' });
  }

  // learningMode
  if (learningMode !== undefined && typeof learningMode !== 'string') {
    errors.push({ field: 'learningMode', message: 'Hình thức học phải là chuỗi' });
  }

  // location
  if (location !== undefined && typeof location !== 'string') {
    errors.push({ field: 'location', message: 'Địa điểm/Link học phải là chuỗi' });
  } else if (location && location.length > 255) {
    errors.push({ field: 'location', message: 'Địa điểm không được vượt quá 255 ký tự' });
  }

  // learnerNote
  if (learnerNote !== undefined && typeof learnerNote !== 'string') {
    errors.push({ field: 'learnerNote', message: 'Ghi chú phải là chuỗi' });
  } else if (learnerNote && learnerNote.length > 500) {
    errors.push({ field: 'learnerNote', message: 'Ghi chú không được vượt quá 500 ký tự' });
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Dữ liệu đặt lịch không hợp lệ', errors));
  }

  next();
};

/**
 * Validate booking confirmation
 * PATCH /api/bookings/:id/confirm
 */
const validateConfirmBooking = (req, res, next) => {
  req.body = req.body || {};
  const allowedKeys = ['tutorNote'];
  const extraKeys = Object.keys(req.body).filter((key) => !allowedKeys.includes(key));
  if (extraKeys.length > 0) {
    return next(
      ApiError.badRequest(
        `Dữ liệu gửi lên chứa trường không được phép: ${extraKeys.join(', ')}`
      )
    );
  }

  const { tutorNote } = req.body;
  if (tutorNote !== undefined) {
    if (typeof tutorNote !== 'string') {
      return next(ApiError.badRequest('Ghi chú của gia sư phải là chuỗi'));
    }
    if (tutorNote.length > 500) {
      return next(ApiError.badRequest('Ghi chú của gia sư không được vượt quá 500 ký tự'));
    }
  }

  next();
};

/**
 * Validate booking rejection
 * PATCH /api/bookings/:id/reject
 */
const validateRejectBooking = (req, res, next) => {
  req.body = req.body || {};
  const allowedKeys = ['rejectionReason'];
  const extraKeys = Object.keys(req.body).filter((key) => !allowedKeys.includes(key));
  if (extraKeys.length > 0) {
    return next(
      ApiError.badRequest(
        `Dữ liệu gửi lên chứa trường không được phép: ${extraKeys.join(', ')}`
      )
    );
  }

  const { rejectionReason } = req.body;
  if (!rejectionReason || typeof rejectionReason !== 'string' || !rejectionReason.trim()) {
    return next(ApiError.badRequest('Lý do từ chối (rejectionReason) là bắt buộc'));
  }

  if (rejectionReason.trim().length < 3) {
    return next(ApiError.badRequest('Lý do từ chối phải có ít nhất 3 ký tự'));
  }

  if (rejectionReason.length > 500) {
    return next(ApiError.badRequest('Lý do từ chối không được vượt quá 500 ký tự'));
  }

  next();
};

/**
 * Validate booking cancellation
 * PATCH /api/bookings/:id/cancel
 */
const validateCancelBooking = (req, res, next) => {
  req.body = req.body || {};
  const allowedKeys = ['cancelReason'];
  const extraKeys = Object.keys(req.body).filter((key) => !allowedKeys.includes(key));
  if (extraKeys.length > 0) {
    return next(
      ApiError.badRequest(
        `Dữ liệu gửi lên chứa trường không được phép: ${extraKeys.join(', ')}`
      )
    );
  }

  const { cancelReason } = req.body;
  if (!cancelReason || typeof cancelReason !== 'string' || !cancelReason.trim()) {
    return next(ApiError.badRequest('Lý do hủy (cancelReason) là bắt buộc'));
  }

  if (cancelReason.trim().length < 3) {
    return next(ApiError.badRequest('Lý do hủy phải có ít nhất 3 ký tự'));
  }

  if (cancelReason.length > 500) {
    return next(ApiError.badRequest('Lý do hủy không được vượt quá 500 ký tự'));
  }

  next();
};

/**
 * Validate booking completion
 * PATCH /api/bookings/:id/complete
 */
const validateCompleteBooking = (req, res, next) => {
  req.body = req.body || {};
  const allowedKeys = ['tutorNote'];
  const extraKeys = Object.keys(req.body).filter((key) => !allowedKeys.includes(key));
  if (extraKeys.length > 0) {
    return next(
      ApiError.badRequest(
        `Dữ liệu gửi lên chứa trường không được phép: ${extraKeys.join(', ')}`
      )
    );
  }

  const { tutorNote } = req.body;
  if (tutorNote !== undefined) {
    if (typeof tutorNote !== 'string') {
      return next(ApiError.badRequest('Ghi chú của gia sư phải là chuỗi'));
    }
    if (tutorNote.length > 500) {
      return next(ApiError.badRequest('Ghi chú của gia sư không được vượt quá 500 ký tự'));
    }
  }

  next();
};

/**
 * Validate query filters for bookings listing
 * GET /api/bookings/me & GET /api/admin/bookings
 */
const validateGetBookingsQuery = (req, res, next) => {
  const allowedKeys = [
    'status',
    'from',
    'to',
    'page',
    'limit',
    'sortBy',
    'order',
    'learnerId',
    'tutorId',
  ];

  const extraKeys = Object.keys(req.query).filter((key) => !allowedKeys.includes(key));
  if (extraKeys.length > 0) {
    return next(ApiError.badRequest(`Tham số lọc không hợp lệ: ${extraKeys.join(', ')}`));
  }

  const { status, from, to, page, limit, sortBy, order, learnerId, tutorId } = req.query;
  const errors = [];

  if (status && ![...ALL_BOOKING_STATUSES, 'all'].includes(status)) {
    errors.push({
      field: 'status',
      message: `Trạng thái hợp lệ gồm: ${[...ALL_BOOKING_STATUSES, 'all'].join(', ')}`,
    });
  }

  if (from && !isValidISODate(from)) {
    errors.push({ field: 'from', message: 'from phải là ngày ISO 8601 hợp lệ' });
  }

  if (to && !isValidISODate(to)) {
    errors.push({ field: 'to', message: 'to phải là ngày ISO 8601 hợp lệ' });
  }

  if (from && to && isValidISODate(from) && isValidISODate(to) && new Date(from) > new Date(to)) {
    errors.push({ field: 'to', message: 'to phải sau hoặc bằng from' });
  }

  if (page !== undefined && (!Number.isInteger(Number(page)) || Number(page) < 1)) {
    errors.push({ field: 'page', message: 'page phải là số nguyên dương >= 1' });
  }

  if (
    limit !== undefined &&
    (!Number.isInteger(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)
  ) {
    errors.push({ field: 'limit', message: 'limit phải là số nguyên từ 1 đến 100' });
  }

  if (sortBy && !['startAt', 'createdAt', 'price'].includes(sortBy)) {
    errors.push({
      field: 'sortBy',
      message: "sortBy chỉ chấp nhận 'startAt', 'createdAt', 'price'",
    });
  }

  if (order && !['asc', 'desc'].includes(order)) {
    errors.push({ field: 'order', message: "order chỉ chấp nhận 'asc' hoặc 'desc'" });
  }

  if (learnerId && !isValidObjectId(learnerId)) {
    errors.push({ field: 'learnerId', message: 'learnerId không đúng định dạng ObjectId' });
  }

  if (tutorId && !isValidObjectId(tutorId)) {
    errors.push({ field: 'tutorId', message: 'tutorId không đúng định dạng ObjectId' });
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Bộ lọc truy vấn không hợp lệ', errors));
  }

  next();
};

module.exports = {
  validateBookingIdParam,
  validateCreateBooking,
  validateConfirmBooking,
  validateRejectBooking,
  validateCancelBooking,
  validateCompleteBooking,
  validateGetBookingsQuery,
};
