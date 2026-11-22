const mongoose = require('mongoose');
const ApiError = require('../utils/apiError');
const {
  SLOT_STATUS,
  MIN_SLOT_DURATION_MINUTES,
  MAX_SLOT_DURATION_MINUTES,
} = require('../constants/availabilityStatus');

const isValidObjectId = (id) => id && mongoose.Types.ObjectId.isValid(id);

const isValidTimezone = (tz) => {
  if (!tz || typeof tz !== 'string') return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch (e) {
    return false;
  }
};

const isValidISODate = (val) => {
  if (!val) return false;
  const d = new Date(val);
  return !isNaN(d.getTime());
};

/**
 * Validate a single slot object
 */
const validateSingleSlotInput = (slot, index = null) => {
  const errors = [];
  const prefix = index !== null ? `slots[${index}].` : '';

  if (!slot || typeof slot !== 'object') {
    errors.push({ field: prefix.slice(0, -1) || 'slot', message: 'Dữ liệu slot không hợp lệ' });
    return errors;
  }

  // Check startAt
  if (!slot.startAt) {
    errors.push({ field: `${prefix}startAt`, message: 'Thời gian bắt đầu (startAt) là bắt buộc' });
  } else if (!isValidISODate(slot.startAt)) {
    errors.push({
      field: `${prefix}startAt`,
      message: 'Thời gian bắt đầu phải theo chuẩn ISO 8601 (ví dụ: 2026-11-25T08:00:00Z)',
    });
  }

  // Check endAt
  if (!slot.endAt) {
    errors.push({ field: `${prefix}endAt`, message: 'Thời gian kết thúc (endAt) là bắt buộc' });
  } else if (!isValidISODate(slot.endAt)) {
    errors.push({
      field: `${prefix}endAt`,
      message: 'Thời gian kết thúc phải theo chuẩn ISO 8601 (ví dụ: 2026-11-25T10:00:00Z)',
    });
  }

  // Check startAt < endAt and not in past if dates are valid
  if (isValidISODate(slot.startAt) && isValidISODate(slot.endAt)) {
    const startDate = new Date(slot.startAt);
    const endDate = new Date(slot.endAt);
    const now = new Date();

    if (startDate <= now) {
      errors.push({
        field: `${prefix}startAt`,
        message: 'Thời gian bắt đầu không được nằm trong quá khứ',
      });
    }

    if (startDate >= endDate) {
      errors.push({
        field: `${prefix}endAt`,
        message: 'Thời gian kết thúc phải sau thời gian bắt đầu (startAt < endAt)',
      });
    } else {
      const durationMinutes = (endDate.getTime() - startDate.getTime()) / 60000;
      if (durationMinutes < MIN_SLOT_DURATION_MINUTES) {
        errors.push({
          field: `${prefix}duration`,
          message: `Thời lượng tối thiểu của một slot là ${MIN_SLOT_DURATION_MINUTES} phút`,
        });
      }
      if (durationMinutes > MAX_SLOT_DURATION_MINUTES) {
        errors.push({
          field: `${prefix}duration`,
          message: `Thời lượng tối đa của một slot là ${MAX_SLOT_DURATION_MINUTES} phút (8 giờ)`,
        });
      }
    }
  }

  // Check timezone
  if (slot.timezone !== undefined && !isValidTimezone(slot.timezone)) {
    errors.push({
      field: `${prefix}timezone`,
      message: 'Múi giờ (timezone) không hợp lệ (ví dụ: Asia/Ho_Chi_Minh)',
    });
  }

  // Check note
  if (slot.note !== undefined && typeof slot.note !== 'string') {
    errors.push({ field: `${prefix}note`, message: 'Ghi chú phải là chuỗi ký tự' });
  } else if (slot.note && slot.note.length > 500) {
    errors.push({ field: `${prefix}note`, message: 'Ghi chú không được vượt quá 500 ký tự' });
  }

  return errors;
};

/**
 * Middleware: Validate creating slot(s)
 * Supports single: { startAt, endAt, timezone, note }
 * Or batch: { slots: [ { startAt, endAt, ... } ] }
 */
const validateCreateSlot = (req, res, next) => {
  const allowedKeys = ['startAt', 'endAt', 'timezone', 'note', 'slots'];
  const extraKeys = Object.keys(req.body).filter((key) => !allowedKeys.includes(key));
  if (extraKeys.length > 0) {
    return next(
      ApiError.badRequest(
        `Trường dữ liệu không hợp lệ: ${extraKeys.join(', ')}`,
        extraKeys.map((k) => ({ field: k, message: 'Trường này không được phép truyền lên' }))
      )
    );
  }

  const errors = [];

  if (Array.isArray(req.body.slots)) {
    if (req.body.slots.length === 0) {
      errors.push({ field: 'slots', message: 'Danh sách slots không được để trống' });
    } else if (req.body.slots.length > 50) {
      errors.push({ field: 'slots', message: 'Mỗi lần tạo tối đa 50 slots' });
    } else {
      req.body.slots.forEach((slot, idx) => {
        errors.push(...validateSingleSlotInput(slot, idx));
      });
    }
  } else {
    errors.push(...validateSingleSlotInput(req.body));
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest(errors[0].message, errors));
  }

  next();
};

/**
 * Middleware: Validate updating a slot
 * PATCH /api/availability/:id
 */
const validateUpdateSlot = (req, res, next) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return next(ApiError.badRequest('ID slot không hợp lệ'));
  }

  const allowedKeys = ['startAt', 'endAt', 'timezone', 'status', 'note'];
  const extraKeys = Object.keys(req.body).filter((key) => !allowedKeys.includes(key));
  if (extraKeys.length > 0) {
    return next(
      ApiError.badRequest(
        `Trường dữ liệu không hợp lệ: ${extraKeys.join(', ')}`,
        extraKeys.map((k) => ({ field: k, message: 'Trường này không được phép cập nhật' }))
      )
    );
  }

  const errors = [];
  const { startAt, endAt, timezone, status, note } = req.body;

  if (startAt !== undefined) {
    if (!isValidISODate(startAt)) {
      errors.push({ field: 'startAt', message: 'Thời gian bắt đầu không hợp lệ' });
    } else if (new Date(startAt) <= new Date()) {
      errors.push({ field: 'startAt', message: 'Thời gian bắt đầu không được nằm trong quá khứ' });
    }
  }

  if (endAt !== undefined && !isValidISODate(endAt)) {
    errors.push({ field: 'endAt', message: 'Thời gian kết thúc không hợp lệ' });
  }

  if (startAt && endAt && isValidISODate(startAt) && isValidISODate(endAt)) {
    const s = new Date(startAt);
    const e = new Date(endAt);
    if (s >= e) {
      errors.push({ field: 'endAt', message: 'Thời gian kết thúc phải sau thời gian bắt đầu' });
    } else {
      const dur = (e.getTime() - s.getTime()) / 60000;
      if (dur < MIN_SLOT_DURATION_MINUTES) {
        errors.push({
          field: 'duration',
          message: `Thời lượng tối thiểu là ${MIN_SLOT_DURATION_MINUTES} phút`,
        });
      }
      if (dur > MAX_SLOT_DURATION_MINUTES) {
        errors.push({
          field: 'duration',
          message: `Thời lượng tối đa là ${MAX_SLOT_DURATION_MINUTES} phút`,
        });
      }
    }
  }

  if (status !== undefined) {
    if (status === SLOT_STATUS.BOOKED) {
      errors.push({
        field: 'status',
        message: 'Không được phép cập nhật thủ công trạng thái thành booked',
      });
    } else if (![SLOT_STATUS.AVAILABLE, SLOT_STATUS.CLOSED].includes(status)) {
      errors.push({
        field: 'status',
        message: `Trạng thái chỉ có thể là '${SLOT_STATUS.AVAILABLE}' hoặc '${SLOT_STATUS.CLOSED}'`,
      });
    }
  }

  if (timezone !== undefined && !isValidTimezone(timezone)) {
    errors.push({ field: 'timezone', message: 'Múi giờ không hợp lệ' });
  }

  if (note !== undefined && typeof note !== 'string') {
    errors.push({ field: 'note', message: 'Ghi chú phải là chuỗi ký tự' });
  } else if (note && note.length > 500) {
    errors.push({ field: 'note', message: 'Ghi chú không được vượt quá 500 ký tự' });
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest(errors[0].message, errors));
  }

  next();
};

/**
 * Validate slot ID parameter
 */
const validateSlotIdParam = (req, res, next) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return next(ApiError.badRequest('ID slot không đúng định dạng ObjectId'));
  }
  next();
};

/**
 * Validate tutor ID parameter
 */
const validateTutorIdParam = (req, res, next) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return next(ApiError.badRequest('ID gia sư không đúng định dạng ObjectId'));
  }
  next();
};

/**
 * Validate query filters for GET /api/availability/mine
 */
const validateGetMySlots = (req, res, next) => {
  const allowedKeys = ['from', 'to', 'status', 'page', 'limit'];
  const extraKeys = Object.keys(req.query).filter((key) => !allowedKeys.includes(key));
  if (extraKeys.length > 0) {
    return next(ApiError.badRequest(`Tham số lọc không hợp lệ: ${extraKeys.join(', ')}`));
  }

  const { from, to, status, page, limit } = req.query;
  const errors = [];

  if (from && !isValidISODate(from)) {
    errors.push({ field: 'from', message: 'from phải là ngày ISO 8601 hợp lệ' });
  }

  if (to && !isValidISODate(to)) {
    errors.push({ field: 'to', message: 'to phải là ngày ISO 8601 hợp lệ' });
  }

  if (from && to && isValidISODate(from) && isValidISODate(to) && new Date(from) > new Date(to)) {
    errors.push({ field: 'to', message: 'to phải sau hoặc bằng from' });
  }

  if (status && !['available', 'booked', 'closed', 'all'].includes(status)) {
    errors.push({
      field: 'status',
      message: "Trạng thái hợp lệ gồm: 'available', 'booked', 'closed', 'all'",
    });
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

  if (errors.length > 0) {
    return next(ApiError.badRequest('Bộ lọc truy vấn không hợp lệ', errors));
  }

  next();
};

/**
 * Validate query filters for GET /api/tutors/:id/availability
 */
const validateGetTutorAvailability = (req, res, next) => {
  const allowedKeys = ['from', 'to', 'duration', 'page', 'limit'];
  const extraKeys = Object.keys(req.query).filter((key) => !allowedKeys.includes(key));
  if (extraKeys.length > 0) {
    return next(ApiError.badRequest(`Tham số lọc không hợp lệ: ${extraKeys.join(', ')}`));
  }

  const { from, to, duration, page, limit } = req.query;
  const errors = [];

  if (from && !isValidISODate(from)) {
    errors.push({ field: 'from', message: 'from phải là ngày ISO 8601 hợp lệ' });
  }

  if (to && !isValidISODate(to)) {
    errors.push({ field: 'to', message: 'to phải là ngày ISO 8601 hợp lệ' });
  }

  if (from && to && isValidISODate(from) && isValidISODate(to) && new Date(from) > new Date(to)) {
    errors.push({ field: 'to', message: 'to phải sau hoặc bằng from' });
  }

  if (duration !== undefined) {
    const durNum = Number(duration);
    if (!Number.isInteger(durNum) || durNum <= 0) {
      errors.push({ field: 'duration', message: 'duration phải là số nguyên dương tính theo phút' });
    }
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

  if (errors.length > 0) {
    return next(ApiError.badRequest('Bộ lọc lịch dạy không hợp lệ', errors));
  }

  next();
};

module.exports = {
  validateCreateSlot,
  validateUpdateSlot,
  validateSlotIdParam,
  validateTutorIdParam,
  validateGetMySlots,
  validateGetTutorAvailability,
};
