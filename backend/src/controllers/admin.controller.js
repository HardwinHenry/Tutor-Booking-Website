const adminService = require('../services/admin.service');
const calendarService = require('../services/calendar.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc Get list of all users with search and filter
 * @route GET /api/admin/users
 * @access Private (Admin only)
 */
const listUsers = asyncHandler(async (req, res) => {
  const result = await adminService.listUsers(req.query);
  return ApiResponse.ok(res, result, 'Lấy danh sách người dùng thành công');
});

/**
 * @desc Get detailed information for a specific user
 * @route GET /api/admin/users/:id
 * @access Private (Admin only)
 */
const getUserDetail = asyncHandler(async (req, res) => {
  const result = await adminService.getUserDetail(req.params.id);
  return ApiResponse.ok(res, result, 'Lấy thông tin người dùng chi tiết thành công');
});

/**
 * @desc Update user status (lock/unlock/disable)
 * @route PATCH /api/admin/users/:id/status
 * @access Private (Admin only)
 */
const updateUserStatus = asyncHandler(async (req, res) => {
  const result = await adminService.updateUserStatus(req.params.id, req.user, req.body);
  return ApiResponse.ok(res, result, 'Cập nhật trạng thái người dùng thành công');
});

/**
 * @desc List all reviews for moderation
 * @route GET /api/admin/reviews
 * @access Private (Admin only)
 */
const listReviews = asyncHandler(async (req, res) => {
  const result = await adminService.listAdminReviews(req.query);
  return ApiResponse.ok(res, result, 'Lấy danh sách đánh giá quản trị thành công');
});

/**
 * @desc Update review visibility (hide/show)
 * @route PATCH /api/admin/reviews/:id/visibility
 * @access Private (Admin only)
 */
const updateReviewVisibility = asyncHandler(async (req, res) => {
  const result = await adminService.updateReviewVisibility(req.params.id, req.body);
  return ApiResponse.ok(res, result, 'Cập nhật hiển thị đánh giá thành công');
});

/**
 * @desc Get Calendar sync logs for Admin monitoring
 * @route GET /api/admin/calendar-sync
 * @access Private (Admin only)
 */
const getCalendarSync = asyncHandler(async (req, res) => {
  const result = await calendarService.listAdminCalendarSync(req.query);
  return ApiResponse.ok(res, result, 'Lấy danh sách log đồng bộ Calendar thành công');
});

module.exports = {
  listUsers,
  getUserDetail,
  updateUserStatus,
  listReviews,
  updateReviewVisibility,
  getCalendarSync,
};
