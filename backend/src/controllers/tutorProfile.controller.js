const tutorProfileService = require('../services/tutorProfile.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get current tutor's profile
 * GET /api/tutors/profile/me
 */
const getMyProfile = asyncHandler(async (req, res) => {
  const shouldPopulate = req.query.populate !== 'false';
  const profile = await tutorProfileService.getProfileByUserId(req.user._id, {
    populate: shouldPopulate,
  });
  return ApiResponse.ok(res, { profile }, 'Lấy thông tin hồ sơ gia sư thành công');
});

/**
 * Update / save draft of tutor profile
 * PUT /api/tutors/profile/me, PATCH /api/tutors/profile/me
 */
const updateMyProfile = asyncHandler(async (req, res) => {
  const profile = await tutorProfileService.updateProfile(req.user._id, req.body);
  return ApiResponse.ok(res, { profile }, 'Lưu tiến độ hồ sơ gia sư thành công');
});

/**
 * Submit tutor profile for approval
 * POST /api/tutors/profile/submit
 */
const submitMyProfile = asyncHandler(async (req, res) => {
  const profile = await tutorProfileService.submitProfile(req.user._id, req.body);
  return ApiResponse.ok(
    res,
    { profile },
    'Nộp hồ sơ gia sư thành công. Hồ sơ đang được chờ phê duyệt.'
  );
});

/**
 * Get public profile of a tutor by ID
 * GET /api/tutors/:id
 */
const getPublicProfile = asyncHandler(async (req, res) => {
  const viewerRole = req.user ? req.user.role : null;
  const profile = await tutorProfileService.getPublicProfile(req.params.id, viewerRole);
  return ApiResponse.ok(res, { profile }, 'Lấy thông tin công khai gia sư thành công');
});

/**
 * Public search for tutors with filters, sorting, and pagination (Phase 5)
 * GET /api/tutors
 */
const searchTutors = asyncHandler(async (req, res) => {
  const viewerRole = req.user ? req.user.role : null;
  const result = await tutorProfileService.searchTutors(req.query, viewerRole);
  return ApiResponse.ok(res, result, 'Tìm kiếm gia sư thành công');
});

/**
 * Admin: Get list of tutors with filtering, search, and pagination (Phase 5)
 * GET /api/admin/tutors
 */
const getAdminTutors = asyncHandler(async (req, res) => {
  const result = await tutorProfileService.getAdminTutors(req.query);
  return ApiResponse.ok(res, result, 'Lấy danh sách gia sư cho quản trị viên thành công');
});

/**
 * Admin: Get full tutor detail by ID for review (Phase 5)
 * GET /api/admin/tutors/:id
 */
const getAdminTutorDetail = asyncHandler(async (req, res) => {
  const profile = await tutorProfileService.getAdminTutorDetail(req.params.id);
  return ApiResponse.ok(res, { profile }, 'Lấy chi tiết hồ sơ gia sư thành công');
});

/**
 * Admin: Approve or reject tutor profile (Phase 5)
 * PATCH /api/admin/tutors/:id/approval
 */
const updateTutorApproval = asyncHandler(async (req, res) => {
  const profile = await tutorProfileService.updateTutorApproval(
    req.params.id,
    req.user._id,
    req.body
  );
  return ApiResponse.ok(
    res,
    { profile },
    profile.approvalStatus === 'approved'
      ? 'Phê duyệt hồ sơ gia sư thành công'
      : 'Đã từ chối hồ sơ gia sư'
  );
});

module.exports = {
  getMyProfile,
  updateMyProfile,
  submitMyProfile,
  getPublicProfile,
  searchTutors,
  getAdminTutors,
  getAdminTutorDetail,
  updateTutorApproval,
};
