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
   * Get public profile of a tutor
   * @param {string} tutorId
   * @returns {Promise<object>}
   */
  async getPublicProfile(tutorId) {
    const response = await apiClient.get(`/tutors/${tutorId}`);
    return response.data?.profile;
  },
};

export default tutorService;
