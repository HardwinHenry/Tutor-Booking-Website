import apiClient from './apiClient';

/**
 * Availability Slot Management Service
 */
export const availabilityService = {
  /**
   * Tutor creates a single slot or batch of slots
   * @param {object} data - { startAt, endAt, timezone, note } or { slots: [...] }
   */
  async createSlot(data) {
    const response = await apiClient.post('/availability', data);
    return response.data;
  },

  /**
   * Tutor gets their own slots
   * @param {object} [params] - { from, to, status, page, limit }
   * @returns {Promise<{ items: Array, pagination: object }>}
   */
  async getMySlots(params = {}) {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    const response = await apiClient.get('/availability/mine', { params: cleanParams });
    return response.data;
  },

  /**
   * Tutor updates slot (time, note, or status: available | closed)
   */
  async updateSlot(slotId, data) {
    const response = await apiClient.patch(`/availability/${slotId}`, data);
    return response.data?.slot;
  },

  /**
   * Tutor deletes an unbooked slot
   */
  async deleteSlot(slotId) {
    const response = await apiClient.delete(`/availability/${slotId}`);
    return response.data;
  },

  /**
   * Public / Learner gets available slots of a tutor (requires tutor's User ID)
   * @param {string} tutorUserId
   * @param {object} [params] - { from, to, duration, page, limit }
   */
  async getTutorAvailability(tutorUserId, params = {}) {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    const response = await apiClient.get(`/tutors/${tutorUserId}/availability`, {
      params: cleanParams,
    });
    return response.data;
  },
};

export default availabilityService;

