const User = require('../models/user.model');
const ApiError = require('../utils/apiError');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
} = require('../utils/token.util');
const { ROLES } = require('../constants/roles');
const { USER_STATUS } = require('../constants/userStatus');

/**
 * Register a new user account
 */
const register = async ({ name, email, password, role, phone }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw ApiError.conflict('Email này đã được sử dụng. Vui lòng chọn email khác');
  }

  const passwordHash = await User.hashPassword(password);
  const assignedRole = role && [ROLES.LEARNER, ROLES.TUTOR].includes(role) ? role : ROLES.LEARNER;

  const user = new User({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    role: assignedRole,
    phone: phone ? phone.trim() : '',
    status: USER_STATUS.ACTIVE,
  });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = hashToken(refreshToken);
  await user.save();

  return {
    user,
    accessToken,
    refreshToken,
  };
};

/**
 * Authenticate user with email and password
 */
const login = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash +refreshToken');

  if (!user) {
    throw ApiError.unauthorized('Email hoặc mật khẩu không chính xác');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw ApiError.unauthorized('Email hoặc mật khẩu không chính xác');
  }

  if (user.status === USER_STATUS.LOCKED) {
    throw ApiError.forbidden('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên');
  }

  if (user.status === USER_STATUS.DISABLED) {
    throw ApiError.forbidden('Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên');
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = hashToken(refreshToken);
  await user.save();

  return {
    user,
    accessToken,
    refreshToken,
  };
};

/**
 * Refresh access token using a valid refresh token with token rotation
 */
const refreshToken = async (rawRefreshToken) => {
  if (!rawRefreshToken) {
    throw ApiError.badRequest('Refresh token là bắt buộc');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(rawRefreshToken);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Refresh token đã hết hạn. Vui lòng đăng nhập lại');
    }
    throw ApiError.unauthorized('Refresh token không hợp lệ');
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user) {
    throw ApiError.unauthorized('Tài khoản không còn tồn tại');
  }

  if (user.status === USER_STATUS.LOCKED) {
    throw ApiError.forbidden('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên');
  }

  if (user.status === USER_STATUS.DISABLED) {
    throw ApiError.forbidden('Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên');
  }

  const incomingHash = hashToken(rawRefreshToken);
  if (!user.refreshToken || user.refreshToken !== incomingHash) {
    // Potential token reuse detected: revoke session
    user.refreshToken = null;
    await user.save();
    throw ApiError.unauthorized('Refresh token đã bị thu hồi hoặc không hợp lệ');
  }

  // Issue new access token and rotate refresh token
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  user.refreshToken = hashToken(newRefreshToken);
  await user.save();

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

/**
 * Log out user by clearing stored refresh token
 */
const logout = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
  return true;
};

/**
 * Retrieve current authenticated user profile
 */
const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('Không tìm thấy người dùng');
  }

  if (user.status === USER_STATUS.LOCKED) {
    throw ApiError.forbidden('Tài khoản của bạn đã bị khóa');
  }

  if (user.status === USER_STATUS.DISABLED) {
    throw ApiError.forbidden('Tài khoản của bạn đã bị vô hiệu hóa');
  }

  return user;
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser,
};
