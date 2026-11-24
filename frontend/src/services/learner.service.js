import apiClient from './apiClient';

/**
 * Learner Preference & Onboarding Service
 */
export const learnerService = {
  /**
   * Get current learner's preferences (28-question answers)
   * @param {boolean} [populate=true]
   * @returns {Promise<{ preference: object }>}
   */
  async getMyPreference(populate = true) {
    const response = await apiClient.get('/learners/preferences/me', {
      params: { populate: populate ? 'true' : 'false' },
    });
    return response.data?.preference;
  },

  /**
   * Save draft or update learner preferences
   * @param {object} data - Partial learner preference object
   * @returns {Promise<{ preference: object }>}
   */
  async updateMyPreference(data) {
    const response = await apiClient.patch('/learners/preferences/me', data);
    return response.data?.preference;
  },

  /**
   * Complete learner onboarding
   * @param {object} data - Complete learner preference object
   * @returns {Promise<{ preference: object }>}
   */
  async completeMyPreference(data) {
    const response = await apiClient.post('/learners/preferences/complete', data);
    return response.data?.preference;
  },
};

export default learnerService;
