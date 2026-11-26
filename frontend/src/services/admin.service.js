import apiClient from './apiClient';

/**
 * Admin Management Service
 */
export const adminService = {
  // Tutor Approval
  async getTutors(params = {}) {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    const response = await apiClient.get('/admin/tutors', { params: cleanParams });
    return response.data;
  },

  async getTutorDetail(tutorId) {
    const response = await apiClient.get(`/admin/tutors/${tutorId}`);
    return response.data?.profile;
  },

  async updateTutorApproval(tutorId, data) {
    const response = await apiClient.patch(`/admin/tutors/${tutorId}/approval`, data);
    return response.data?.profile;
  },

  // Taxonomy Management
  async createTaxonomy(data) {
    const response = await apiClient.post('/admin/taxonomies', data);
    return response.data?.item;
  },

  async updateTaxonomy(id, data) {
    const response = await apiClient.patch(`/admin/taxonomies/${id}`, data);
    return response.data?.item;
  },

  // User Management
  async getUsers(params = {}) {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    const response = await apiClient.get('/admin/users', { params: cleanParams });
    return response.data;
  },

  async getUserDetail(userId) {
    const response = await apiClient.get(`/admin/users/${userId}`);
    return response.data;
  },

  async updateUserStatus(userId, data) {
    const response = await apiClient.patch(`/admin/users/${userId}/status`, data);
    return response.data;
  },

  // Booking Monitoring
  async getBookings(params = {}) {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    const response = await apiClient.get('/admin/bookings', { params: cleanParams });
    return response.data;
  },

  // Review Moderation
  async getReviews(params = {}) {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    const response = await apiClient.get('/admin/reviews', { params: cleanParams });
    return response.data;
  },

  async updateReviewVisibility(reviewId, isPublic) {
    const response = await apiClient.patch(`/admin/reviews/${reviewId}/visibility`, {
      isPublic,
    });
    return response.data;
  },

  // Calendar Sync Logs
  async getCalendarSync(params = {}) {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    const response = await apiClient.get('/admin/calendar-sync', { params: cleanParams });
    return response.data;
  },
};

export default adminService;

