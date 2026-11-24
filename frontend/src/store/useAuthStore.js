import { create } from 'zustand';
import { STORAGE_KEYS, ROLES } from '../constants';
import { storage } from '../utils/storage';
import authService from '../services/auth.service';
import learnerService from '../services/learner.service';

/**
 * Global Authentication Store with Zustand
 */
export const useAuthStore = create((set, get) => {
  // Listen for 401 session expired event
  if (typeof window !== 'undefined') {
    window.addEventListener('auth:expired', () => {
      storage.remove(STORAGE_KEYS.SURVEY_STATUS);
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        surveyStatus: null,
      });
    });
  }

  const initialUser = storage.get(STORAGE_KEYS.USER, null);
  const initialAccessToken = storage.get(STORAGE_KEYS.ACCESS_TOKEN, null);
  const initialRefreshToken = storage.get(STORAGE_KEYS.REFRESH_TOKEN, null);
  const initialSurveyStatus = storage.get(STORAGE_KEYS.SURVEY_STATUS, null);

  return {
    user: initialUser,
    accessToken: initialAccessToken,
    refreshToken: initialRefreshToken,
    surveyStatus: initialSurveyStatus,
    isSurveyChecking: false,
    isAuthenticated: !!initialAccessToken && !!initialUser,
    isLoading: false,
    error: null,

    // Role helper getters
    getRole: () => get().user?.role,
    isLearner: () => get().user?.role === ROLES.LEARNER,
    isTutor: () => get().user?.role === ROLES.TUTOR,
    isAdmin: () => get().user?.role === ROLES.ADMIN,
    isSurveyCompleted: () => get().surveyStatus === 'completed',

    /**
     * Set authenticated session
     */
    setSession: ({ user, accessToken, refreshToken }) => {
      storage.set(STORAGE_KEYS.USER, user);
      if (accessToken) storage.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      if (refreshToken) storage.set(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);

      set({
        user,
        accessToken: accessToken || get().accessToken,
        refreshToken: refreshToken || get().refreshToken,
        isAuthenticated: true,
        error: null,
      });
    },

    /**
     * Set survey status in state and localStorage
     */
    setSurveyStatus: (status) => {
      if (status) {
        storage.set(STORAGE_KEYS.SURVEY_STATUS, status);
      } else {
        storage.remove(STORAGE_KEYS.SURVEY_STATUS);
      }
      set({ surveyStatus: status });
    },

    /**
     * Check survey status from backend for current user
     */
    checkSurveyStatus: async () => {
      const currentUser = get().user;
      if (!currentUser) return null;

      if (currentUser.role === ROLES.LEARNER) {
        set({ isSurveyChecking: true });
        try {
          const pref = await learnerService.getMyPreference(false);
          const status = pref?.completionStatus || 'not_started';
          get().setSurveyStatus(status);
          set({ isSurveyChecking: false });
          return status;
        } catch (err) {
          console.warn('Không thể kiểm tra trạng thái khảo sát từ backend:', err);
          const current = get().surveyStatus || 'not_started';
          set({ isSurveyChecking: false });
          return current;
        }
      }

      // Non-learner (Tutor, Admin) does not require learner survey
      get().setSurveyStatus('completed');
      return 'completed';
    },

    /**
     * Update user details in store and localStorage
     */
    updateUser: (partialUser) => {
      const currentUser = get().user;
      if (!currentUser) return;
      const updatedUser = { ...currentUser, ...partialUser };
      storage.set(STORAGE_KEYS.USER, updatedUser);
      set({ user: updatedUser });
    },

    /**
     * Log in
     */
    login: async (credentials) => {
      set({ isLoading: true, error: null });
      try {
        const data = await authService.login(credentials);
        get().setSession(data);

        // Check survey status for learner
        if (data.user?.role === ROLES.LEARNER) {
          try {
            const pref = await learnerService.getMyPreference(false);
            const status = pref?.completionStatus || 'not_started';
            get().setSurveyStatus(status);
          } catch {
            get().setSurveyStatus('not_started');
          }
        } else {
          get().setSurveyStatus('completed');
        }

        set({ isLoading: false });
        return data;
      } catch (err) {
        set({
          isLoading: false,
          error: err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.',
        });
        throw err;
      }
    },

    /**
     * Register
     */
    register: async (userData) => {
      set({ isLoading: true, error: null });
      try {
        const data = await authService.register(userData);
        if (data.accessToken) {
          get().setSession(data);
          if (data.user?.role === ROLES.LEARNER) {
            get().setSurveyStatus('not_started');
          } else {
            get().setSurveyStatus('completed');
          }
        }
        set({ isLoading: false });
        return data;
      } catch (err) {
        set({
          isLoading: false,
          error: err.message || 'Đăng ký tài khoản thất bại.',
        });
        throw err;
      }
    },

    /**
     * Log out
     */
    logout: async () => {
      try {
        await authService.logout();
      } finally {
        storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
        storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
        storage.remove(STORAGE_KEYS.USER);
        storage.remove(STORAGE_KEYS.SURVEY_STATUS);
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          surveyStatus: null,
          error: null,
        });
      }
    },

    /**
     * Re-fetch profile from /auth/me
     */
    checkAuth: async () => {
      const token = storage.get(STORAGE_KEYS.ACCESS_TOKEN);
      if (!token) {
        set({ isAuthenticated: false, user: null, surveyStatus: null });
        return null;
      }

      try {
        const user = await authService.getMe();
        storage.set(STORAGE_KEYS.USER, user);
        set({ user, isAuthenticated: true });

        // If learner, also refresh survey status
        if (user.role === ROLES.LEARNER) {
          await get().checkSurveyStatus();
        }

        return user;
      } catch {
        get().logout();
        return null;
      }
    },
  };
});
