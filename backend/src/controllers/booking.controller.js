const bookingService = require('../services/booking.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Create a new booking request
 * POST /api/bookings
 */
const createBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.createBooking(req.user._id, req.body);
  return ApiResponse.created(res, { booking }, 'Tạo yêu cầu đặt lịch thành công');
});

/**
 * Get current user's bookings (learner or tutor)
 * GET /api/bookings/me
 */
const getMyBookings = asyncHandler(async (req, res) => {
  const result = await bookingService.getMyBookings(req.user, req.query);
  return ApiResponse.ok(res, result, 'Lấy danh sách lịch hẹn thành công');
});

/**
 * Get single booking by ID
 * GET /api/bookings/:id
 */
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.id, req.user);
  return ApiResponse.ok(res, { booking }, 'Lấy chi tiết lịch hẹn thành công');
});

/**
 * Confirm a pending booking (Tutor or Admin)
 * PATCH /api/bookings/:id/confirm
 */
const confirmBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.confirmBooking(req.params.id, req.user, req.body);
  return ApiResponse.ok(res, { booking }, 'Xác nhận lịch hẹn thành công');
});

/**
 * Reject a pending booking (Tutor or Admin)
 * PATCH /api/bookings/:id/reject
 */
const rejectBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.rejectBooking(req.params.id, req.user, req.body);
  return ApiResponse.ok(res, { booking }, 'Từ chối yêu cầu đặt lịch thành công');
});

/**
 * Cancel a booking (Learner, Tutor, or Admin)
 * PATCH /api/bookings/:id/cancel
 */
const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.cancelBooking(req.params.id, req.user, req.body);
  return ApiResponse.ok(res, { booking }, 'Hủy lịch hẹn thành công');
});

/**
 * Complete a confirmed booking (Tutor or Admin)
 * PATCH /api/bookings/:id/complete
 */
const completeBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.completeBooking(req.params.id, req.user, req.body);
  return ApiResponse.ok(res, { booking }, 'Đánh dấu hoàn tất buổi học thành công');
});

/**
 * Admin: List all bookings
 * GET /api/admin/bookings
 */
const adminListBookings = asyncHandler(async (req, res) => {
  const result = await bookingService.adminListBookings(req.query);
  return ApiResponse.ok(res, result, 'Lấy danh sách quản lý lịch hẹn thành công');
});

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  confirmBooking,
  rejectBooking,
  cancelBooking,
  completeBooking,
  adminListBookings,
};
