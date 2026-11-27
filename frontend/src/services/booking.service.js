import apiClient from './apiClient';

/**
 * Booking Lifecycle Service
 */
export const bookingService = {
  /**
   * Learner creates a new booking request
   * Allowed fields: slotId, subjectId, subjectName, learningMode, location, learnerNote
   */
  async createBooking(data) {
    const response = await apiClient.post('/bookings', data);
    return response.data?.booking;
  },

  /**
   * Get current user's bookings (learner or tutor)
   * @param {object} [params] - { status, from, to, page, limit, sortBy, order }
   */
  async getMyBookings(params = {}) {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    const response = await apiClient.get('/bookings/me', { params: cleanParams });
    return response.data;
  },

  /**
   * Get single booking detail
   */
  async getBookingById(bookingId) {
    const response = await apiClient.get(`/bookings/${bookingId}`);
    return response.data?.booking;
  },

  /**
   * Tutor confirms pending booking (atomic slot lock)
   */
  async confirmBooking(bookingId, tutorNote) {
    const payload = tutorNote ? { tutorNote } : {};
    const response = await apiClient.patch(`/bookings/${bookingId}/confirm`, payload);
    return response.data?.booking;
  },

  /**
   * Tutor rejects pending booking with required reason
   */
  async rejectBooking(bookingId, rejectionReason) {
    const response = await apiClient.patch(`/bookings/${bookingId}/reject`, {
      rejectionReason,
    });
    return response.data?.booking;
  },

  /**
   * Learner, Tutor, or Admin cancels booking with required reason
   */
  async cancelBooking(bookingId, cancelReason) {
    const response = await apiClient.patch(`/bookings/${bookingId}/cancel`, {
      cancelReason,
    });
    return response.data?.booking;
  },

  /**
   * Tutor or Admin marks confirmed booking as completed
   */
  async completeBooking(bookingId, tutorNote) {
    const payload = tutorNote ? { tutorNote } : {};
    const response = await apiClient.patch(`/bookings/${bookingId}/complete`, payload);
    return response.data?.booking;
  },
};

export default bookingService;

