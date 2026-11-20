const authService = require('../services/auth.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Handle user registration
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone } = req.body;
  const result = await authService.register({ name, email, password, role, phone });
  return ApiResponse.created(res, result, 'Đăng ký tài khoản thành công');
});

/**
 * Handle user login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login({ email, password });
  return ApiResponse.ok(res, result, 'Đăng nhập thành công');
});

/**
 * Handle access token refreshing
 */
const refreshToken = asyncHandler(async (req, res) => {
  const token = req.body.refreshToken || req.headers['x-refresh-token'];
  const result = await authService.refreshToken(token);
  return ApiResponse.ok(res, result, 'Làm mới token thành công');
});

/**
 * Handle user logout
 */
const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user._id);
  return ApiResponse.ok(res, null, 'Đăng xuất thành công');
});

/**
 * Get profile of currently authenticated user
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user._id);
  return ApiResponse.ok(res, { user }, 'Lấy thông tin tài khoản thành công');
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
};
