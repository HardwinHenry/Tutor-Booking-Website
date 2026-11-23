const reviewService = require('../services/review.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc Create review for a completed booking
 * @route POST /api/reviews
 * @access Private (Learner only)
 */
const createReview = asyncHandler(async (req, res) => {
  const result = await reviewService.createReview(req.user, req.body);
  return ApiResponse.created(res, result, 'Đánh giá buổi học thành công');
});

/**
 * @desc Get public reviews for a tutor
 * @route GET /api/tutors/:id/reviews
 * @access Public
 */
const getTutorReviews = asyncHandler(async (req, res) => {
  const result = await reviewService.getTutorReviews(req.params.id, req.query);
  return ApiResponse.ok(res, result, 'Lấy danh sách đánh giá gia sư thành công');
});

/**
 * @desc Tutor responds to a learner's review
 * @route POST /api/reviews/:id/response
 * @access Private (Tutor only)
 */
const respondToReview = asyncHandler(async (req, res) => {
  const result = await reviewService.respondToReview(req.params.id, req.user, req.body);
  return ApiResponse.ok(res, result, 'Gửi phản hồi đánh giá thành công');
});

/**
 * @desc Get all reviews submitted by the currently authenticated learner
 * @route GET /api/reviews/mine
 * @access Private (Learner only)
 */
const getMyReviews = asyncHandler(async (req, res) => {
  const result = await reviewService.getLearnerReviews(req.user, req.query);
  return ApiResponse.ok(res, result, 'Lấy danh sách đánh giá của bạn thành công');
});

/**
 * @desc Get review for a specific booking
 * @route GET /api/reviews/booking/:bookingId
 * @access Private (Learner, Tutor, Admin)
 */
const getBookingReview = asyncHandler(async (req, res) => {
  const result = await reviewService.getReviewByBookingId(req.params.bookingId, req.user);
  return ApiResponse.ok(res, result, 'Lấy thông tin đánh giá theo booking thành công');
});

module.exports = {
  createReview,
  getTutorReviews,
  respondToReview,
  getMyReviews,
  getBookingReview,
};
