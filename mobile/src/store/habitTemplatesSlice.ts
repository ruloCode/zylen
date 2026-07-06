import { StateCreator } from 'zustand';
import type { HabitTemplate, HabitTemplateFilters, LifeAreaType } from '@/types';
import { HabitTemplatesService } from '@/services/supabase/habitTemplates.service';

export interface HabitTemplatesSlice {
  // State
  templates: HabitTemplate[];
  filteredTemplates: HabitTemplate[];
  templatesLoading: boolean;
  templatesError: string | null;
  selectedLifeArea: LifeAreaType | null;
  searchQuery: string;

  // Actions
  loadTemplates: () => Promise<void>;
  filterByLifeArea: (lifeArea: LifeAreaType | null) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;
  getTemplateById: (id: string) => HabitTemplate | undefined;
  incrementTemplatePopularity: (templateId: string) => Promise<void>;
}

/**
 * Apply filters to templates in memory
 */
function applyFilters(
  templates: HabitTemplate[],
  lifeArea: LifeAreaType | null,
  searchQuery: string
): HabitTemplate[] {
  let filtered = [...templates];

  // Filter by life area
  if (lifeArea) {
    filtered = filtered.filter((t) => t.lifeAreaType === lifeArea);
  }

  // Filter by search query
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query)) ||
        (t.category && t.category.toLowerCase().includes(query))
    );
  }

  return filtered;
}

export const createHabitTemplatesSlice: StateCreator<HabitTemplatesSlice> = (set, get) => ({
  // Initial state
  templates: [],
  filteredTemplates: [],
  templatesLoading: false,
  templatesError: null,
  selectedLifeArea: null,
  searchQuery: '',

  // Actions
  loadTemplates: async () => {
    try {
      set({ templatesLoading: true, templatesError: null });

      const templates = await HabitTemplatesService.getTemplates();

      set({
        templates,
        filteredTemplates: templates,
        templatesLoading: false,
      });
    } catch (error) {
      console.error('Error loading templates:', error);
      set({
        templatesError: error instanceof Error ? error.message : 'Failed to load templates',
        templatesLoading: false,
      });
    }
  },

  filterByLifeArea: (lifeArea: LifeAreaType | null) => {
    const { templates, searchQuery } = get();
    set({
      selectedLifeArea: lifeArea,
      filteredTemplates: applyFilters(templates, lifeArea, searchQuery),
    });
  },

  setSearchQuery: (query: string) => {
    const { templates, selectedLifeArea } = get();
    set({
      searchQuery: query,
      filteredTemplates: applyFilters(templates, selectedLifeArea, query),
    });
  },

  clearFilters: () => {
    const { templates } = get();
    set({
      selectedLifeArea: null,
      searchQuery: '',
      filteredTemplates: templates,
    });
  },

  getTemplateById: (id: string) => {
    const { templates } = get();
    return templates.find((t) => t.id === id);
  },

  incrementTemplatePopularity: async (templateId: string) => {
    try {
      await HabitTemplatesService.incrementPopularity(templateId);

      // Update local state optimistically
      set((state) => ({
        templates: state.templates.map((t) =>
          t.id === templateId ? { ...t, popularity: t.popularity + 1 } : t
        ),
        filteredTemplates: state.filteredTemplates.map((t) =>
          t.id === templateId ? { ...t, popularity: t.popularity + 1 } : t
        ),
      }));
    } catch (error) {
      // Non-critical, just log
      console.warn('Failed to increment template popularity:', error);
    }
  },
});
