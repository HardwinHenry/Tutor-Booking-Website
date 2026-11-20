const validator = require('validator');
const ApiError = require('../utils/apiError');
const { ROLES } = require('../constants/roles');

/**
 * Validate Register Request Body
 */
const validateRegister = (req, res, next) => {
  const { name, email, password, role, phone } = req.body;
  const errors = [];

  // Name validation
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Tên người dùng là bắt buộc' });
  } else if (name.trim().length < 2 || name.trim().length > 100) {
    errors.push({ field: 'name', message: 'Tên phải từ 2 đến 100 ký tự' });
  }

  // Email validation
  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.push({ field: 'email', message: 'Email là bắt buộc' });
  } else if (!validator.isEmail(email.trim())) {
    errors.push({ field: 'email', message: 'Email không đúng định dạng' });
  }

  // Password validation
  if (!password || typeof password !== 'string') {
    errors.push({ field: 'password', message: 'Mật khẩu là bắt buộc' });
  } else if (password.length < 6) {
    errors.push({ field: 'password', message: 'Mật khẩu phải có ít nhất 6 ký tự' });
  }

  // Role validation (Public register can only be learner or tutor)
  if (role !== undefined) {
    const allowedRoles = [ROLES.LEARNER, ROLES.TUTOR];
    if (!allowedRoles.includes(role)) {
      errors.push({
        field: 'role',
        message: `Vai trò không hợp lệ. Chỉ chấp nhận: [${allowedRoles.join(', ')}]`,
      });
    }
  }

  // Phone validation (optional)
  if (phone !== undefined && phone !== null && phone !== '') {
    if (typeof phone !== 'string' || !/^[0-9+\s-]{8,20}$/.test(phone.trim())) {
      errors.push({ field: 'phone', message: 'Số điện thoại không hợp lệ' });
    }
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Dữ liệu đăng ký không hợp lệ', errors));
  }

  // Normalize inputs in request body
  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  if (phone) req.body.phone = phone.trim();

  next();
};

/**
 * Validate Login Request Body
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.push({ field: 'email', message: 'Email là bắt buộc' });
  } else if (!validator.isEmail(email.trim())) {
    errors.push({ field: 'email', message: 'Email không đúng định dạng' });
  }

  if (!password || typeof password !== 'string') {
    errors.push({ field: 'password', message: 'Mật khẩu là bắt buộc' });
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Dữ liệu đăng nhập không hợp lệ', errors));
  }

  req.body.email = email.trim().toLowerCase();

  next();
};

/**
 * Validate Refresh Token Request
 */
const validateRefreshToken = (req, res, next) => {
  const token = req.body.refreshToken || req.headers['x-refresh-token'];

  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return next(ApiError.badRequest('Refresh token là bắt buộc'));
  }

  req.body.refreshToken = token.trim();
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateRefreshToken,
};

