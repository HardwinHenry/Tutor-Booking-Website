const mongoose = require('mongoose');
const Review = require('../models/review.model');
const Booking = require('../models/booking.model');
const TutorProfile = require('../models/tutorProfile.model');
const User = require('../models/user.model');
const { BOOKING_STATUS } = require('../constants/bookingStatus');
const { ROLES } = require('../constants/roles');
const ApiError = require('../utils/apiError');

/**
 * Recalculate ratingSummary for a tutor based on all active public reviews
 * @param {string|mongoose.Types.ObjectId} tutorId - Tutor's User ObjectId
 */
const recalculateTutorRating = async (tutorId) => {
  const tutorObjectId = new mongoose.Types.ObjectId(tutorId);

  const stats = await Review.aggregate([
    {
      $match: {
        tutorId: tutorObjectId,
        isPublic: true,
      },
    },
    {
      $group: {
        _id: '$tutorId',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  let averageRating = null;
  let reviewCount = 0;

  if (stats.length > 0) {
    averageRating = Math.round(stats[0].averageRating * 10) / 10;
    reviewCount = stats[0].reviewCount;
  }

  await TutorProfile.updateOne(
    { userId: tutorObjectId },
    {
      $set: {
        'ratingSummary.averageRating': averageRating,
        'ratingSummary.reviewCount': reviewCount,
      },
    }
  );

  return { averageRating, reviewCount };
};

/**
 * Create a new review for a completed booking
 * POST /api/reviews
 */
const createReview = async (user, data) => {
  const { bookingId, rating, comment } = data;

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw ApiError.notFound('Không tìm thấy thông tin lịch hẹn');
  }

  // Verification 1: Only the learner who attended the session can write a review
  if (booking.learnerId.toString() !== user._id.toString()) {
    throw ApiError.forbidden('Chỉ học viên tham gia buổi học mới có quyền đánh giá');
  }

  // Verification 2: Booking must be in COMPLETED status
  if (booking.status !== BOOKING_STATUS.COMPLETED) {
    throw ApiError.badRequest(
      `Chỉ có thể đánh giá buổi học đã hoàn thành. Trạng thái hiện tại của booking là "${booking.status}"`
    );
  }

  // Verification 3: One review per booking guarantee
  const existingReview = await Review.findOne({ bookingId: booking._id });
  if (existingReview) {
    throw ApiError.conflict('Buổi học này đã được đánh giá, không thể đánh giá lại');
  }

  // Create review
  const review = await Review.create({
    bookingId: booking._id,
    learnerId: user._id,
    tutorId: booking.tutorId,
    rating,
    comment: comment || '',
  });

  // Automatically recalculate tutor rating summary
  const updatedRating = await recalculateTutorRating(booking.tutorId);

  const populated = await Review.findById(review._id)
    .populate('learnerId', 'name avatar role')
    .populate('bookingId', 'startAt endAt durationMinutes subjectName');

  return {
    review: populated,
    tutorRatingSummary: updatedRating,
  };
};

/**
 * Get public reviews for a tutor with rating distribution and pagination
 * GET /api/tutors/:id/reviews
 */
const getTutorReviews = async (tutorIdentifier, query = {}) => {
  // Resolve tutor's User ObjectId (handles both tutor User ID or TutorProfile ID)
  let tutorId = tutorIdentifier;
  const isUser = await User.exists({ _id: tutorIdentifier, role: ROLES.TUTOR });
  if (!isUser) {
    const profile = await TutorProfile.findById(tutorIdentifier).select('userId');
    if (profile && profile.userId) {
      tutorId = profile.userId.toString();
    }
  }

  const tutorObjectId = new mongoose.Types.ObjectId(tutorId);

  // Build filter
  const filter = {
    tutorId: tutorObjectId,
    isPublic: true,
  };

  if (query.rating) {
    filter.rating = Number(query.rating);
  }

  // Pagination
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const [reviews, total, distributionAgg, tutorProfile] = await Promise.all([
    Review.find(filter)
      .populate('learnerId', 'name avatar role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
    Review.aggregate([
      { $match: { tutorId: tutorObjectId, isPublic: true } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]),
    TutorProfile.findOne({ userId: tutorObjectId }).select('ratingSummary headline introduction'),
  ]);

  // Build rating star breakdown (1 to 5)
  const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  distributionAgg.forEach((item) => {
    if (ratingBreakdown[item._id] !== undefined) {
      ratingBreakdown[item._id] = item.count;
    }
  });

  const ratingSummary = tutorProfile && tutorProfile.ratingSummary
    ? tutorProfile.ratingSummary
    : { averageRating: null, reviewCount: 0 };

  return {
    reviews,
    ratingSummary: {
      ...ratingSummary.toObject ? ratingSummary.toObject() : ratingSummary,
      breakdown: ratingBreakdown,
    },
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

/**
 * Tutor responds to a learner's review
 * POST /api/reviews/:id/response
 */
const respondToReview = async (reviewId, user, { comment }) => {
  const review = await Review.findById(reviewId);
  if (!review) {
    throw ApiError.notFound('Không tìm thấy đánh giá');
  }

  // Authorization: must be the tutor of the reviewed session
  const isTutor = review.tutorId.toString() === user._id.toString();
  const isAdmin = user.role === ROLES.ADMIN;
  if (!isTutor && !isAdmin) {
    throw ApiError.forbidden('Chỉ gia sư được đánh giá mới có quyền gửi phản hồi');
  }

  review.tutorResponse = {
    comment: comment.trim(),
    respondedAt: new Date(),
  };

  await review.save();

  return Review.findById(review._id)
    .populate('learnerId', 'name avatar role')
    .populate('tutorId', 'name avatar');
};

/**
 * Get all reviews submitted by the currently authenticated learner
 * GET /api/reviews/mine
 */
const getLearnerReviews = async (user, query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = { learnerId: user._id };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('tutorId', 'name avatar')
      .populate('bookingId', 'startAt endAt subjectName durationMinutes')
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
 * Get review by booking ID
 * GET /api/reviews/booking/:bookingId
 */
const getReviewByBookingId = async (bookingId, user) => {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    throw ApiError.badRequest('ID booking không hợp lệ');
  }

  const review = await Review.findOne({ bookingId })
    .populate('learnerId', 'name avatar role')
    .populate('tutorId', 'name avatar role');

  if (!review) {
    return null;
  }

  return review;
};

module.exports = {
  recalculateTutorRating,
  createReview,
  getTutorReviews,
  respondToReview,
  getLearnerReviews,
  getReviewByBookingId,
};
