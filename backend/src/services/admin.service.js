const mongoose = require('mongoose');
const User = require('../models/user.model');
const TutorProfile = require('../models/tutorProfile.model');
const LearnerPreference = require('../models/learnerPreference.model');
const Booking = require('../models/booking.model');
const Review = require('../models/review.model');
const { ROLES } = require('../constants/roles');
const { USER_STATUS } = require('../constants/userStatus');
const { recalculateTutorRating } = require('./review.service');
const ApiError = require('../utils/apiError');

/**
 * List all users with filtering, searching, and pagination for Admin
 * GET /api/admin/users
 */
const listUsers = async (query = {}) => {
  const { role, status, search, q, sortBy = 'createdAt', sortOrder = 'desc' } = query;

  const filter = {};

  if (role) {
    filter.role = role;
  }

  if (status) {
    filter.status = status;
  }

  const keyword = search || q;
  if (keyword && keyword.trim()) {
    const escapedKeyword = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedKeyword, 'i');
    filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
  }

  // Pagination
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  // Sorting
  const sortDirection = sortOrder.toLowerCase() === 'asc' ? 1 : -1;
  const sortOptions = { [sortBy]: sortDirection };

  const [users, total, statsAgg] = await Promise.all([
    User.find(filter)
      .select('-passwordHash -refreshToken')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
    User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          totalActive: { $sum: { $cond: [{ $eq: ['$status', USER_STATUS.ACTIVE] }, 1, 0] } },
          totalLocked: { $sum: { $cond: [{ $eq: ['$status', USER_STATUS.LOCKED] }, 1, 0] } },
          totalDisabled: { $sum: { $cond: [{ $eq: ['$status', USER_STATUS.DISABLED] }, 1, 0] } },
          totalLearners: { $sum: { $cond: [{ $eq: ['$role', ROLES.LEARNER] }, 1, 0] } },
          totalTutors: { $sum: { $cond: [{ $eq: ['$role', ROLES.TUTOR] }, 1, 0] } },
          totalAdmins: { $sum: { $cond: [{ $eq: ['$role', ROLES.ADMIN] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const summary = statsAgg[0] || {
    totalUsers: total,
    totalActive: 0,
    totalLocked: 0,
    totalDisabled: 0,
    totalLearners: 0,
    totalTutors: 0,
    totalAdmins: 0,
  };
  delete summary._id;

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
    summary,
  };
};

/**
 * Get detailed profile and statistics for a specific user
 * GET /api/admin/users/:id
 */
const getUserDetail = async (userId) => {
  const user = await User.findById(userId).select('-passwordHash -refreshToken');
  if (!user) {
    throw ApiError.notFound('Không tìm thấy người dùng');
  }

  let profile = null;
  if (user.role === ROLES.TUTOR) {
    profile = await TutorProfile.findOne({ userId: user._id })
      .populate('expertise.categoryId', 'name slug')
      .populate('expertise.subjectIds', 'name slug')
      .populate('teachingCapabilities.methods', 'name slug')
      .populate('teachingCapabilities.styles', 'name slug');
  } else if (user.role === ROLES.LEARNER) {
    profile = await LearnerPreference.findOne({ userId: user._id })
      .populate('targetSubject.categoryId', 'name slug')
      .populate('targetSubject.subjectId', 'name slug');
  }

  // Aggregate user bookings
  const bookingFilter = user.role === ROLES.TUTOR ? { tutorId: user._id } : { learnerId: user._id };
  const [bookingCount, completedCount, cancelledCount] = await Promise.all([
    Booking.countDocuments(bookingFilter),
    Booking.countDocuments({ ...bookingFilter, status: 'completed' }),
    Booking.countDocuments({ ...bookingFilter, status: 'cancelled' }),
  ]);

  return {
    user,
    profile,
    bookingStats: {
      total: bookingCount,
      completed: completedCount,
      cancelled: cancelledCount,
    },
  };
};

/**
 * Update user status (lock, unlock, disable)
 * PATCH /api/admin/users/:id/status
 */
const updateUserStatus = async (targetUserId, adminUser, { status, reason }) => {
  // Security guard: Admin cannot lock or disable their own account
  if (targetUserId.toString() === adminUser._id.toString()) {
    throw ApiError.badRequest('Quản trị viên không thể tự khóa hoặc vô hiệu hóa tài khoản của chính mình');
  }

  const user = await User.findById(targetUserId);
  if (!user) {
    throw ApiError.notFound('Không tìm thấy người dùng');
  }

  const previousStatus = user.status;
  user.status = status;

  // Invalidate refresh token when user is locked or disabled
  if (status !== USER_STATUS.ACTIVE) {
    user.refreshToken = null;
  }

  await user.save();

  const sanitizedUser = await User.findById(user._id).select('-passwordHash -refreshToken');

  return {
    user: sanitizedUser,
    previousStatus,
    reason: reason || null,
    updatedBy: adminUser._id,
  };
};

/**
 * List all reviews for Admin moderation
 * GET /api/admin/reviews
 */
const listAdminReviews = async (query = {}) => {
  const { tutorId, learnerId, rating, isPublic } = query;
  const filter = {};

  if (tutorId && mongoose.Types.ObjectId.isValid(tutorId)) {
    filter.tutorId = tutorId;
  }
  if (learnerId && mongoose.Types.ObjectId.isValid(learnerId)) {
    filter.learnerId = learnerId;
  }
  if (rating) {
    filter.rating = Number(rating);
  }
  if (isPublic !== undefined) {
    filter.isPublic = isPublic === 'true' || isPublic === true;
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('learnerId', 'name email role')
      .populate('tutorId', 'name email role')
      .populate('bookingId', 'startAt endAt subjectName durationMinutes status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
  ]);

  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

/**
 * Toggle review visibility (hide/show) for moderation
 * PATCH /api/admin/reviews/:id/visibility
 */
const updateReviewVisibility = async (reviewId, { isPublic }) => {
  const review = await Review.findById(reviewId);
  if (!review) {
    throw ApiError.notFound('Không tìm thấy đánh giá');
  }

  review.isPublic = isPublic;
  await review.save();

  // Recalculate tutor rating
  await recalculateTutorRating(review.tutorId);

  return review;
};

module.exports = {
  listUsers,
  getUserDetail,
  updateUserStatus,
  listAdminReviews,
  updateReviewVisibility,
};
