const availabilityService = require('../services/availability.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Create availability slot(s)
 * POST /api/availability
 */
const createSlot = asyncHandler(async (req, res) => {
  if (Array.isArray(req.body.slots)) {
    const slots = await availabilityService.createBatchSlots(req.user._id, req.body.slots);
    return ApiResponse.created(res, { slots }, 'Tạo danh sách lịch dạy thành công');
  }

  const slot = await availabilityService.createSlot(req.user._id, req.body);
  return ApiResponse.created(res, { slot }, 'Tạo lịch dạy thành công');
});

/**
 * Get current tutor's slots
 * GET /api/availability/mine
 */
const getMySlots = asyncHandler(async (req, res) => {
  const result = await availabilityService.getMySlots(req.user._id, req.query);
  return ApiResponse.ok(res, result, 'Lấy danh sách lịch dạy thành công');
});

/**
 * Get slot detail by ID
 * GET /api/availability/:id
 */
const getSlotById = asyncHandler(async (req, res) => {
  const slot = await availabilityService.getSlotById(req.params.id, req.user);
  return ApiResponse.ok(res, { slot }, 'Lấy chi tiết lịch dạy thành công');
});

/**
 * Update slot
 * PATCH /api/availability/:id
 */
const updateSlot = asyncHandler(async (req, res) => {
  const slot = await availabilityService.updateSlot(req.params.id, req.body, req.user);
  return ApiResponse.ok(res, { slot }, 'Cập nhật lịch dạy thành công');
});

/**
 * Delete slot
 * DELETE /api/availability/:id
 */
const deleteSlot = asyncHandler(async (req, res) => {
  const result = await availabilityService.deleteSlot(req.params.id, req.user);
  return ApiResponse.ok(res, result, 'Xóa lịch dạy thành công');
});

/**
 * Get public available slots of a tutor
 * GET /api/tutors/:id/availability
 */
const getTutorAvailability = asyncHandler(async (req, res) => {
  const result = await availabilityService.getTutorAvailableSlots(req.params.id, req.query);
  return ApiResponse.ok(res, result, 'Lấy lịch dạy khả dụng của gia sư thành công');
});

module.exports = {
  createSlot,
  getMySlots,
  getSlotById,
  updateSlot,
  deleteSlot,
  getTutorAvailability,
};
