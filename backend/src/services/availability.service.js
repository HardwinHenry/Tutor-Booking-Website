const mongoose = require('mongoose');
const AvailabilitySlot = require('../models/availabilitySlot.model');
const User = require('../models/user.model');
const TutorProfile = require('../models/tutorProfile.model');
const ApiError = require('../utils/apiError');
const { ROLES } = require('../constants/roles');
const { USER_STATUS } = require('../constants/userStatus');
const { APPROVAL_STATUS } = require('../constants/profileStatus');
const {
  SLOT_STATUS,
  DEFAULT_TIMEZONE,
  MIN_SLOT_DURATION_MINUTES,
  MAX_SLOT_DURATION_MINUTES,
} = require('../constants/availabilityStatus');

/**
 * Verify that the tutor exists, is active, and has an approved profile
 */
const verifyTutorEligibility = async (tutorUserId) => {
  const tutor = await User.findById(tutorUserId);
  if (!tutor || tutor.status !== USER_STATUS.ACTIVE) {
    throw ApiError.forbidden('Tài khoản gia sư không tồn tại hoặc đã bị khóa');
  }

  if (tutor.role !== ROLES.TUTOR && tutor.role !== ROLES.ADMIN) {
    throw ApiError.forbidden('Chỉ tài khoản gia sư mới có thể quản lý lịch dạy');
  }

  // Check approved profile (unless Admin)
  if (tutor.role === ROLES.TUTOR) {
    const profile = await TutorProfile.findOne({ userId: tutorUserId });
    if (!profile || profile.approvalStatus !== APPROVAL_STATUS.APPROVED) {
      throw ApiError.forbidden(
        'Hồ sơ gia sư cần được phê duyệt (approved) trước khi tạo và mở lịch dạy'
      );
    }
  }

  return tutor;
};

/**
 * Create a single slot
 */
const createSlot = async (tutorUserId, slotData) => {
  await verifyTutorEligibility(tutorUserId);

  const startAt = new Date(slotData.startAt);
  const endAt = new Date(slotData.endAt);
  const now = new Date();

  if (startAt <= now) {
    throw ApiError.badRequest('Thời gian bắt đầu không được nằm trong quá khứ');
  }

  if (startAt >= endAt) {
    throw ApiError.badRequest('Thời gian kết thúc phải sau thời gian bắt đầu (startAt < endAt)');
  }

  const durationMinutes = (endAt.getTime() - startAt.getTime()) / 60000;
  if (durationMinutes < MIN_SLOT_DURATION_MINUTES) {
    throw ApiError.badRequest(
      `Thời lượng tối thiểu của một slot là ${MIN_SLOT_DURATION_MINUTES} phút`
    );
  }
  if (durationMinutes > MAX_SLOT_DURATION_MINUTES) {
    throw ApiError.badRequest(
      `Thời lượng tối đa của một slot là ${MAX_SLOT_DURATION_MINUTES} phút`
    );
  }

  // Check overlap against existing active/booked slots of this tutor
  const overlappingSlot = await AvailabilitySlot.findOverlappingSlot(tutorUserId, startAt, endAt);
  if (overlappingSlot) {
    throw ApiError.badRequest(
      'Khung giờ này bị trùng lặp với một lịch dạy đã tồn tại của gia sư',
      [
        {
          field: 'timeRange',
          message: `Trùng với slot hiện có: ${overlappingSlot.startAt.toISOString()} - ${overlappingSlot.endAt.toISOString()}`,
        },
      ]
    );
  }

  const newSlot = await AvailabilitySlot.create({
    tutorId: tutorUserId,
    startAt,
    endAt,
    timezone: slotData.timezone || DEFAULT_TIMEZONE,
    status: SLOT_STATUS.AVAILABLE,
    note: slotData.note || '',
  });

  return newSlot;
};

/**
 * Create batch slots
 */
const createBatchSlots = async (tutorUserId, slotsArray) => {
  await verifyTutorEligibility(tutorUserId);

  if (!Array.isArray(slotsArray) || slotsArray.length === 0) {
    throw ApiError.badRequest('Danh sách slots không được để trống');
  }

  // Check internal overlaps within the batch
  const parsedSlots = slotsArray.map((s, idx) => ({
    index: idx,
    startAt: new Date(s.startAt),
    endAt: new Date(s.endAt),
    timezone: s.timezone || DEFAULT_TIMEZONE,
    note: s.note || '',
  }));

  // Sort by startAt to verify sequence
  parsedSlots.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

  for (let i = 0; i < parsedSlots.length; i++) {
    const current = parsedSlots[i];
    if (current.startAt <= new Date()) {
      throw ApiError.badRequest(`Slot thứ ${current.index + 1} có thời gian bắt đầu trong quá khứ`);
    }
    if (current.startAt >= current.endAt) {
      throw ApiError.badRequest(`Slot thứ ${current.index + 1} có startAt >= endAt`);
    }

    if (i > 0) {
      const prev = parsedSlots[i - 1];
      if (current.startAt < prev.endAt) {
        throw ApiError.badRequest(
          `Trùng lặp giữa các slot trong danh sách gửi lên (slot ${prev.index + 1} và slot ${current.index + 1})`
        );
      }
    }

    // Check overlap with existing DB slots
    const overlapping = await AvailabilitySlot.findOverlappingSlot(
      tutorUserId,
      current.startAt,
      current.endAt
    );
    if (overlapping) {
      throw ApiError.badRequest(
        `Slot thứ ${current.index + 1} bị trùng lặp với lịch dạy đã có trong hệ thống`,
        [
          {
            field: `slots[${current.index}]`,
            message: `Trùng với slot: ${overlapping.startAt.toISOString()} - ${overlapping.endAt.toISOString()}`,
          },
        ]
      );
    }
  }

  const documentsToInsert = parsedSlots.map((s) => ({
    tutorId: tutorUserId,
    startAt: s.startAt,
    endAt: s.endAt,
    timezone: s.timezone,
    status: SLOT_STATUS.AVAILABLE,
    note: s.note,
  }));

  const createdSlots = await AvailabilitySlot.insertMany(documentsToInsert);
  return createdSlots;
};

/**
 * Get tutor's own slots
 * GET /api/availability/mine
 */
const getMySlots = async (tutorUserId, query = {}) => {
  const { from, to, status, page = 1, limit = 20 } = query;

  const filter = { tutorId: tutorUserId };

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (from || to) {
    if (from && to) {
      filter.startAt = { $gte: new Date(from) };
      filter.endAt = { $lte: new Date(to) };
    } else if (from) {
      filter.startAt = { $gte: new Date(from) };
    } else if (to) {
      filter.endAt = { $lte: new Date(to) };
    }
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  const [items, total] = await Promise.all([
    AvailabilitySlot.find(filter).sort({ startAt: 1 }).skip(skip).limit(limitNum),
    AvailabilitySlot.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
};

/**
 * Get slot by ID
 */
const getSlotById = async (slotId, user) => {
  const slot = await AvailabilitySlot.findById(slotId);
  if (!slot) {
    throw ApiError.notFound('Không tìm thấy lịch dạy (slot)');
  }

  if (user.role !== ROLES.ADMIN && slot.tutorId.toString() !== user._id.toString()) {
    throw ApiError.forbidden('Bạn không có quyền xem thông tin chi tiết lịch dạy này');
  }

  return slot;
};

/**
 * Update slot
 * PATCH /api/availability/:id
 */
const updateSlot = async (slotId, updateData, user) => {
  const slot = await AvailabilitySlot.findById(slotId);
  if (!slot) {
    throw ApiError.notFound('Không tìm thấy lịch dạy (slot)');
  }

  if (user.role !== ROLES.ADMIN && slot.tutorId.toString() !== user._id.toString()) {
    throw ApiError.forbidden('Bạn không có quyền chỉnh sửa lịch dạy này');
  }

  // Protection: Slot already booked cannot be edited
  if (slot.status === SLOT_STATUS.BOOKED) {
    throw ApiError.badRequest('Không thể chỉnh sửa slot đã được học viên đặt (booked)');
  }

  // Cannot manually set status to booked
  if (updateData.status === SLOT_STATUS.BOOKED) {
    throw ApiError.badRequest('Không được phép cập nhật thủ công trạng thái thành booked');
  }

  // Check timing if updating startAt or endAt
  if (updateData.startAt !== undefined || updateData.endAt !== undefined) {
    const newStartAt = updateData.startAt ? new Date(updateData.startAt) : slot.startAt;
    const newEndAt = updateData.endAt ? new Date(updateData.endAt) : slot.endAt;

    if (newStartAt <= new Date()) {
      throw ApiError.badRequest('Thời gian bắt đầu không được nằm trong quá khứ');
    }

    if (newStartAt >= newEndAt) {
      throw ApiError.badRequest('Thời gian kết thúc phải sau thời gian bắt đầu (startAt < endAt)');
    }

    const durationMinutes = (newEndAt.getTime() - newStartAt.getTime()) / 60000;
    if (durationMinutes < MIN_SLOT_DURATION_MINUTES) {
      throw ApiError.badRequest(
        `Thời lượng tối thiểu của một slot là ${MIN_SLOT_DURATION_MINUTES} phút`
      );
    }
    if (durationMinutes > MAX_SLOT_DURATION_MINUTES) {
      throw ApiError.badRequest(
        `Thời lượng tối đa của một slot là ${MAX_SLOT_DURATION_MINUTES} phút`
      );
    }

    // Check overlap with other slots of this tutor
    const overlapping = await AvailabilitySlot.findOverlappingSlot(
      slot.tutorId,
      newStartAt,
      newEndAt,
      slot._id
    );

    if (overlapping) {
      throw ApiError.badRequest(
        'Khung giờ cập nhật bị trùng lặp với một lịch dạy khác của gia sư',
        [
          {
            field: 'timeRange',
            message: `Trùng với slot: ${overlapping.startAt.toISOString()} - ${overlapping.endAt.toISOString()}`,
          },
        ]
      );
    }

    slot.startAt = newStartAt;
    slot.endAt = newEndAt;
  }

  if (updateData.timezone !== undefined) {
    slot.timezone = updateData.timezone;
  }

  if (updateData.note !== undefined) {
    slot.note = updateData.note;
  }

  if (updateData.status !== undefined) {
    slot.status = updateData.status;
  }

  await slot.save();
  return slot;
};

/**
 * Delete slot
 * DELETE /api/availability/:id
 */
const deleteSlot = async (slotId, user) => {
  const slot = await AvailabilitySlot.findById(slotId);
  if (!slot) {
    throw ApiError.notFound('Không tìm thấy lịch dạy (slot)');
  }

  if (user.role !== ROLES.ADMIN && slot.tutorId.toString() !== user._id.toString()) {
    throw ApiError.forbidden('Bạn không có quyền xóa lịch dạy này');
  }

  // Protection: Slot already booked cannot be deleted
  if (slot.status === SLOT_STATUS.BOOKED) {
    throw ApiError.badRequest('Không thể xóa slot đã được học viên đặt (booked)');
  }

  await AvailabilitySlot.findByIdAndDelete(slotId);
  return { message: 'Đã xóa lịch dạy thành công', slotId };
};

/**
 * Get public available slots of a tutor
 * GET /api/tutors/:id/availability?from=&to=&duration=
 */
const getTutorAvailableSlots = async (tutorId, query = {}) => {
  const tutor = await User.findById(tutorId).select('name email role status avatar');
  if (!tutor || tutor.status !== USER_STATUS.ACTIVE) {
    throw ApiError.notFound('Không tìm thấy gia sư hoặc tài khoản gia sư không hoạt động');
  }

  if (tutor.role !== ROLES.TUTOR) {
    throw ApiError.badRequest('Tài khoản được yêu cầu không phải là gia sư');
  }

  const profile = await TutorProfile.findOne({
    userId: tutorId,
    approvalStatus: APPROVAL_STATUS.APPROVED,
  });

  if (!profile) {
    throw ApiError.badRequest('Gia sư chưa có hồ sơ được phê duyệt');
  }

  const { from, to, duration, page = 1, limit = 50 } = query;
  const now = new Date();

  // Base query: Only available slots and future slots
  const filter = {
    tutorId,
    status: SLOT_STATUS.AVAILABLE,
    startAt: { $gt: now },
  };

  if (from) {
    const fromDate = new Date(from);
    // Must be greater than now and greater than/equal to from
    filter.startAt = { $gte: fromDate > now ? fromDate : now };
  }

  if (to) {
    filter.endAt = { $lte: new Date(to) };
  }

  if (duration) {
    const minMs = Number(duration) * 60000;
    filter.$expr = { $gte: [{ $subtract: ['$endAt', '$startAt'] }, minMs] };
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 50;
  const skip = (pageNum - 1) * limitNum;

  const [items, total] = await Promise.all([
    AvailabilitySlot.find(filter)
      .select('tutorId startAt endAt timezone status note createdAt updatedAt')
      .sort({ startAt: 1 })
      .skip(skip)
      .limit(limitNum),
    AvailabilitySlot.countDocuments(filter),
  ]);

  return {
    tutor: {
      id: tutor._id,
      name: tutor.name,
      avatar: tutor.avatar || '',
    },
    items,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
};

module.exports = {
  createSlot,
  createBatchSlots,
  getMySlots,
  getSlotById,
  updateSlot,
  deleteSlot,
  getTutorAvailableSlots,
  verifyTutorEligibility,
};
