import { apiClient } from './client';
import { useQuery } from '@tanstack/react-query';

export type SubscriptionTier = 'freemium' | 'light' | 'plus';

export interface QuotaSnapshot {
  limit: number | null;
  used: number;
  remaining: number | null;
  resets_at: string;
}

export interface AccessSnapshot {
  tier: SubscriptionTier;
  can_access_community: boolean;
  community_room_limit: number | null;
  can_see_likes: boolean;
  can_undo_swipes: boolean;
  has_match_analysis: boolean;
  quotas: {
    likes: QuotaSnapshot;
    personal_messages: QuotaSnapshot;
    community_messages: QuotaSnapshot;
  };
  tier_rules: Record<SubscriptionTier, {
    name: string;
    daily_likes_limit: number | null;
    daily_personal_messages_limit: number | null;
    daily_community_messages_limit: number | null;
    community_room_limit: number | null;
    can_see_likes: boolean;
    can_undo_swipes: boolean;
  }>;
}

export interface UserProfile {
  id: string;
  user: {
    id: string;
    email: string;
    role: string;
    first_name?: string;
  };
  username: string;
  name: string;
  age: number;
  bio?: string;
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
  subscription_tier: SubscriptionTier;
  subscription_product_id: string | null;
  subscription_expires: string | null;
  has_match_analysis: boolean;
  access?: AccessSnapshot;
  connection_status?: 'none' | 'match' | 'friend' | 'self';
  is_verified: boolean;
  is_deactivated: boolean;
  profile_completion_pct: number;
  likes_push: boolean;
  messages_push: boolean;
  face_verification_status: string;
  must_verify_face: boolean;
  onboarding_part1_completed: boolean;
  photos: {
    id: string;
    image: string;
    is_main: boolean;
    is_verified: boolean;
    uploaded_at: string;
  }[];
}

export function canAccessCommunity(profile: UserProfile | null | undefined): boolean {
  return profile?.access?.can_access_community ??
    (profile?.subscription_tier === 'light' || profile?.subscription_tier === 'plus');
}

export function canSeeLikes(profile: UserProfile | null | undefined): boolean {
  return profile?.access?.can_see_likes ??
    (profile?.subscription_tier === 'light' || profile?.subscription_tier === 'plus');
}

export function canAccessMatchAnalysis(profile: UserProfile | null | undefined): boolean {
  return Boolean(profile?.access?.has_match_analysis ?? profile?.has_match_analysis);
}

export function canUndoSwipes(profile: UserProfile | null | undefined): boolean {
  return profile?.access?.can_undo_swipes ??
    (profile?.subscription_tier === 'light' || profile?.subscription_tier === 'plus');
}

export function getMainPhoto(photos?: { id: string; image: string; is_main: boolean; [key: string]: any }[] | null): string | null {
  if (!photos || photos.length === 0) return null;
  const main = photos.find((p) => p.is_main);
  return main?.image || photos[0]?.image || null;
}

export const getMyProfile = async (): Promise<UserProfile> => {
  const response = await apiClient.get('/api/profile/me/');
  const data = response.data;
  if (data?.photos && Array.isArray(data.photos)) {
    data.photos.sort((a: any, b: any) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0));
  }
  return data;
};

export const updateMyProfile = async (
  data: FormData | Record<string, any>
): Promise<UserProfile> => {
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  const config = isFormData
    ? {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    : undefined;

  const response = await apiClient.put<UserProfile>('/api/profile/me/', data, config);
  return response.data;
};

export const fetchProfileDetails = async (uuid: string): Promise<UserProfile> => {
  const response = await apiClient.get<UserProfile>(`/api/profiles/${uuid}/`);
  return response.data;
};

export const useGetProfileDetailsQuery = (uuid: string) => {
  return useQuery({
    queryKey: ['profileDetails', uuid],
    queryFn: () => fetchProfileDetails(uuid),
    enabled: !!uuid,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const uploadPhoto = async (uri: string): Promise<any> => {
  const formData = new FormData();
  const filename = uri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';
  formData.append('image', {
    uri,
    name: filename,
    type,
  } as any);

  const response = await apiClient.post('/api/photos/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deletePhoto = async (photoId: string): Promise<void> => {
  await apiClient.delete(`/api/photos/${photoId}/`);
};

export const setMainPhoto = async (photoId: string): Promise<void> => {
  await apiClient.post(`/api/photos/${photoId}/set-main/`);
};
