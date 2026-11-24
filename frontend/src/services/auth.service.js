import apiClient from './apiClient';

/**
 * Authentication Service
 */
export const authService = {
  /**
   * Log in user
   * @param {object} credentials - { email, password }
   */
  async login(credentials) {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data; // { user, accessToken, refreshToken }
  },

  /**
   * Register new account
   * @param {object} data - { name, email, password, role, phone }
   */
  async register(data) {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  /**
   * Logout user and revoke refresh token
   */
  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network/server errors during logout
    }
  },

  /**
   * Refresh access token
   * @param {string} refreshToken
   */
  async refreshToken(refreshToken) {
    const response = await apiClient.post('/auth/refresh-token', { refreshToken });
    return response.data;
  },

  /**
   * Get current authenticated user profile
   */
  async getMe() {
    const response = await apiClient.get('/auth/me');
    return response.data?.user;
  },
};

export default authService;
