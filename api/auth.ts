import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { useAuthStore } from '../store/authStore';

interface SignUpRequest {
  email: string;
  password?: string;
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

// 1. Sign Up
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

// 4. Logout Hook (optional but handy)
export const useLogout = () => {
  const { clearAuth } = useAuthStore.getState();
  const queryClient = useQueryClient();

  return async () => {
    await clearAuth();
    queryClient.clear(); // Clear all cached queries
  };
};
