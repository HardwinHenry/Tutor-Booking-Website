const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const calendarController = require('../controllers/calendar.controller');
const {
  validateOAuthCallback,
  validateRetrySync,
  validateAdminCalendarSyncQuery,
} = require('../validators/calendar.validator');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// 1. Connection Status (Authenticated)
router.get('/status', authenticate, calendarController.getConnectionStatus);

// 2. Generate Google OAuth URL (Authenticated)
router.get('/oauth', authenticate, calendarController.getOAuthUrl);

// 3. Google OAuth Callback (Public callback redirect from Google)
router.get(
  '/oauth/callback',
  validateOAuthCallback,
  calendarController.handleOAuthCallback
);

// 4. Disconnect Google Calendar (Authenticated)
router.post('/disconnect', authenticate, calendarController.disconnectCalendar);

// 5. Manual Sync Retry (Authenticated)
router.post(
  '/sync/retry',
  authenticate,
  validateRetrySync,
  calendarController.retrySync
);

// 6. Get Sync Logs for Booking (Authenticated)
router.get('/sync/:bookingId', authenticate, calendarController.getBookingSyncLogs);

// 7. Admin Calendar Sync Monitoring (Admin only)
router.get(
  '/admin/sync',
  authenticate,
  authorize(ROLES.ADMIN),
  validateAdminCalendarSyncQuery,
  calendarController.listAdminCalendarSync
);

module.exports = router;
