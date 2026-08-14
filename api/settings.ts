import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

export type SubscriptionTier = 'freemium' | 'light' | 'plus';

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface UpgradeSubscriptionRequest {
  tier: SubscriptionTier;
  amount?: number;
  stripe_charge_id?: string;
}

export interface SubscriptionTransaction {
  id: string;
  user: string;
  plan_name: string;
  amount: string;
  status: string;
  stripe_charge_id: string;
  created_at: string;
}

export interface UpgradeSubscriptionResponse {
  message: string;
  subscription_tier: SubscriptionTier;
  subscription_expires: string | null;
  transaction: SubscriptionTransaction;
}

export const useChangePasswordMutation = () => {
  return useMutation({
    mutationFn: async (data: ChangePasswordRequest) => {
      const response = await apiClient.post(
        '/api/settings/change-password/',
        data
      );
      return response.data;
    },
  });
};

export const useUpgradeSubscriptionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpgradeSubscriptionRequest) => {
      const response = await apiClient.post<UpgradeSubscriptionResponse>(
        '/api/subscription/upgrade/',
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
    },
  });
};

export const useTransactionHistoryQuery = () => {
  return useQuery({
    queryKey: ['transactionHistory'],
    queryFn: async () => {
      const response = await apiClient.get<SubscriptionTransaction[]>(
        '/api/subscription/history/'
      );
      return response.data;
    },
  });
};

export const useReportUserMutation = () => {
  return useMutation({
    mutationFn: async (data: { reported_user: string; reason: string; description?: string }) => {
      const response = await apiClient.post('/api/reports/create/', data);
      return response.data;
    },
  });
};

export const useSubmitSupportTicketMutation = () => {
  return useMutation({
    mutationFn: async (data: { subject: string; description: string; email?: string }) => {
      const response = await apiClient.post('/api/support/create/', data);
      return response.data;
    },
  });
};

export const useMySupportTicketsQuery = () => {
  return useQuery({
    queryKey: ['mySupportTickets'],
    queryFn: async () => {
      const response = await apiClient.get<any[]>('/api/support/my-tickets/');
      return response.data;
    },
  });
};