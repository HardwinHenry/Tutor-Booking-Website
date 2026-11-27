import apiClient from './apiClient';

/**
 * Review & Rating Service
 */
export const reviewService = {
  /**
   * Learner submits a review for a completed booking
   * @param {{ bookingId: string, rating: number, comment?: string }} data
   */
  async createReview(data) {
    const response = await apiClient.post('/reviews', data);
    return response.data;
  },

  /**
   * Get reviews submitted by the authenticated learner
   */
  async getMyReviews(params = {}) {
    const response = await apiClient.get('/reviews/mine', { params });
    return response.data;
  },

  /**
   * Get existing review for a specific booking (returns null if not yet reviewed)
   */
  async getBookingReview(bookingId) {
    const response = await apiClient.get(`/reviews/booking/${bookingId}`);
    return response.data;
  },

  /**
   * Public: Get reviews & rating summary for a tutor
   */
  async getTutorReviews(tutorId, params = {}) {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    const response = await apiClient.get(`/tutors/${tutorId}/reviews`, {
      params: cleanParams,
    });
    return response.data;
  },

  /**
   * Tutor responds to a learner's review
   */
  async respondToReview(reviewId, comment) {
    const response = await apiClient.post(`/reviews/${reviewId}/response`, { comment });
    return response.data;
  },
};

export default reviewService;

