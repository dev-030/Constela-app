import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMyProfile, QuotaSnapshot, UserProfile } from '../api/profile';
import { useAuthStore } from './authStore';

let profileGeneration = 0;

interface ProfileState {
  profile: UserProfile | null;
  hasHydrated: boolean;
  isLoading: boolean;
  isRevalidating: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  setProfile: (profile: UserProfile) => void;
  updateQuota: (kind: 'likes' | 'personal_messages' | 'community_messages', quota: QuotaSnapshot, force?: boolean) => void;
  setHasHydrated: (hydrated: boolean) => void;
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

function preserveNewerQuotaUsage(incoming: UserProfile, _current: UserProfile | null) {
  return incoming;
}


export const useProfileStore = create<ProfileState>()(persist((set, get) => ({
  profile: null,
  hasHydrated: false,
  isLoading: false,
  isRevalidating: false,
  error: null,

  fetchProfile: async () => {
    const generation = profileGeneration;
    const currentProfile = get().profile;

    if (!currentProfile) {
      set({ isLoading: true, error: null });
    } else {
      set({ isRevalidating: true, error: null });
    }

    try {
      const data = preserveNewerQuotaUsage(await getMyProfile(), get().profile);
      if (generation !== profileGeneration || !useAuthStore.getState().isAuthenticated) return;

      const currentNorm = JSON.stringify(normalizeForCompare(currentProfile));
      const newNorm = JSON.stringify(normalizeForCompare(data));

      if (currentNorm !== newNorm || !currentProfile) {
        set({ profile: data, isLoading: false, isRevalidating: false });
      } else {
        // Data hasn't functionally changed — keep existing state untouched!
        set({ isLoading: false, isRevalidating: false, error: null });
      }
    } catch (error: any) {
      if (generation !== profileGeneration) return;
      set({
        isLoading: false,
        isRevalidating: false,
        error: error?.response?.data?.message || 'Failed to fetch profile',
      });
      console.error('Error fetching profile:', error);
    }
  },

  setProfile: (profile: UserProfile) => {
    profileGeneration += 1;
    set({ profile, isLoading: false, isRevalidating: false, error: null });
  },

  updateQuota: (kind, quota, force = false) => {
    set((state) => {
      if (!state.profile?.access) return state;
      const currentQuota = state.profile.access.quotas?.[kind];

      // If updating for the same reset day, ignore older in-flight responses that have lower used count
      if (
        !force &&
        currentQuota &&
        currentQuota.resets_at === quota.resets_at &&
        currentQuota.used > quota.used
      ) {
        return state;
      }

      return {
        isRevalidating: false,
        profile: {
          ...state.profile,
          access: {
            ...state.profile.access,
            quotas: { ...state.profile.access.quotas, [kind]: quota },
          },
        },
      };
    });
  },

  setHasHydrated: (hasHydrated) => set({ hasHydrated }),

  clearProfile: () => {
    profileGeneration += 1;
    set({ profile: null, error: null, isLoading: false, isRevalidating: false });
  },
}), {
  name: 'constela-profile',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (state) => ({ profile: state.profile }),
  onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
}));
