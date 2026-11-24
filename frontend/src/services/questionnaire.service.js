import apiClient from './apiClient';

/**
 * Questionnaire Service
 * Retrieves 28-question schema & configuration for learner or tutor
 */
export const questionnaireService = {
  /**
   * Get 28 questions for specific role
   * @param {'learner'|'tutor'} role
   * @param {string} [version]
   * @returns {Promise<{ version: string, role: string, totalQuestions: number, questions: Array }>}
   */
  async getQuestionnaire(role, version) {
    const params = version ? { version } : {};
    const response = await apiClient.get(`/questionnaires/${role}`, { params });
    return response.data;
  },
};

export default questionnaireService;
