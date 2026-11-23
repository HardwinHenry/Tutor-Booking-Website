const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const calendarService = require('../services/calendar.service');
const { StatusCodes } = require('../constants/statusCodes');

/**
 * Generate Google OAuth URL with CSRF state
 * GET /api/calendar/oauth
 */
const getOAuthUrl = asyncHandler(async (req, res) => {
  const result = await calendarService.getOAuthUrl(req.user, req.query);

  // If client requested direct redirect
  if (req.query.redirect === 'true') {
    return res.redirect(result.url);
  }

  return ApiResponse.ok(res, result, 'Tạo URL xác thực Google OAuth thành công');
});

/**
 * Handle Google OAuth callback
 * GET /api/calendar/oauth/callback
 */
const handleOAuthCallback = asyncHandler(async (req, res) => {
  const { code, state } = req.query;
  const result = await calendarService.handleOAuthCallback({
    code,
    state,
    redirectUri: req.query.redirect_uri,
  });

  // If redirect query or client redirect is desired
  if (req.query.client_redirect === 'true') {
    return res.redirect('/calendar?status=connected');
  }

  return ApiResponse.ok(
    res,
    result,
    'Liên kết tài khoản Google Calendar thành công'
  );
});

/**
 * Get current user's Google Calendar connection status
 * GET /api/calendar/status
 */
const getConnectionStatus = asyncHandler(async (req, res) => {
  const status = await calendarService.getConnectionStatus(req.user);
  return ApiResponse.ok(res, status, 'Lấy trạng thái kết nối Google Calendar thành công');
});

/**
 * Disconnect Google Calendar
 * POST /api/calendar/disconnect
 */
const disconnectCalendar = asyncHandler(async (req, res) => {
  const result = await calendarService.disconnectCalendar(req.user);
  return ApiResponse.ok(res, result, 'Ngắt kết nối Google Calendar thành công');
});

/**
 * Manually retry synchronization for a confirmed booking
 * POST /api/calendar/sync/retry
 */
const retrySync = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;
  const result = await calendarService.retryBookingSync(bookingId, req.user);
  return ApiResponse.ok(res, result, 'Đồng bộ lại Google Calendar thành công');
});

/**
 * Get calendar sync logs for a specific booking
 * GET /api/calendar/sync/:bookingId
 */
const getBookingSyncLogs = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const logs = await calendarService.getBookingSyncLogs(bookingId, req.user);
  return ApiResponse.ok(res, logs, 'Lấy lịch sử đồng bộ lịch thành công');
});

/**
 * Admin view of calendar sync logs
 * GET /api/calendar/admin/sync
 */
const listAdminCalendarSync = asyncHandler(async (req, res) => {
  const result = await calendarService.listAdminCalendarSync(req.query);
  return ApiResponse.ok(res, result, 'Lấy danh sách đồng bộ Calendar thành công');
});

module.exports = {
  getOAuthUrl,
  handleOAuthCallback,
  getConnectionStatus,
  disconnectCalendar,
  retrySync,
  getBookingSyncLogs,
  listAdminCalendarSync,
};
