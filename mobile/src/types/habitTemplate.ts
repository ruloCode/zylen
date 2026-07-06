import type { LifeAreaType } from './habit';

/**
 * Habit Template - Predefined habit suggestions
 * These are global templates that users can browse and add to their habits
 */
export interface HabitTemplate {
  id: string;
  name: string;
  nameKey: string;
  description: string | null;
  descriptionKey: string | null;
  iconName: string;
  lifeAreaType: LifeAreaType;
  suggestedXp: number;
  category: string | null;
  popularity: number;
  isFeatured: boolean;
  sortOrder: number;
  createdAt?: Date;
}

/**
 * Filters for querying habit templates
 */
export interface HabitTemplateFilters {
  lifeArea?: LifeAreaType;
  category?: string;
  searchQuery?: string;
  featuredOnly?: boolean;
}

/**
 * Data needed to create a habit from a template
 */
export interface HabitFromTemplateData {
  templateId: string;
  lifeAreaId: string; // User's life area ID (UUID)
  customName?: string; // Optional override for the habit name
  customXp?: number; // Optional override for XP value
}
