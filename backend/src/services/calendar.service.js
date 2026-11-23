const mongoose = require('mongoose');
const CalendarConnection = require('../models/calendarConnection.model');
const CalendarEvent = require('../models/calendarEvent.model');
const Booking = require('../models/booking.model');
const User = require('../models/user.model');
const googleCalendarClient = require('../integrations/google-calendar/googleCalendar.client');
const {
  CALENDAR_SYNC_STATUS,
  CALENDAR_CONNECTION_STATUS,
} = require('../constants/calendarStatus');
const { ROLES } = require('../constants/roles');
const { BOOKING_STATUS } = require('../constants/bookingStatus');
const { generateOAuthState, verifyOAuthState } = require('../utils/crypto.util');
const ApiError = require('../utils/apiError');

/**
 * Generate Google OAuth authorization URL with CSRF state
 */
const getOAuthUrl = async (user, query = {}) => {
  if (!user || !user._id) {
    throw ApiError.unauthorized('Bạn cần đăng nhập để kết nối Google Calendar');
  }

  // Create CSRF protected signed state token
  const state = generateOAuthState({
    userId: user._id.toString(),
    role: user.role,
  });

  const url = googleCalendarClient.buildAuthUrl({
    state,
    redirectUri: query.redirect_uri,
  });

  return {
    url,
    state,
  };
};

/**
 * Handle Google OAuth callback
 */
const handleOAuthCallback = async ({ code, state, redirectUri }) => {
  if (!code) {
    throw ApiError.badRequest('Thiếu mã code ủy quyền từ Google');
  }
  if (!state) {
    throw ApiError.badRequest('Thiếu tham số state chống tấn công CSRF');
  }

  // Verify CSRF state token
  let decodedState;
  try {
    decodedState = verifyOAuthState(state);
  } catch (err) {
    throw ApiError.badRequest(`Xác thực state thất bại (CSRF check): ${err.message}`);
  }

  const { userId } = decodedState;
  const user = await User.findById(userId);
  if (!user || user.status !== 'active') {
    throw ApiError.forbidden('Tài khoản người dùng không tồn tại hoặc đã bị khóa');
  }

  // Exchange code for tokens
  const tokenData = await googleCalendarClient.exchangeCodeForTokens({
    code,
    redirectUri,
  });

  // Upsert CalendarConnection for user
  let connection = await CalendarConnection.findOne({ userId });
  if (!connection) {
    connection = new CalendarConnection({ userId });
  }

  connection.setTokens({
    accessToken: tokenData.accessToken,
    refreshToken: tokenData.refreshToken || (connection.encryptedRefreshToken ? null : null),
    expiryDate: tokenData.expiryDate,
    googleEmail: tokenData.googleEmail,
    googleId: tokenData.googleId,
    scope: tokenData.scope,
  });

  // Preserve existing refresh token if Google didn't return a new one on re-auth
  if (tokenData.refreshToken) {
    connection.setTokens({
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiryDate: tokenData.expiryDate,
      googleEmail: tokenData.googleEmail,
      googleId: tokenData.googleId,
      scope: tokenData.scope,
    });
  }

  await connection.save();

  return {
    success: true,
    userId: user._id,
    email: connection.googleEmail,
    status: connection.status,
    connectedAt: connection.lastConnectedAt,
  };
};

/**
 * Get Google Calendar connection status for current user
 */
const getConnectionStatus = async (user) => {
  const connection = await CalendarConnection.findOne({ userId: user._id });

  const isConnected = connection && connection.status === CALENDAR_CONNECTION_STATUS.CONNECTED;

  // Retrieve sync summary counts
  const syncSummary = {
    total: 0,
    synced: 0,
    failed: 0,
    pending: 0,
    cancelled: 0,
  };

  const syncCounts = await CalendarEvent.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(user._id) } },
    { $group: { _id: '$syncStatus', count: { $sum: 1 } } },
  ]);

  syncCounts.forEach((item) => {
    syncSummary.total += item.count;
    if (item._id === CALENDAR_SYNC_STATUS.SYNCED) syncSummary.synced = item.count;
    if (item._id === CALENDAR_SYNC_STATUS.FAILED) syncSummary.failed = item.count;
    if (item._id === CALENDAR_SYNC_STATUS.PENDING) syncSummary.pending = item.count;
    if (item._id === CALENDAR_SYNC_STATUS.CANCELLED) syncSummary.cancelled = item.count;
  });

  return {
    connected: Boolean(isConnected),
    status: connection ? connection.status : 'not_connected',
    email: connection ? connection.googleEmail : null,
    lastConnectedAt: connection ? connection.lastConnectedAt : null,
    lastDisconnectedAt: connection ? connection.lastDisconnectedAt : null,
    syncSummary,
  };
};

/**
 * Disconnect Google Calendar and revoke tokens
 */
const disconnectCalendar = async (user) => {
  const connection = await CalendarConnection.findOne({ userId: user._id });

  if (!connection || connection.status === CALENDAR_CONNECTION_STATUS.DISCONNECTED) {
    return {
      connected: false,
      message: 'Tài khoản chưa kết nối hoặc đã ngắt kết nối Google Calendar',
    };
  }

  // Attempt to revoke token at Google (best effort)
  try {
    const { refreshToken, accessToken } = connection.getDecryptedTokens();
    const tokenToRevoke = refreshToken || accessToken;
    if (tokenToRevoke) {
      await googleCalendarClient.revokeToken({ token: tokenToRevoke });
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`[CalendarService] Token revoke warning: ${err.message}`);
    }
  }

  connection.status = CALENDAR_CONNECTION_STATUS.DISCONNECTED;
  connection.lastDisconnectedAt = new Date();
  await connection.save();

  return {
    connected: false,
    message: 'Đã ngắt kết nối Google Calendar thành công',
  };
};

/**
 * Retrieve a valid access token for a user, automatically refreshing if expired
 */
const getValidAccessToken = async (userId) => {
  const connection = await CalendarConnection.findOne({
    userId,
    status: CALENDAR_CONNECTION_STATUS.CONNECTED,
  });

  if (!connection) {
    return null;
  }

  const { accessToken, refreshToken } = connection.getDecryptedTokens();

  // If token is still valid (with 5 min safety buffer), return it
  if (!connection.isTokenExpired(5) && accessToken) {
    return accessToken;
  }

  // If token expired, refresh using refreshToken
  if (!refreshToken) {
    return accessToken; // Try existing if no refresh token
  }

  try {
    const refreshed = await googleCalendarClient.refreshAccessToken({ refreshToken });
    connection.setTokens({
      accessToken: refreshed.accessToken,
      expiryDate: refreshed.expiryDate,
    });
    await connection.save();
    return refreshed.accessToken;
  } catch (err) {
    // If refresh token is revoked or rejected by Google
    if (err.status === 400 || err.status === 401 || err.code === 'invalid_grant') {
      connection.status = CALENDAR_CONNECTION_STATUS.REVOKED;
      await connection.save();
    }
    return null;
  }
};

/**
 * Sync confirmed booking to user's Google Calendar
 * Internal worker function for a single participant (learner or tutor)
 */
const syncBookingForUser = async (booking, user, userRole) => {
  const userId = user._id || user;
  const bookingId = booking._id;

  // Find or create CalendarEvent record
  let calendarEvent = await CalendarEvent.findOne({ bookingId, userId });
  if (!calendarEvent) {
    calendarEvent = new CalendarEvent({
      bookingId,
      userId,
      userRole,
      syncStatus: CALENDAR_SYNC_STATUS.PENDING,
    });
  }

  // Idempotency: if already synced and has an event ID, do not duplicate!
  if (calendarEvent.syncStatus === CALENDAR_SYNC_STATUS.SYNCED && calendarEvent.googleEventId) {
    return calendarEvent;
  }

  // Check if user has an active connection
  const connection = await CalendarConnection.findOne({
    userId,
    status: CALENDAR_CONNECTION_STATUS.CONNECTED,
  });

  if (!connection) {
    calendarEvent.syncStatus = CALENDAR_SYNC_STATUS.NOT_CONNECTED;
    calendarEvent.errorMessage = 'Người dùng chưa kết nối Google Calendar';
    await calendarEvent.save();
    return calendarEvent;
  }

  // Get valid access token
  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) {
    calendarEvent.syncStatus = CALENDAR_SYNC_STATUS.FAILED;
    calendarEvent.errorCode = 'TOKEN_EXPIRED_OR_REVOKED';
    calendarEvent.errorMessage = 'Access token đã hết hạn hoặc bị thu hồi bởi người dùng';
    await calendarEvent.save();
    return calendarEvent;
  }

  // Build event details
  const learnerName = booking.learnerId?.name || booking.learnerId?.fullName || 'Học viên';
  const tutorName = booking.tutorId?.name || booking.tutorId?.fullName || 'Gia sư';
  const otherPartyName = userRole === ROLES.TUTOR ? learnerName : tutorName;
  const roleLabel = userRole === ROLES.TUTOR ? 'Học viên' : 'Gia sư';

  const summary = `[TutorConnect] Buổi học: ${booking.subjectName || 'Khóa học'} - ${roleLabel}: ${otherPartyName}`;
  const description = [
    `Môn học: ${booking.subjectName || 'Chung'}`,
    `Hình thức: ${booking.learningMode === 'online' ? 'Trực tuyến (Online)' : 'Trực tiếp (Offline)'}`,
    `Thời lượng: ${booking.durationMinutes} phút`,
    `Học phí: ${booking.price ? booking.price.toLocaleString('vi-VN') + ' ' + (booking.currency || 'VND') : 'Thỏa thuận'}`,
    booking.learnerNote ? `Ghi chú học viên: ${booking.learnerNote}` : '',
    booking.tutorNote ? `Ghi chú gia sư: ${booking.tutorNote}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const location =
    booking.learningMode === 'online'
      ? 'Trực tuyến (Online)'
      : booking.location || 'Địa điểm trực tiếp';

  const eventPayload = {
    summary,
    description,
    location,
    start: {
      dateTime: new Date(booking.startAt).toISOString(),
      timeZone: booking.timezone || 'Asia/Ho_Chi_Minh',
    },
    end: {
      dateTime: new Date(booking.endAt).toISOString(),
      timeZone: booking.timezone || 'Asia/Ho_Chi_Minh',
    },
  };

  calendarEvent.eventDetails = {
    summary,
    description,
    location,
    startAt: booking.startAt,
    endAt: booking.endAt,
    timezone: booking.timezone || 'Asia/Ho_Chi_Minh',
  };

  try {
    const createdEvent = await googleCalendarClient.createCalendarEvent({
      accessToken,
      eventPayload,
    });

    calendarEvent.googleEventId = createdEvent.id;
    calendarEvent.googleHtmlLink = createdEvent.htmlLink || null;
    calendarEvent.syncStatus = CALENDAR_SYNC_STATUS.SYNCED;
    calendarEvent.lastSyncedAt = new Date();
    calendarEvent.errorCode = null;
    calendarEvent.errorMessage = null;
    await calendarEvent.save();

    return calendarEvent;
  } catch (err) {
    calendarEvent.syncStatus = CALENDAR_SYNC_STATUS.FAILED;
    calendarEvent.errorCode = String(err.code || 'GOOGLE_API_ERROR');
    calendarEvent.errorMessage = err.message || 'Lỗi khi gọi Google Calendar API';
    calendarEvent.lastSyncedAt = new Date();
    await calendarEvent.save();

    // Do NOT re-throw! Booking remains valid even when Calendar API errors!
    return calendarEvent;
  }
};

/**
 * Sync confirmed booking to Google Calendar for both Learner and Tutor
 * Triggered automatically by bookingEvents.on('booking.confirmed')
 */
const syncBookingConfirmed = async (booking) => {
  if (!booking) return;

  const [learnerResult, tutorResult] = await Promise.allSettled([
    syncBookingForUser(booking, booking.learnerId, ROLES.LEARNER),
    syncBookingForUser(booking, booking.tutorId, ROLES.TUTOR),
  ]);

  return {
    learnerSync: learnerResult.status === 'fulfilled' ? learnerResult.value : null,
    tutorSync: tutorResult.status === 'fulfilled' ? tutorResult.value : null,
  };
};

/**
 * Handle booking cancellation: remove or update calendar events
 * Triggered automatically by bookingEvents.on('booking.cancelled')
 */
const syncBookingCancelled = async (booking) => {
  if (!booking) return;

  const participantIds = [
    { userId: booking.learnerId?._id || booking.learnerId, role: ROLES.LEARNER },
    { userId: booking.tutorId?._id || booking.tutorId, role: ROLES.TUTOR },
  ];

  await Promise.allSettled(
    participantIds.map(async (participant) => {
      if (!participant.userId) return;

      try {
        const calendarEvent = await CalendarEvent.findOne({
          bookingId: booking._id,
          userId: participant.userId,
        });

        if (!calendarEvent || !calendarEvent.googleEventId) {
          return;
        }

        // If event was successfully synced, delete it from Google Calendar
        if (calendarEvent.syncStatus === CALENDAR_SYNC_STATUS.SYNCED) {
          const accessToken = await getValidAccessToken(participant.userId);
          if (accessToken) {
            await googleCalendarClient.deleteCalendarEvent({
              accessToken,
              eventId: calendarEvent.googleEventId,
            });
          }
        }

        calendarEvent.syncStatus = CALENDAR_SYNC_STATUS.CANCELLED;
        calendarEvent.lastSyncedAt = new Date();
        await calendarEvent.save();
      } catch (err) {
        if (process.env.NODE_ENV !== 'test') {
          console.error(`[CalendarService] Error cancelling calendar event: ${err.message}`);
        }
      }
    })
  );
};

/**
 * Retry syncing a booking for current user or admin
 * POST /api/calendar/sync/retry
 */
const retryBookingSync = async (bookingId, user) => {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    throw ApiError.badRequest('ID booking không hợp lệ');
  }

  const booking = await Booking.findById(bookingId).populate([
    { path: 'learnerId', select: 'fullName email phone' },
    { path: 'tutorId', select: 'fullName email phone' },
  ]);

  if (!booking) {
    throw ApiError.notFound('Không tìm thấy thông tin lịch hẹn');
  }

  if (booking.status !== BOOKING_STATUS.CONFIRMED) {
    throw ApiError.badRequest(
      `Chỉ có thể đồng bộ Google Calendar cho booking đã xác nhận (confirmed). Trạng thái hiện tại: "${booking.status}"`
    );
  }

  const isLearner = booking.learnerId._id.toString() === user._id.toString();
  const isTutor = booking.tutorId._id.toString() === user._id.toString();
  const isAdmin = user.role === ROLES.ADMIN;

  if (!isLearner && !isTutor && !isAdmin) {
    throw ApiError.forbidden('Bạn không có quyền đồng bộ lịch hẹn này');
  }

  const targets = [];
  if (isAdmin) {
    // Admin retries for both participants
    targets.push({ user: booking.learnerId, role: ROLES.LEARNER });
    targets.push({ user: booking.tutorId, role: ROLES.TUTOR });
  } else if (isLearner) {
    targets.push({ user: booking.learnerId, role: ROLES.LEARNER });
  } else if (isTutor) {
    targets.push({ user: booking.tutorId, role: ROLES.TUTOR });
  }

  const results = [];
  for (const target of targets) {
    let calendarEvent = await CalendarEvent.findOne({
      bookingId: booking._id,
      userId: target.user._id,
    });

    if (!calendarEvent) {
      calendarEvent = new CalendarEvent({
        bookingId: booking._id,
        userId: target.user._id,
        userRole: target.role,
        syncStatus: CALENDAR_SYNC_STATUS.PENDING,
      });
    }

    // Idempotency: if already synced, return directly without creating duplicate
    if (calendarEvent.syncStatus === CALENDAR_SYNC_STATUS.SYNCED && calendarEvent.googleEventId) {
      results.push(calendarEvent);
      continue;
    }

    calendarEvent.retryCount += 1;
    await calendarEvent.save();

    const synced = await syncBookingForUser(booking, target.user, target.role);
    results.push(synced);
  }

  return results.length === 1 ? results[0] : results;
};

/**
 * Get sync logs for a specific booking
 * GET /api/calendar/sync/:bookingId
 */
const getBookingSyncLogs = async (bookingId, user) => {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    throw ApiError.badRequest('ID booking không hợp lệ');
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw ApiError.notFound('Không tìm thấy thông tin lịch hẹn');
  }

  const isLearner = booking.learnerId.toString() === user._id.toString();
  const isTutor = booking.tutorId.toString() === user._id.toString();
  const isAdmin = user.role === ROLES.ADMIN;

  if (!isLearner && !isTutor && !isAdmin) {
    throw ApiError.forbidden('Bạn không có quyền xem thông tin đồng bộ của lịch hẹn này');
  }

  const filter = { bookingId };
  if (!isAdmin) {
    filter.userId = user._id;
  }

  const logs = await CalendarEvent.find(filter)
    .populate('userId', 'fullName email role')
    .sort({ createdAt: -1 });

  return logs;
};

/**
 * Admin listing of all calendar sync events with filters and pagination
 * GET /api/calendar/admin/sync
 */
const listAdminCalendarSync = async (query = {}) => {
  const {
    syncStatus,
    userId,
    bookingId,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    order = 'desc',
  } = query;

  const filter = {};

  if (syncStatus) {
    filter.syncStatus = syncStatus;
  }
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    filter.userId = userId;
  }
  if (bookingId && mongoose.Types.ObjectId.isValid(bookingId)) {
    filter.bookingId = bookingId;
  }

  const numericPage = Math.max(1, parseInt(page, 10) || 1);
  const numericLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (numericPage - 1) * numericLimit;
  const sortDirection = order === 'asc' ? 1 : -1;

  const [items, total] = await Promise.all([
    CalendarEvent.find(filter)
      .populate('userId', 'fullName email role')
      .populate('bookingId', 'subjectName startAt endAt status')
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(numericLimit),
    CalendarEvent.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page: numericPage,
      limit: numericLimit,
      total,
      totalPages: Math.ceil(total / numericLimit),
    },
  };
};

module.exports = {
  getOAuthUrl,
  handleOAuthCallback,
  getConnectionStatus,
  disconnectCalendar,
  getValidAccessToken,
  syncBookingConfirmed,
  syncBookingCancelled,
  retryBookingSync,
  getBookingSyncLogs,
  listAdminCalendarSync,
};
