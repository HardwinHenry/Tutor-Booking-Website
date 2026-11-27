import apiClient from './apiClient';

/**
 * Tutor Profile & Onboarding Service
 */
export const tutorService = {
  /**
   * Get current authenticated tutor's profile
   * @param {boolean} [populate=true]
   * @returns {Promise<{ profile: object }>}
   */
  async getMyProfile(populate = true) {
    const response = await apiClient.get('/tutors/profile/me', {
      params: { populate: populate ? 'true' : 'false' },
    });
    return response.data?.profile;
  },

  /**
   * Save draft or update tutor profile
   * @param {object} data - Partial tutor profile object
   * @returns {Promise<{ profile: object }>}
   */
  async updateMyProfile(data) {
    const response = await apiClient.patch('/tutors/profile/me', data);
    return response.data?.profile;
  },

  /**
   * Submit tutor profile for administrator approval
   * @param {object} data - Complete tutor profile object
   * @returns {Promise<{ profile: object }>}
   */
  async submitMyProfile(data) {
    const response = await apiClient.post('/tutors/profile/submit', data);
    return response.data?.profile;
  },

  /**
   * Public search for approved tutors
   * @param {object} [params]
   * @returns {Promise<{ items: Array, pagination: object }>}
   */
  async searchTutors(params = {}) {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    const response = await apiClient.get('/tutors', { params: cleanParams });
    return response.data;
  },

  /**
   * Get public profile of a tutor
   * @param {string} tutorId - TutorProfile ID or User ID
   * @returns {Promise<object>}
   */
  async getPublicProfile(tutorId) {
    const response = await apiClient.get(`/tutors/${tutorId}`);
    return response.data?.profile;
  },
};

export default tutorService;
