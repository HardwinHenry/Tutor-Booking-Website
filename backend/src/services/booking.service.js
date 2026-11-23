const mongoose = require('mongoose');
const Booking = require('../models/booking.model');
const AvailabilitySlot = require('../models/availabilitySlot.model');
const User = require('../models/user.model');
const TutorProfile = require('../models/tutorProfile.model');
const ApiError = require('../utils/apiError');
const { ROLES } = require('../constants/roles');
const { USER_STATUS } = require('../constants/userStatus');
const { APPROVAL_STATUS } = require('../constants/profileStatus');
const { SLOT_STATUS } = require('../constants/availabilityStatus');
const {
  BOOKING_STATUS,
  CANCELLED_BY_ROLES,
  isValidTransition,
} = require('../constants/bookingStatus');
const { bookingEvents, BOOKING_EVENT_NAMES } = require('../events/booking.events');

/**
 * Standard populate options for booking queries
 */
const BOOKING_POPULATE = [
  { path: 'learnerId', select: '_id name email avatar phone' },
  { path: 'tutorId', select: '_id name email avatar phone' },
  { path: 'slotId', select: '_id startAt endAt timezone status note' },
  { path: 'subjectId', select: '_id name type slug' },
  { path: 'cancelledBy', select: '_id name email role' },
  { path: 'completedBy', select: '_id name email role' },
];

/**
 * Create a new booking request by a Learner
 * POST /api/bookings
 */
const createBooking = async (learnerUserId, bookingData) => {
  const {
    slotId,
    subjectId = null,
    subjectName = '',
    learningMode = 'online',
    location = '',
    learnerNote = '',
  } = bookingData;

  // 1. Verify Slot exists
  const slot = await AvailabilitySlot.findById(slotId);
  if (!slot) {
    throw ApiError.notFound('Không tìm thấy lịch dạy (slot)');
  }

  // 2. Verify Slot is available
  if (slot.status !== SLOT_STATUS.AVAILABLE) {
    throw ApiError.badRequest('Lịch dạy không còn khả dụng để đặt (đã được đặt hoặc đã đóng)');
  }

  // 3. Verify slot timing (cannot book slot starting in the past)
  const now = new Date();
  if (new Date(slot.startAt) <= now) {
    throw ApiError.badRequest('Không thể đặt lịch dạy đã qua hoặc đang diễn ra');
  }

  // 4. Tutor cannot book their own slot
  if (slot.tutorId.toString() === learnerUserId.toString()) {
    throw ApiError.badRequest('Gia sư không thể tự đặt lịch dạy của chính mình');
  }

  // 5. Verify Tutor user is active and approved
  const tutorUser = await User.findById(slot.tutorId);
  if (!tutorUser || tutorUser.status !== USER_STATUS.ACTIVE) {
    throw ApiError.badRequest('Gia sư của lịch dạy này hiện không hoạt động');
  }

  const tutorProfile = await TutorProfile.findOne({ userId: slot.tutorId });
  if (!tutorProfile || tutorProfile.approvalStatus !== APPROVAL_STATUS.APPROVED) {
    throw ApiError.badRequest('Hồ sơ của gia sư chưa được phê duyệt để nhận đặt lịch');
  }

  // 6. Snapshot pricing and duration
  const startAt = new Date(slot.startAt);
  const endAt = new Date(slot.endAt);
  const durationMinutes = Math.round((endAt.getTime() - startAt.getTime()) / 60000);

  // Price snapshot: use hourly rate from tutor profile if available
  // e.g., priceMin is per hour or per session, or slot price
  let snapshotPrice = 0;
  if (tutorProfile.teachingConditions) {
    const hourlyRate = tutorProfile.teachingConditions.priceMin || 0;
    // Calculate price proportionally to duration (based on 60 minutes)
    snapshotPrice = Math.round((hourlyRate * durationMinutes) / 60);
  }
  const currency = tutorProfile.teachingConditions?.currency || 'VND';

  // 7. Check if this learner already has a pending booking for this exact slot
  const existingPending = await Booking.findOne({
    learnerId: learnerUserId,
    slotId: slot._id,
    status: BOOKING_STATUS.PENDING,
  });
  if (existingPending) {
    throw ApiError.badRequest('Bạn đã gửi một yêu cầu đặt lịch đang chờ duyệt cho khung giờ này');
  }

  // 8. Create booking document in PENDING state (pending does not lock slot in MVP)
  const newBooking = await Booking.create({
    learnerId: learnerUserId,
    tutorId: slot.tutorId,
    slotId: slot._id,
    status: BOOKING_STATUS.PENDING,
    startAt,
    endAt,
    timezone: slot.timezone,
    durationMinutes,
    price: snapshotPrice,
    currency,
    subjectId,
    subjectName,
    learningMode,
    location,
    learnerNote,
  });

  const populated = await Booking.findById(newBooking._id).populate(BOOKING_POPULATE);

  // 9. Emit event for notifications and tracking
  bookingEvents.emit(BOOKING_EVENT_NAMES.CREATED, populated);

  return populated;
};

/**
 * Get current user's bookings with role-based filtering, date range & pagination
 * GET /api/bookings/me
 */
const getMyBookings = async (user, query = {}) => {
  const {
    status,
    from,
    to,
    page = 1,
    limit = 20,
    sortBy = 'startAt',
    order = 'desc',
  } = query;

  const filter = {};

  // Role separation
  if (user.role === ROLES.LEARNER) {
    filter.learnerId = user._id;
  } else if (user.role === ROLES.TUTOR) {
    filter.tutorId = user._id;
  } else if (user.role === ROLES.ADMIN) {
    // Admin can specify learnerId or tutorId query
    if (query.learnerId) filter.learnerId = query.learnerId;
    if (query.tutorId) filter.tutorId = query.tutorId;
  }

  // Filter by booking status
  if (status && status !== 'all') {
    filter.status = status;
  }

  // Date range filter
  if (from || to) {
    filter.startAt = {};
    if (from) filter.startAt.$gte = new Date(from);
    if (to) filter.startAt.$lte = new Date(to);
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const sortDirection = order === 'asc' ? 1 : -1;
  const sort = { [sortBy]: sortDirection };

  const [items, total] = await Promise.all([
    Booking.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate(BOOKING_POPULATE),
    Booking.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
};

/**
 * Get single booking by ID with ownership enforcement
 * GET /api/bookings/:id
 */
const getBookingById = async (bookingId, user) => {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    throw ApiError.badRequest('ID booking không hợp lệ');
  }

  const booking = await Booking.findById(bookingId).populate(BOOKING_POPULATE);
  if (!booking) {
    throw ApiError.notFound('Không tìm thấy thông tin lịch hẹn');
  }

  // Ownership verification
  const isLearner = booking.learnerId && booking.learnerId._id.toString() === user._id.toString();
  const isTutor = booking.tutorId && booking.tutorId._id.toString() === user._id.toString();
  const isAdmin = user.role === ROLES.ADMIN;

  if (!isLearner && !isTutor && !isAdmin) {
    throw ApiError.forbidden('Bạn không có quyền xem thông tin lịch hẹn này');
  }

  return booking;
};

/**
 * Confirm a pending booking (Tutor or Admin only)
 * Atomically transitions slot status: AVAILABLE -> BOOKED
 * PATCH /api/bookings/:id/confirm
 */
const confirmBooking = async (bookingId, user, body = {}) => {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    throw ApiError.badRequest('ID booking không hợp lệ');
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw ApiError.notFound('Không tìm thấy thông tin lịch hẹn');
  }

  // Authorization: must be the assigned tutor or admin
  const isTutor = booking.tutorId.toString() === user._id.toString();
  const isAdmin = user.role === ROLES.ADMIN;
  if (!isTutor && !isAdmin) {
    throw ApiError.forbidden('Chỉ gia sư sở hữu lịch hẹn hoặc Quản trị viên mới có thể xác nhận');
  }

  // State machine check
  if (!isValidTransition(booking.status, BOOKING_STATUS.CONFIRMED)) {
    throw ApiError.badRequest(
      `Không thể xác nhận booking đang ở trạng thái "${booking.status}". Chỉ có thể xác nhận booking đang "pending"`
    );
  }

  // Atomic slot locking: ensure slot is still available and mark it booked atomically
  const bookedSlot = await AvailabilitySlot.atomicBookSlot(booking.slotId, booking._id);
  if (!bookedSlot) {
    throw ApiError.conflict(
      'Lịch dạy này đã bị chiếm bởi một lịch hẹn khác hoặc không còn khả dụng'
    );
  }

  // Update booking status
  booking.status = BOOKING_STATUS.CONFIRMED;
  booking.confirmedAt = new Date();
  if (body.tutorNote) {
    booking.tutorNote = body.tutorNote;
  }
  await booking.save();

  // Auto-reject any OTHER pending bookings competing for the same slot
  await Booking.updateMany(
    {
      _id: { $ne: booking._id },
      slotId: booking.slotId,
      status: BOOKING_STATUS.PENDING,
    },
    {
      status: BOOKING_STATUS.REJECTED,
      rejectedAt: new Date(),
      rejectionReason: 'Khung giờ này đã được gia sư xác nhận cho học viên khác',
    }
  );

  const populated = await Booking.findById(booking._id).populate(BOOKING_POPULATE);

  // Emit event for calendar sync and notifications
  bookingEvents.emit(BOOKING_EVENT_NAMES.CONFIRMED, populated);

  return populated;
};

/**
 * Reject a pending booking (Tutor or Admin only)
 * PATCH /api/bookings/:id/reject
 */
const rejectBooking = async (bookingId, user, body = {}) => {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    throw ApiError.badRequest('ID booking không hợp lệ');
  }

  const { rejectionReason } = body;
  if (!rejectionReason || !rejectionReason.trim()) {
    throw ApiError.badRequest('Lý do từ chối (rejectionReason) là bắt buộc');
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw ApiError.notFound('Không tìm thấy thông tin lịch hẹn');
  }

  // Authorization: must be the assigned tutor or admin
  const isTutor = booking.tutorId.toString() === user._id.toString();
  const isAdmin = user.role === ROLES.ADMIN;
  if (!isTutor && !isAdmin) {
    throw ApiError.forbidden('Chỉ gia sư sở hữu lịch hẹn hoặc Quản trị viên mới có thể từ chối');
  }

  // State machine check
  if (!isValidTransition(booking.status, BOOKING_STATUS.REJECTED)) {
    throw ApiError.badRequest(
      `Không thể từ chối booking đang ở trạng thái "${booking.status}". Chỉ có thể từ chối booking đang "pending"`
    );
  }

  booking.status = BOOKING_STATUS.REJECTED;
  booking.rejectedAt = new Date();
  booking.rejectionReason = rejectionReason.trim();
  await booking.save();

  const populated = await Booking.findById(booking._id).populate(BOOKING_POPULATE);

  // Emit event
  bookingEvents.emit(BOOKING_EVENT_NAMES.REJECTED, populated);

  return populated;
};

/**
 * Cancel a booking (Learner cancels pending/confirmed; Tutor cancels confirmed; Admin cancels either)
 * If previously confirmed, atomically releases the slot back to AVAILABLE
 * PATCH /api/bookings/:id/cancel
 */
const cancelBooking = async (bookingId, user, body = {}) => {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    throw ApiError.badRequest('ID booking không hợp lệ');
  }

  const { cancelReason } = body;
  if (!cancelReason || !cancelReason.trim()) {
    throw ApiError.badRequest('Lý do hủy (cancelReason) là bắt buộc');
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw ApiError.notFound('Không tìm thấy thông tin lịch hẹn');
  }

  const isLearner = booking.learnerId.toString() === user._id.toString();
  const isTutor = booking.tutorId.toString() === user._id.toString();
  const isAdmin = user.role === ROLES.ADMIN;

  if (!isLearner && !isTutor && !isAdmin) {
    throw ApiError.forbidden('Bạn không có quyền hủy lịch hẹn này');
  }

  // State machine check: can only cancel pending or confirmed
  if (!isValidTransition(booking.status, BOOKING_STATUS.CANCELLED)) {
    throw ApiError.badRequest(
      `Không thể hủy booking đã ở trạng thái "${booking.status}"`
    );
  }

  // Role policy checks
  let cancelledByRole = CANCELLED_BY_ROLES.LEARNER;
  if (isAdmin) {
    cancelledByRole = CANCELLED_BY_ROLES.ADMIN;
  } else if (isTutor) {
    cancelledByRole = CANCELLED_BY_ROLES.TUTOR;
    // Tutor cannot cancel a pending booking; must use reject instead
    if (booking.status === BOOKING_STATUS.PENDING) {
      throw ApiError.badRequest(
        'Gia sư không thể hủy yêu cầu đang pending. Vui lòng sử dụng tính năng từ chối (reject)'
      );
    }
  }

  const wasConfirmed = booking.status === BOOKING_STATUS.CONFIRMED;

  // If booking was confirmed, atomically release the slot back to AVAILABLE
  if (wasConfirmed) {
    await AvailabilitySlot.atomicReleaseSlot(booking.slotId, booking._id);
  }

  booking.status = BOOKING_STATUS.CANCELLED;
  booking.cancelledAt = new Date();
  booking.cancelledBy = user._id;
  booking.cancelledByRole = cancelledByRole;
  booking.cancelReason = cancelReason.trim();
  await booking.save();

  const populated = await Booking.findById(booking._id).populate(BOOKING_POPULATE);

  // Emit event
  bookingEvents.emit(BOOKING_EVENT_NAMES.CANCELLED, populated);

  return populated;
};

/**
 * Complete a confirmed booking after the session has concluded
 * PATCH /api/bookings/:id/complete
 */
const completeBooking = async (bookingId, user, body = {}) => {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    throw ApiError.badRequest('ID booking không hợp lệ');
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw ApiError.notFound('Không tìm thấy thông tin lịch hẹn');
  }

  const isTutor = booking.tutorId.toString() === user._id.toString();
  const isAdmin = user.role === ROLES.ADMIN;

  if (!isTutor && !isAdmin) {
    throw ApiError.forbidden('Chỉ gia sư sở hữu lịch hẹn hoặc Quản trị viên mới có thể hoàn tất buổi học');
  }

  // State machine check: must be CONFIRMED
  if (!isValidTransition(booking.status, BOOKING_STATUS.COMPLETED)) {
    throw ApiError.badRequest(
      `Không thể hoàn tất booking ở trạng thái "${booking.status}". Buổi học phải ở trạng thái "confirmed"`
    );
  }

  // Session time check: must have passed session end time (unless Admin overrides)
  if (new Date(booking.endAt) > new Date() && !isAdmin) {
    throw ApiError.badRequest(
      'Chỉ có thể đánh dấu hoàn tất sau khi thời gian kết thúc buổi học đã qua'
    );
  }

  booking.status = BOOKING_STATUS.COMPLETED;
  booking.completedAt = new Date();
  booking.completedBy = user._id;
  if (body.tutorNote) {
    booking.tutorNote = body.tutorNote;
  }
  await booking.save();

  const populated = await Booking.findById(booking._id).populate(BOOKING_POPULATE);

  // Emit event
  bookingEvents.emit(BOOKING_EVENT_NAMES.COMPLETED, populated);

  return populated;
};

/**
 * Admin: List all bookings across system with filters and pagination
 * GET /api/admin/bookings
 */
const adminListBookings = async (query = {}) => {
  const {
    learnerId,
    tutorId,
    status,
    from,
    to,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    order = 'desc',
  } = query;

  const filter = {};

  if (learnerId) filter.learnerId = learnerId;
  if (tutorId) filter.tutorId = tutorId;
  if (status && status !== 'all') filter.status = status;

  if (from || to) {
    filter.startAt = {};
    if (from) filter.startAt.$gte = new Date(from);
    if (to) filter.startAt.$lte = new Date(to);
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const sortDirection = order === 'asc' ? 1 : -1;
  const sort = { [sortBy]: sortDirection };

  const [items, total] = await Promise.all([
    Booking.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate(BOOKING_POPULATE),
    Booking.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  confirmBooking,
  rejectBooking,
  cancelBooking,
  completeBooking,
  adminListBookings,
};
