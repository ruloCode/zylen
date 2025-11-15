/**
 * Supabase Database Types
 *
 * This file will be auto-generated after creating the database schema.
 * Run: `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts`
 *
 * For now, this is a placeholder with basic types.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          points: number;
          total_xp_earned: number;
          level: number;
          avatar_url: string | null;
          has_completed_onboarding: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          points?: number;
          total_xp_earned?: number;
          level?: number;
          avatar_url?: string | null;
          has_completed_onboarding?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          points?: number;
          total_xp_earned?: number;
          level?: number;
          avatar_url?: string | null;
          has_completed_onboarding?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      life_areas: {
        Row: {
          id: string;
          user_id: string;
          area_type: string;
          level: number;
          total_xp: number;
          is_custom: boolean;
          enabled: boolean;
          custom_name: string | null;
          icon_name: string | null;
          color: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          area_type: string;
          level?: number;
          total_xp?: number;
          is_custom?: boolean;
          enabled?: boolean;
          custom_name?: string | null;
          icon_name?: string | null;
          color?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          area_type?: string;
          level?: number;
          total_xp?: number;
          is_custom?: boolean;
          enabled?: boolean;
          custom_name?: string | null;
          icon_name?: string | null;
          color?: string | null;
          created_at?: string;
        };
      };
      habits: {
        Row: {
          id: string;
          user_id: string;
          life_area_id: string;
          name: string;
          icon_name: string;
          xp: number;
          points: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          life_area_id: string;
          name: string;
          icon_name: string;
          xp: number;
          points?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          life_area_id?: string;
          name?: string;
          icon_name?: string;
          xp?: number;
          points?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      habit_completions: {
        Row: {
          id: string;
          user_id: string;
          habit_id: string;
          completed_at: string;
          xp_earned: number;
          points_earned: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          habit_id: string;
          completed_at?: string;
          xp_earned: number;
          points_earned: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          habit_id?: string;
          completed_at?: string;
          xp_earned?: number;
          points_earned?: number;
        };
      };
      streaks: {
        Row: {
          user_id: string;
          current_streak: number;
          longest_streak: number;
          last_completion_date: string | null;
          last_seven_days: boolean[];
          updated_at: string;
        };
        Insert: {
          user_id: string;
          current_streak?: number;
          longest_streak?: number;
          last_completion_date?: string | null;
          last_seven_days?: boolean[];
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          current_streak?: number;
          longest_streak?: number;
          last_completion_date?: string | null;
          last_seven_days?: boolean[];
          updated_at?: string;
        };
      };
      shop_items: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          icon_name: string;
          cost: number;
          description: string;
          category: string | null;
          available: boolean;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          icon_name: string;
          cost: number;
          description: string;
          category?: string | null;
          available?: boolean;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          icon_name?: string;
          cost?: number;
          description?: string;
          category?: string | null;
          available?: boolean;
          is_default?: boolean;
          created_at?: string;
        };
      };
      purchases: {
        Row: {
          id: string;
          user_id: string;
          shop_item_id: string;
          item_name: string;
          cost: number;
          purchased_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          shop_item_id: string;
          item_name: string;
          cost: number;
          purchased_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          shop_item_id?: string;
          item_name?: string;
          cost?: number;
          purchased_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          user_id: string;
          role: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: string;
          content?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
