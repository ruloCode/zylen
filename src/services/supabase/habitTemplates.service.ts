/**
 * Habit Templates Service - Supabase Implementation
 *
 * Provides access to predefined habit templates that users can browse and add to their habits.
 * Templates are global resources (not user-specific).
 */

import { supabase } from '@/lib/supabase';
import type { HabitTemplate, HabitTemplateFilters, LifeAreaType } from '@/types';

/**
 * Map database row to HabitTemplate type
 */
function mapTemplateRowToTemplate(row: any): HabitTemplate {
  return {
    id: row.id,
    name: row.name,
    nameKey: row.name_key,
    description: row.description,
    descriptionKey: row.description_key,
    iconName: row.icon_name,
    lifeAreaType: row.life_area_type as LifeAreaType,
    suggestedXp: row.suggested_xp,
    category: row.category,
    popularity: row.popularity,
    isFeatured: row.is_featured,
    sortOrder: row.sort_order,
    createdAt: row.created_at ? new Date(row.created_at) : undefined,
  };
}

export class HabitTemplatesService {
  /**
   * Get all habit templates
   */
  static async getTemplates(): Promise<HabitTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('habit_templates')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching templates:', error);
        throw new Error('Failed to fetch habit templates');
      }

      return data.map(mapTemplateRowToTemplate);
    } catch (error) {
      console.error('Error in HabitTemplatesService.getTemplates:', error);
      throw error;
    }
  }

  /**
   * Get templates filtered by life area
   */
  static async getTemplatesByLifeArea(lifeAreaType: LifeAreaType): Promise<HabitTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('habit_templates')
        .select('*')
        .eq('life_area_type', lifeAreaType)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching templates by life area:', error);
        throw new Error('Failed to fetch habit templates');
      }

      return data.map(mapTemplateRowToTemplate);
    } catch (error) {
      console.error('Error in HabitTemplatesService.getTemplatesByLifeArea:', error);
      throw error;
    }
  }

  /**
   * Get featured templates only
   */
  static async getFeaturedTemplates(): Promise<HabitTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('habit_templates')
        .select('*')
        .eq('is_featured', true)
        .order('life_area_type', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching featured templates:', error);
        throw new Error('Failed to fetch featured templates');
      }

      return data.map(mapTemplateRowToTemplate);
    } catch (error) {
      console.error('Error in HabitTemplatesService.getFeaturedTemplates:', error);
      throw error;
    }
  }

  /**
   * Search templates by name or description
   */
  static async searchTemplates(query: string): Promise<HabitTemplate[]> {
    try {
      const searchQuery = `%${query.toLowerCase()}%`;

      const { data, error } = await supabase
        .from('habit_templates')
        .select('*')
        .or(`name.ilike.${searchQuery},description.ilike.${searchQuery}`)
        .order('popularity', { ascending: false })
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error searching templates:', error);
        throw new Error('Failed to search habit templates');
      }

      return data.map(mapTemplateRowToTemplate);
    } catch (error) {
      console.error('Error in HabitTemplatesService.searchTemplates:', error);
      throw error;
    }
  }

  /**
   * Get templates with filters
   */
  static async getFilteredTemplates(filters: HabitTemplateFilters): Promise<HabitTemplate[]> {
    try {
      let query = supabase.from('habit_templates').select('*');

      // Apply filters
      if (filters.lifeArea) {
        query = query.eq('life_area_type', filters.lifeArea);
      }

      if (filters.featuredOnly) {
        query = query.eq('is_featured', true);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      // Apply ordering
      query = query.order('sort_order', { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching filtered templates:', error);
        throw new Error('Failed to fetch habit templates');
      }

      let templates = data.map(mapTemplateRowToTemplate);

      // Apply search filter in memory (for better UX with partial matches)
      if (filters.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        templates = templates.filter(
          (t) =>
            t.name.toLowerCase().includes(searchLower) ||
            (t.description && t.description.toLowerCase().includes(searchLower))
        );
      }

      return templates;
    } catch (error) {
      console.error('Error in HabitTemplatesService.getFilteredTemplates:', error);
      throw error;
    }
  }

  /**
   * Get a single template by ID
   */
  static async getTemplateById(id: string): Promise<HabitTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('habit_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        console.error('Error fetching template:', error);
        throw new Error('Failed to fetch habit template');
      }

      return mapTemplateRowToTemplate(data);
    } catch (error) {
      console.error('Error in HabitTemplatesService.getTemplateById:', error);
      throw error;
    }
  }

  /**
   * Increment template popularity (called when user adds from template)
   */
  static async incrementPopularity(templateId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_template_popularity', {
        template_id: templateId,
      });

      // If RPC doesn't exist, fall back to direct update
      if (error) {
        await supabase
          .from('habit_templates')
          .update({ popularity: supabase.rpc('habit_templates.popularity + 1') })
          .eq('id', templateId);
      }
    } catch (error) {
      // Non-critical operation, just log
      console.warn('Failed to increment template popularity:', error);
    }
  }

  /**
   * Get available categories
   */
  static async getCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('habit_templates')
        .select('category')
        .not('category', 'is', null);

      if (error) {
        console.error('Error fetching categories:', error);
        return [];
      }

      // Get unique categories
      const categories = [...new Set(data.map((d) => d.category).filter(Boolean))];
      return categories as string[];
    } catch (error) {
      console.error('Error in HabitTemplatesService.getCategories:', error);
      return [];
    }
  }
}
