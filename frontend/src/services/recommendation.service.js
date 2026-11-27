import apiClient from './apiClient';

/**
 * Recommendation Service (Content-based Filtering)
 */
export const recommendationService = {
  /**
   * Request personalized tutor recommendations for authenticated learner.
   * Backend derives learnerId from JWT.
   * @param {object} [filters] - { categoryId, subjectId, mode, minScore, strictBudget, page, limit }
   * @returns {Promise<{ algorithmVersion: string, pagination: object, items: Array }>}
   */
  async getTutorRecommendations(filters = {}) {
    const payload = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    const response = await apiClient.post('/recommendations/tutors', payload);
    return response.data;
  },
};

export default recommendationService;

