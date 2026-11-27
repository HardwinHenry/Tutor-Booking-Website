import apiClient from './apiClient';

/**
 * Taxonomy Service
 * Manages taxonomy categories, subjects, topics, and auxiliary tags
 */
export const taxonomyService = {
  /**
   * List taxonomies with optional filters
   * @param {object} [params] - { type, parentId, active, search }
   * @returns {Promise<Array>}
   */
  async getTaxonomies(params = {}) {
    const response = await apiClient.get('/taxonomies', { params });
    return response.data?.items || response.data?.taxonomies || [];
  },

  /**
   * Get direct children of a taxonomy (e.g. Category -> Subjects, Subject -> Topics)
   * @param {string} id - Parent taxonomy ID
   * @returns {Promise<Array>}
   */
  async getChildren(id) {
    if (!id) return [];
    const response = await apiClient.get(`/taxonomies/${id}/children`);
    return response.data?.children || [];
  },

  /**
   * Get a specific taxonomy detail by ID
   * @param {string} id
   * @returns {Promise<object>}
   */
  async getTaxonomyById(id) {
    const response = await apiClient.get(`/taxonomies/${id}`);
    return response.data?.item || response.data?.taxonomy;
  },

  /**
   * Convenience method to fetch tags
   * @param {object} [params]
   * @returns {Promise<Array>}
   */
  async getTags(params = {}) {
    const response = await apiClient.get('/tags', { params });
    return response.data?.items || response.data?.tags || [];
  },
};

export default taxonomyService;
