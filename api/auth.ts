import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { useAuthStore } from '../store/authStore';

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
}

interface VerifyOtpResponse {
  message: string;
  access: string;
  refresh: string;
  role: string;
}

interface GoogleAuthRequest {
  id_token?: string;
  access_token?: string;
}

export const useGoogleAuthMutation = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (data: GoogleAuthRequest) => {
      const response = await apiClient.post('/api/auth/google/', data);
      const { access, refresh } = response.data;
      if (access && refresh) {
        await setAuth(access, refresh);
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
      return response.data;
    },
    onSuccess: async (data) => {
      if (data.access && data.refresh) {
        await setAuth(data.access, data.refresh, data.role);
      }
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
      return response.data;
    },
    onSuccess: async (data) => {
      if (data.access && data.refresh) {
        await setAuth(data.access, data.refresh);
      }
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

import { useProfileStore } from '../store/profileStore';

// 4. Logout Hook (optional but handy)
export const useLogout = () => {
  const { clearAuth } = useAuthStore.getState();
  const { clearProfile } = useProfileStore.getState();
  const queryClient = useQueryClient();

  return async () => {
    await clearAuth();
    clearProfile();
    queryClient.clear(); // Clear all cached queries
  };
};
