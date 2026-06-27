import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  role: string | null;
  isAuthenticated: boolean;
  setAuth: (access: string, refresh: string, role?: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  restoreAuth: () => Promise<void>;
  updateAccessToken: (access: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  role: null,
  isAuthenticated: false,

  setAuth: async (access, refresh, role) => {
    try {
      await SecureStore.setItemAsync('access_token', access);
      await SecureStore.setItemAsync('refresh_token', refresh);
      if (role) {
        await SecureStore.setItemAsync('user_role', role);
      }
      set({ accessToken: access, refreshToken: refresh, role, isAuthenticated: true });
    } catch (error) {
      console.error('Failed to save auth tokens', error);
    }
  },

  clearAuth: async () => {
    try {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      await SecureStore.deleteItemAsync('user_role');
      set({ accessToken: null, refreshToken: null, role: null, isAuthenticated: false });
    } catch (error) {
      console.error('Failed to clear auth tokens', error);
    }
  },

  restoreAuth: async () => {
    try {
      const access = await SecureStore.getItemAsync('access_token');
      const refresh = await SecureStore.getItemAsync('refresh_token');
      const role = await SecureStore.getItemAsync('user_role');
      
      if (access && refresh) {
        set({ accessToken: access, refreshToken: refresh, role, isAuthenticated: true });
      }
    } catch (error) {
      console.error('Failed to restore auth tokens', error);
    }
  },
  
  updateAccessToken: async (access) => {
    try {
      await SecureStore.setItemAsync('access_token', access);
      set({ accessToken: access });
    } catch (error) {
      console.error('Failed to update access token', error);
    }
  }
}));
