import { create } from 'zustand';
import { getMyProfile, UserProfile } from '../api/profile';

interface ProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  isRevalidating: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  clearProfile: () => void;
}

function normalizeForCompare(prof: UserProfile | null) {
  if (!prof) return null;
  return {
    ...prof,
    photos: prof.photos?.map((p) => ({
      id: p.id,
      is_main: p.is_main,
      // Strip dynamic query params (like presigned URL timestamps/tokens) for comparison
      baseUrl: p.image?.split('?')[0] || p.image,
    })),
  };
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoading: false,
  isRevalidating: false,
  error: null,

  fetchProfile: async () => {
    const currentProfile = get().profile;

    if (!currentProfile) {
      set({ isLoading: true, error: null });
    } else {
      set({ isRevalidating: true });
    }

    try {
      const data = await getMyProfile();

      const currentNorm = JSON.stringify(normalizeForCompare(currentProfile));
      const newNorm = JSON.stringify(normalizeForCompare(data));

      if (currentNorm !== newNorm || !currentProfile) {
        set({ profile: data, isLoading: false, isRevalidating: false });
      } else {
        // Data hasn't functionally changed — keep existing state untouched!
        set({ isLoading: false, isRevalidating: false });
      }
    } catch (error: any) {
      set({
        isLoading: false,
        isRevalidating: false,
        error: error?.response?.data?.message || 'Failed to fetch profile',
      });
      console.error('Error fetching profile:', error);
    }
  },

  clearProfile: () => {
    set({ profile: null, error: null, isLoading: false, isRevalidating: false });
  },
}));
