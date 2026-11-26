import apiClient from './apiClient';

/**
 * Google Calendar Integration Service
 */
export const calendarService = {
  /**
   * Get current user's Google Calendar connection status & sync summary
   */
  async getStatus() {
    const response = await apiClient.get('/calendar/status');
    return response.data;
  },

  /**
   * Get Google OAuth authorization URL initiated by Backend
   */
  async getOAuthUrl(params = {}) {
    const response = await apiClient.get('/calendar/oauth', { params });
    return response.data;
  },

  /**
   * Disconnect Google Calendar
   */
  async disconnect() {
    const response = await apiClient.post('/calendar/disconnect');
    return response.data;
  },

  /**
   * Retry calendar synchronization for a specific booking
   */
  async retrySync(bookingId) {
    const response = await apiClient.post('/calendar/sync/retry', { bookingId });
    return response.data;
  },

  /**
   * Get calendar sync logs for a specific booking
   */
  async getBookingSyncLogs(bookingId) {
    const response = await apiClient.get(`/calendar/sync/${bookingId}`);
    return response.data;
  },
};

export default calendarService;

