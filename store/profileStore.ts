import { create } from 'zustand';
import { getMyProfile, UserProfile } from '../api/profile';

interface ProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  isLoading: false,
  error: null,
  
  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await getMyProfile();
      set({ profile: data, isLoading: false });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error?.response?.data?.message || 'Failed to fetch profile'
      });
      console.error('Error fetching profile:', error);
    }
  },
  
  clearProfile: () => {
    set({ profile: null, error: null, isLoading: false });
  }
}));
