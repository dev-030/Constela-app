import { apiClient } from './client';
import { useQuery } from '@tanstack/react-query';

export interface UserProfile {
  id: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
  username: string;
  age: number;
  height_cm: number;
  weight_kg: number;
  gender: string;
  marital_status: string;
  education_level: string;
  spoken_languages: string[];
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  looking_for: string;
  has_children: boolean;
  wants_children: boolean;
  smoking: boolean;
  alcohol: boolean;
  pets: boolean;
  sport: string;
  eating_habits: string;
  second_degree_humor: boolean;
  neurotype_labels: string[];
  qualities: string[];
  interests: string[];
  recharge_methods: string[];
  exhaust_triggers: string[];
  emotional_needs: string[];
  soothe_methods: string[];
  subscription_tier: string;
  subscription_product_id: string | null;
  subscription_expires: string | null;
  has_match_analysis: boolean;
  has_advanced_filters: boolean;
  has_all_chat_rooms: boolean;
  is_verified: boolean;
  is_deactivated: boolean;
  profile_completion_pct: number;
  face_verification_status: string;
  onboarding_part1_completed: boolean;
  photos: {
    id: string;
    image: string;
    is_main: boolean;
    is_verified: boolean;
    uploaded_at: string;
  }[];
}

export const getMyProfile = async (): Promise<UserProfile> => {
  const response = await apiClient.get('/api/profile/me/');
  return response.data;
};

export const updateMyProfile = async (formData: FormData): Promise<UserProfile> => {
  const response = await apiClient.put('/api/profile/me/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const useGetProfileDetailsQuery = (uuid: string) => {
  return useQuery({
    queryKey: ['profileDetails', uuid],
    queryFn: async () => {
      const response = await apiClient.get<UserProfile>(`/api/profiles/${uuid}/`);
      return response.data;
    },
    enabled: !!uuid,
  });
};
