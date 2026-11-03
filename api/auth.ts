import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { useAuthStore } from '../store/authStore';
import { useProfileStore } from '../store/profileStore';
import type { UserProfile } from './profile';

interface SignUpRequest {
  email: string;
  password?: string;
  first_name: string;
}

interface VerifyOtpRequest {
  email: string;
  otp: string;
}

interface LoginRequest {
  email: string;
  password?: string;
}

interface ForgotPasswordRequest {
  email: string;
}

interface ResetPasswordRequest {
  email: string;
  code: string;
  new_password?: string;
}

interface LoginResponse {
  access: string;
  refresh: string;
  role?: string;
  user?: any;
  profile?: UserProfile;
}

interface VerifyOtpResponse {
  message?: string;
  access: string;
  refresh: string;
  role?: string;
  user?: any;
  profile?: UserProfile;
}

interface GoogleAuthResponse {
  access: string;
  refresh: string;
  role?: string;
  is_new_user?: boolean;
  user?: any;
  profile?: UserProfile;
}

interface GoogleAuthRequest {
  id_token?: string;
  access_token?: string;
  is_login?: boolean;
}

export const useGoogleAuthMutation = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (data: GoogleAuthRequest) => {
      const response = await apiClient.post<GoogleAuthResponse>('/api/auth/google/', data);
      const { access, refresh, role, profile } = response.data;
      if (access && refresh) {
        await setAuth(access, refresh, role);
      }
      if (profile) {
        useProfileStore.getState().setProfile(profile);
      }
      return response.data;
    },
  });
};
export const useSignUpMutation = () => {
  return useMutation({
    mutationFn: async (data: SignUpRequest) => {
      const response = await apiClient.post('/api/auth/signup/', data);
      return response.data;
    },
  });
};

// 2. Verify OTP
export const useVerifyOtpMutation = () => {
  const { setAuth } = useAuthStore.getState();

  return useMutation({
    mutationFn: async (data: VerifyOtpRequest) => {
      const response = await apiClient.post<VerifyOtpResponse>('/api/auth/verify-otp/', data);
      const { access, refresh, role, profile } = response.data;
      if (access && refresh) {
        await setAuth(access, refresh, role);
      }
      if (profile) {
        useProfileStore.getState().setProfile(profile);
      }
      return response.data;
    },
  });
};

export const useResendOtpMutation = () => {
  return useMutation({
    mutationFn: async (data: { email: string }) => {
      const response = await apiClient.post('/api/auth/resend-otp/', data);
      return response.data;
    },
  });
};

// 3. Login
export const useLoginMutation = () => {
  const { setAuth } = useAuthStore.getState();

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const response = await apiClient.post<LoginResponse>('/api/auth/login/', data);
      const { access, refresh, role, profile } = response.data;
      if (access && refresh) {
        await setAuth(access, refresh, role);
      }
      if (profile) {
        useProfileStore.getState().setProfile(profile);
      }
      return response.data;
    },
  });
};

export const useForgotPasswordMutation = () => {
  return useMutation({
    mutationFn: async (data: ForgotPasswordRequest) => {
      const response = await apiClient.post('/api/auth/forgot-password/', data);
      return response.data;
    },
  });
};

export const useVerifyPasswordResetCodeMutation = () => {
  return useMutation({
    mutationFn: async (data: { email: string; code: string }) => {
      const response = await apiClient.post('/api/auth/verify-reset-code/', data);
      return response.data;
    },
  });
};

export const useResetPasswordMutation = () => {
  return useMutation({
    mutationFn: async (data: ResetPasswordRequest) => {
      const response = await apiClient.post('/api/auth/reset-password/', data);
      return response.data;
    },
  });
};

export const useCheckUsernameQuery = (username: string) => {
  return useQuery({
    queryKey: ['checkUsername', username],
    queryFn: async () => {
      const response = await apiClient.get(`/api/auth/check-username/?username=${username}`);
      return response.data as { available: boolean; message: string };
    },
    enabled: !!username && username.length >= 3,
    retry: false,
  });
};

export const useFaceVerifyMutation = () => {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiClient.post('/api/auth/face-verify/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
  });
};

export const useFaceDetectMutation = () => {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiClient.post('/api/auth/face-detect/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data as { face_detected: boolean; error?: string; faces_count?: number };
    },
  });
};

export const useDeleteAccountMutation = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/api/settings/delete-account/');
      return response.data;
    },
  });
};

// 4. Logout Hook (optional but handy)
export const useLogout = () => {
  const { clearAuth } = useAuthStore.getState();
  const { clearProfile } = useProfileStore.getState();
  const queryClient = useQueryClient();

  return async () => {
    // Needs the auth token, so it has to run before clearAuth.
    await import('../utils/pushNotifications')
      .then((m) => m.unregisterPushTokenAsync())
      .catch(console.warn);
    await clearAuth();
    clearProfile();
    queryClient.clear(); // Clear all cached queries
  };
};
