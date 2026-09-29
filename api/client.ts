import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useProfileStore } from '../store/profileStore';
import { API_URL } from '@/constants/config';

console.log("INITIALIZED API_URL:", API_URL);
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds timeout to allow slow endpoints like OTP verify
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the Bearer token
apiClient.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
     console.log('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 Unauthorized errors and refresh token
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error?.response?.status !== 403 && error?.response?.status !== 401) {
      console.error('API Error Response:', error?.message, error?.response?.data, 'URL:', error?.config?.url, 'BaseURL:', error?.config?.baseURL);
    }
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const { refreshToken, updateAccessToken, clearAuth } = useAuthStore.getState();
      const { clearProfile } = useProfileStore.getState();

      if (refreshToken) {
        try {
          // Make the refresh request directly using axios (not apiClient to avoid infinite loops)
          const response = await axios.post(`${API_URL}/api/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          if (useAuthStore.getState().refreshToken !== refreshToken) {
            throw new axios.CanceledError('Account changed during token refresh');
          }

          if (response.data && response.data.access) {
            const newAccessToken = response.data.access;
            await updateAccessToken(newAccessToken);

            // Retry the original request with the new token
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          if (useAuthStore.getState().refreshToken !== refreshToken) {
            return Promise.reject(refreshError);
          }
          // If refresh token fails (e.g. expired), log the user out
          await clearAuth();
          clearProfile();
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available, clear auth
        await clearAuth();
        clearProfile();
      }
    }

    return Promise.reject(error);
  }
);
