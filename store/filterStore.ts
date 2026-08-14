import { create } from 'zustand';
import { PerfectMatchFilters } from '../api/matching';

interface FilterState {
  filters: PerfectMatchFilters;
  setFilters: (newFilters: PerfectMatchFilters) => void;
  clearFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  filters: {},
  setFilters: (newFilters) => set({ filters: newFilters }),
  clearFilters: () => set({ filters: {} }),
}));
