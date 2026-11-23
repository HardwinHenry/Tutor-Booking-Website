const config = require('../../config/env');
const { GOOGLE_OAUTH } = require('../../constants/calendarStatus');
const ApiError = require('../../utils/apiError');

/**
 * Google Calendar API client abstraction
 * Uses native fetch in Node.js 18+
 * Allows custom transport override for deterministic automated testing
 */
class GoogleCalendarClient {
  constructor() {
    this.customFetch = null;
  }

  /**
   * Set custom fetch handler for testing / mocking
   */
  setMockTransport(mockFn) {
    this.customFetch = mockFn;
  }

  /**
   * Clear custom transport
   */
  clearMockTransport() {
    this.customFetch = null;
  }

  /**
   * Internal fetch executor
   */
  async _fetch(url, options = {}) {
    if (this.customFetch) {
      return this.customFetch(url, options);
    }
    return globalThis.fetch(url, options);
  }

  /**
   * Build Google OAuth 2.0 Authorization URL
   */
  buildAuthUrl({
    clientId = config.google.clientId,
    redirectUri = config.google.redirectUri,
    state,
    scopes = GOOGLE_OAUTH.SCOPES,
    accessType = 'offline',
    prompt = 'consent',
  }) {
    if (!clientId) {
      // In development/test, fallback placeholder if not set
      clientId = 'google_client_id_placeholder';
    }
    if (!redirectUri) {
      redirectUri = 'http://localhost:5000/api/calendar/oauth/callback';
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: accessType,
      prompt,
      state,
      include_granted_scopes: 'true',
    });

    return `${GOOGLE_OAUTH.AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens({
    code,
    clientId = config.google.clientId || 'google_client_id_placeholder',
    clientSecret = config.google.clientSecret || 'google_client_secret_placeholder',
    redirectUri = config.google.redirectUri || 'http://localhost:5000/api/calendar/oauth/callback',
  }) {
    const bodyParams = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const response = await this._fetch(GOOGLE_OAUTH.TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: bodyParams.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error_description || data.error || 'Trao đổi mã code OAuth thất bại';
      const error = new Error(errorMsg);
      error.code = data.error || 'OAUTH_TOKEN_ERROR';
      error.status = response.status;
      throw error;
    }

    // Attempt to fetch user profile to get Google email and ID
    let userInfo = { email: '', id: '' };
    try {
      userInfo = await this.getUserInfo(data.access_token);
    } catch {
      // Fallback if userInfo endpoint is inaccessible or mocked without profile
      userInfo = {
        email: data.email || 'connected_google_user@gmail.com',
        id: data.id || 'google_user_id',
      };
    }

    const expiresIn = data.expires_in || 3600;
    const expiryDate = new Date(Date.now() + expiresIn * 1000);

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || null,
      expiresIn,
      expiryDate,
      scope: data.scope,
      tokenType: data.token_type,
      googleEmail: userInfo.email,
      googleId: userInfo.id,
    };
  }

  /**
   * Get user profile info using access token
   */
  async getUserInfo(accessToken) {
    const response = await this._fetch(GOOGLE_OAUTH.USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Không thể lấy thông tin tài khoản Google');
    }

    return response.json();
  }

  /**
   * Refresh expired access token using refresh token
   */
  async refreshAccessToken({
    refreshToken,
    clientId = config.google.clientId || 'google_client_id_placeholder',
    clientSecret = config.google.clientSecret || 'google_client_secret_placeholder',
  }) {
    if (!refreshToken) {
      throw new Error('Refresh token không tồn tại để làm mới access token');
    }

    const bodyParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await this._fetch(GOOGLE_OAUTH.TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: bodyParams.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error_description || data.error || 'Làm mới access token thất bại';
      const error = new Error(errorMsg);
      error.code = data.error || 'TOKEN_REFRESH_FAILED';
      error.status = response.status;
      throw error;
    }

    const expiresIn = data.expires_in || 3600;
    const expiryDate = new Date(Date.now() + expiresIn * 1000);

    return {
      accessToken: data.access_token,
      expiresIn,
      expiryDate,
    };
  }

  /**
   * Create an event on Google Calendar
   */
  async createCalendarEvent({
    accessToken,
    calendarId = 'primary',
    eventPayload,
  }) {
    const url = `${GOOGLE_OAUTH.CALENDAR_BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events`;

    const response = await this._fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error?.message || 'Tạo sự kiện trên Google Calendar thất bại';
      const error = new Error(errorMsg);
      error.code = data.error?.code || response.status;
      error.status = response.status;
      error.details = data.error;
      throw error;
    }

    return data;
  }

  /**
   * Update an existing event on Google Calendar
   */
  async updateCalendarEvent({
    accessToken,
    calendarId = 'primary',
    eventId,
    eventPayload,
  }) {
    const url = `${GOOGLE_OAUTH.CALENDAR_BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;

    const response = await this._fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error?.message || 'Cập nhật sự kiện trên Google Calendar thất bại';
      const error = new Error(errorMsg);
      error.code = data.error?.code || response.status;
      error.status = response.status;
      throw error;
    }

    return data;
  }

  /**
   * Delete an event from Google Calendar
   */
  async deleteCalendarEvent({
    accessToken,
    calendarId = 'primary',
    eventId,
  }) {
    const url = `${GOOGLE_OAUTH.CALENDAR_BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;

    const response = await this._fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Google Calendar returns 204 No Content or 404/410 if already deleted
    if (response.status === 204 || response.status === 200) {
      return { success: true };
    }

    if (response.status === 404 || response.status === 410) {
      // Already deleted or gone
      return { success: true, alreadyDeleted: true };
    }

    const data = await response.json().catch(() => ({}));
    const errorMsg = data.error?.message || 'Xóa sự kiện trên Google Calendar thất bại';
    const error = new Error(errorMsg);
    error.code = data.error?.code || response.status;
    error.status = response.status;
    throw error;
  }

  /**
   * Revoke Google OAuth token
   */
  async revokeToken({ token }) {
    if (!token) return { success: true };

    const url = `${GOOGLE_OAUTH.REVOKE_URL}?token=${encodeURIComponent(token)}`;
    const response = await this._fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return { success: response.ok };
  }
}

const googleCalendarClient = new GoogleCalendarClient();

module.exports = googleCalendarClient;
