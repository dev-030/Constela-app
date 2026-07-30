import axios from 'axios';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/authStore';

// Assuming API URL from env or constants. Adjust as needed.
let API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'; // Default fallback

// Fix for Android emulator to hit local machine's loopback
if (Platform.OS === 'android' && API_URL.includes('localhost')) {
  API_URL = API_URL.replace('localhost', '10.0.2.2');
}

console.log("INITIALIZED API_URL:", API_URL);
export const apiClient = axios.create({
  baseURL: API_URL,
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

      if (refreshToken) {
        try {
          // Make the refresh request directly using axios (not apiClient to avoid infinite loops)
          const response = await axios.post(`${API_URL}/api/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          if (response.data && response.data.access) {
            const newAccessToken = response.data.access;
            await updateAccessToken(newAccessToken);

            // Retry the original request with the new token
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          // If refresh token fails (e.g. expired), log the user out
          await clearAuth();
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available, clear auth
        await clearAuth();
      }
    }

    return Promise.reject(error);
  }
);
