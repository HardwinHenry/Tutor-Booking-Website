const CALENDAR_SYNC_STATUS = {
  NOT_CONNECTED: 'not_connected',
  PENDING: 'pending',
  SYNCED: 'synced',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

const ALL_CALENDAR_SYNC_STATUSES = Object.values(CALENDAR_SYNC_STATUS);

const CALENDAR_CONNECTION_STATUS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  REVOKED: 'revoked',
};

const ALL_CALENDAR_CONNECTION_STATUSES = Object.values(CALENDAR_CONNECTION_STATUS);

const GOOGLE_OAUTH = {
  AUTH_URL: 'https://accounts.google.com/o/oauth2/v2/auth',
  TOKEN_URL: 'https://oauth2.googleapis.com/token',
  REVOKE_URL: 'https://oauth2.googleapis.com/revoke',
  USERINFO_URL: 'https://www.googleapis.com/oauth2/v2/userinfo',
  CALENDAR_BASE_URL: 'https://www.googleapis.com/calendar/v3',
  SCOPES: [
    'https://www.googleapis.com/auth/calendar.events',
    'openid',
    'email',
    'profile',
  ],
};

module.exports = {
  CALENDAR_SYNC_STATUS,
  ALL_CALENDAR_SYNC_STATUSES,
  CALENDAR_CONNECTION_STATUS,
  ALL_CALENDAR_CONNECTION_STATUSES,
  GOOGLE_OAUTH,
};
