const { verifyAccessToken } = require('../utils/token.util');
const ApiError = require('../utils/apiError');
const User = require('../models/user.model');
const { USER_STATUS } = require('../constants/userStatus');

/**
 * Authentication Middleware: Verifies JWT Access Token and loads authenticated user
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      throw ApiError.unauthorized('Vui lòng đăng nhập để truy cập tài nguyên này');
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw ApiError.unauthorized('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
      }
      throw ApiError.unauthorized('Token xác thực không hợp lệ');
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      throw ApiError.unauthorized('Tài khoản liên kết với token này không còn tồn tại');
    }

    if (user.status === USER_STATUS.LOCKED) {
      throw ApiError.forbidden('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên');
    }

    if (user.status === USER_STATUS.DISABLED) {
      throw ApiError.forbidden('Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Authorization Middleware: Enforces Role-Based Access Control (RBAC)
 * @param  {...string} roles Allowed roles for accessing the endpoint
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Yêu cầu xác thực trước khi phân quyền'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Bạn không có quyền thực hiện hành động này. Yêu cầu một trong các quyền: [${roles.join(', ')}]`
        )
      );
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};

