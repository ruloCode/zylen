export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          created_at: string
          description: string
          icon_name: string
          id: string
          is_hidden: boolean
          key: string
          name: string
          points_reward: number
          requirement_type: string
          requirement_value: number
          tier: string
          xp_reward: number
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          icon_name: string
          id?: string
          is_hidden?: boolean
          key: string
          name: string
          points_reward?: number
          requirement_type: string
          requirement_value: number
          tier?: string
          xp_reward?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon_name?: string
          id?: string
          is_hidden?: boolean
          key?: string
          name?: string
          points_reward?: number
          requirement_type?: string
          requirement_value?: number
          tier?: string
          xp_reward?: number
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: Database["public"]["Enums"]["friendship_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: Database["public"]["Enums"]["friendship_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: Database["public"]["Enums"]["friendship_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "v_user_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_public_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_completions: {
        Row: {
          completed_at: string
          habit_id: string
          id: string
          points_earned: number
          user_id: string
          xp_earned: number
          value: number | null
        }
        Insert: {
          completed_at?: string
          habit_id: string
          id?: string
          points_earned: number
          user_id: string
          xp_earned: number
          value?: number | null
        }
        Update: {
          completed_at?: string
          habit_id?: string
          id?: string
          points_earned?: number
          user_id?: string
          xp_earned?: number
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "habit_completions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_templates: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          description_key: string | null
          icon_name: string
          id: string
          is_featured: boolean
          life_area_type: string
          name: string
          name_key: string | null
          popularity: number
          sort_order: number
          suggested_xp: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          description_key?: string | null
          icon_name: string
          id?: string
          is_featured?: boolean
          life_area_type: string
          name: string
          name_key?: string | null
          popularity?: number
          sort_order?: number
          suggested_xp?: number
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          description_key?: string | null
          icon_name?: string
          id?: string
          is_featured?: boolean
          life_area_type?: string
          name?: string
          name_key?: string | null
          popularity?: number
          sort_order?: number
          suggested_xp?: number
        }
        Relationships: []
      }
      habits: {
        Row: {
          created_at: string
          icon_name: string
          id: string
          is_archived: boolean
          life_area_id: string
          name: string
          points: number
          updated_at: string
          user_id: string
          xp: number
          habit_type: string
          unit: string | null
          daily_goal: number | null
          color: string | null
        }
        Insert: {
          created_at?: string
          icon_name: string
          id?: string
          is_archived?: boolean
          life_area_id: string
          name: string
          points?: number
          updated_at?: string
          user_id: string
          xp: number
          habit_type?: string
          unit?: string | null
          daily_goal?: number | null
          color?: string | null
        }
        Update: {
          created_at?: string
          icon_name?: string
          id?: string
          is_archived?: boolean
          life_area_id?: string
          name?: string
          points?: number
          updated_at?: string
          user_id?: string
          xp?: number
          habit_type?: string
          unit?: string | null
          daily_goal?: number | null
          color?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "habits_life_area_id_fkey"
            columns: ["life_area_id"]
            isOneToOne: false
            referencedRelation: "life_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      life_areas: {
        Row: {
          area_type: string
          color: string | null
          created_at: string
          custom_name: string | null
          enabled: boolean
          icon_name: string | null
          id: string
          is_custom: boolean
          level: number
          total_xp: number
          user_id: string
        }
        Insert: {
          area_type: string
          color?: string | null
          created_at?: string
          custom_name?: string | null
          enabled?: boolean
          icon_name?: string | null
          id?: string
          is_custom?: boolean
          level?: number
          total_xp?: number
          user_id: string
        }
        Update: {
          area_type?: string
          color?: string | null
          created_at?: string
          custom_name?: string | null
          enabled?: boolean
          icon_name?: string | null
          id?: string
          is_custom?: boolean
          level?: number
          total_xp?: number
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_range: string | null
          avatar_url: string | null
          created_at: string
          experience_level: string | null
          gender: string | null
          has_completed_onboarding: boolean
          id: string
          level: number
          motivation: string | null
          name: string
          points: number
          timezone: string
          total_xp_earned: number
          updated_at: string
          username: string | null
        }
        Insert: {
          age_range?: string | null
          avatar_url?: string | null
          created_at?: string
          experience_level?: string | null
          gender?: string | null
          has_completed_onboarding?: boolean
          id: string
          level?: number
          motivation?: string | null
          name: string
          points?: number
          timezone?: string
          total_xp_earned?: number
          updated_at?: string
          username?: string | null
        }
        Update: {
          age_range?: string | null
          avatar_url?: string | null
          created_at?: string
          experience_level?: string | null
          gender?: string | null
          has_completed_onboarding?: boolean
          id?: string
          level?: number
          motivation?: string | null
          name?: string
          points?: number
          timezone?: string
          total_xp_earned?: number
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          cost: number
          id: string
          item_name: string
          purchased_at: string
          shop_item_id: string
          user_id: string
        }
        Insert: {
          cost: number
          id?: string
          item_name: string
          purchased_at?: string
          shop_item_id: string
          user_id: string
        }
        Update: {
          cost?: number
          id?: string
          item_name?: string
          purchased_at?: string
          shop_item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_shop_item_id_fkey"
            columns: ["shop_item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
        ]
      }
      root_habit_checkins: {
        Row: {
          checked_in_at: string
          day_number: number
          id: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          checked_in_at?: string
          day_number: number
          id?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          checked_in_at?: string
          day_number?: number
          id?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      shop_items: {
        Row: {
          available: boolean
          category: string | null
          cost: number
          created_at: string
          description: string
          icon_name: string
          id: string
          is_default: boolean
          name: string
          user_id: string
        }
        Insert: {
          available?: boolean
          category?: string | null
          cost: number
          created_at?: string
          description: string
          icon_name: string
          id?: string
          is_default?: boolean
          name: string
          user_id: string
        }
        Update: {
          available?: boolean
          category?: string | null
          cost?: number
          created_at?: string
          description?: string
          icon_name?: string
          id?: string
          is_default?: boolean
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      streaks: {
        Row: {
          current_streak: number
          last_completion_date: string | null
          last_seven_days: boolean[]
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          last_completion_date?: string | null
          last_seven_days?: boolean[]
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          last_completion_date?: string | null
          last_seven_days?: boolean[]
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          claimed_at: string | null
          id: string
          progress: number | null
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          claimed_at?: string | null
          id?: string
          progress?: number | null
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          claimed_at?: string | null
          id?: string
          progress?: number | null
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_leaderboard: {
        Row: {
          created_at: string
          habits_completed: number
          id: string
          rank: number | null
          updated_at: string
          user_id: string
          week_end_date: string
          week_start_date: string
          weekly_points_earned: number
          weekly_xp_earned: number
        }
        Insert: {
          created_at?: string
          habits_completed?: number
          id?: string
          rank?: number | null
          updated_at?: string
          user_id: string
          week_end_date: string
          week_start_date: string
          weekly_points_earned?: number
          weekly_xp_earned?: number
        }
        Update: {
          created_at?: string
          habits_completed?: number
          id?: string
          rank?: number | null
          updated_at?: string
          user_id?: string
          week_end_date?: string
          week_start_date?: string
          weekly_points_earned?: number
          weekly_xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "weekly_leaderboard_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_leaderboard_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_public_profile"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      today_completions: {
        Row: {
          completed_at: string | null
          habit_id: string | null
          habit_name: string | null
          points_earned: number | null
          user_id: string | null
          xp_earned: number | null
        }
        Relationships: [
          {
            foreignKeyName: "habit_completions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      v_user_public_profile: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          current_streak: number | null
          id: string | null
          level: number | null
          longest_streak: number | null
          points: number | null
          total_xp_earned: number | null
          username: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_friend_request: {
        Args: { p_friendship_id: string }
        Returns: undefined
      }
      calculate_life_area_level: {
        Args: { p_total_xp: number }
        Returns: number
      }
      calculate_user_level: { Args: { p_total_xp: number }; Returns: number }
      check_and_unlock_achievements: {
        Args: { p_user_id: string }
        Returns: {
          achievements_unlocked: Json
          newly_unlocked: number
        }[]
      }
      claim_achievement_reward: {
        Args: { p_achievement_id: string; p_user_id: string }
        Returns: Json
      }
      complete_habit: { Args: { p_habit_id: string }; Returns: Json }
      generate_username_suggestions: {
        Args: { p_count?: number; p_name: string }
        Returns: string[]
      }
      get_achievements_with_progress: {
        Args: { p_user_id: string }
        Returns: {
          achievement_id: string
          category: string
          claimed_at: string
          current_progress: number
          description: string
          icon_name: string
          is_claimed: boolean
          is_hidden: boolean
          is_unlocked: boolean
          key: string
          name: string
          points_reward: number
          requirement_type: string
          requirement_value: number
          tier: string
          unlocked_at: string
          xp_reward: number
        }[]
      }
      get_current_week_range: {
        Args: never
        Returns: {
          week_end: string
          week_start: string
        }[]
      }
      get_friend_list: {
        Args: { p_user_id?: string }
        Returns: {
          avatar_url: string
          current_streak: number
          friendship_created_at: string
          friendship_id: string
          friendship_status: Database["public"]["Enums"]["friendship_status"]
          level: number
          longest_streak: number
          points: number
          total_xp_earned: number
          user_id: string
          username: string
        }[]
      }
      get_habit_completion_trend: {
        Args: { p_days?: number; p_user_id: string }
        Returns: Json
      }
      get_mutual_friends_count: {
        Args: { p_friend_id: string; p_user_id: string }
        Returns: number
      }
      get_pending_friend_requests: {
        Args: never
        Returns: {
          avatar_url: string
          created_at: string
          current_streak: number
          friendship_id: string
          level: number
          total_xp_earned: number
          user_id: string
          username: string
        }[]
      }
      get_root_habit_progress: {
        Args: { p_user_id: string }
        Returns: {
          completed_days: number[]
          completion_percentage: number
          current_day: number
          is_completed: boolean
          total_days_completed: number
        }[]
      }
      get_sent_friend_requests: {
        Args: never
        Returns: {
          avatar_url: string
          created_at: string
          current_streak: number
          friendship_id: string
          level: number
          total_xp_earned: number
          user_id: string
          username: string
        }[]
      }
      get_user_stats: { Args: { p_user_id: string }; Returns: Json }
      get_user_weekly_rank: {
        Args: { p_user_id: string; p_week_start?: string }
        Returns: number
      }
      get_weekly_leaderboard: {
        Args: { p_limit?: number; p_user_id: string; p_week_start?: string }
        Returns: {
          avatar_url: string
          habits_completed: number
          is_current_user: boolean
          level: number
          rank: number
          user_id: string
          username: string
          weekly_points_earned: number
          weekly_xp_earned: number
        }[]
      }
      get_xp_distribution: { Args: { p_user_id: string }; Returns: Json }
      increment_template_popularity: {
        Args: { template_id: string }
        Returns: undefined
      }
      is_username_available: { Args: { p_username: string }; Returns: boolean }
      reject_friend_request: {
        Args: { p_friendship_id: string }
        Returns: undefined
      }
      remove_friend: { Args: { p_friendship_id: string }; Returns: undefined }
      search_users_by_username: {
        Args: { p_limit?: number; p_search_term: string }
        Returns: {
          avatar_url: string
          current_streak: number
          friendship_status: string
          id: string
          level: number
          total_xp_earned: number
          username: string
        }[]
      }
      send_friend_request: {
        Args: { p_friend_username: string }
        Returns: string
      }
      track_weekly_habit_completion: {
        Args: {
          p_points_earned: number
          p_user_id: string
          p_xp_earned: number
        }
        Returns: undefined
      }
      uncomplete_habit: { Args: { p_habit_id: string }; Returns: Json }
      update_current_week_ranks: { Args: never; Returns: undefined }
      update_user_points: {
        Args: { p_delta: number; p_user_id: string }
        Returns: Json
      }
      update_user_xp: {
        Args: { p_user_id: string; p_xp_delta: number }
        Returns: Json
      }
    }
    Enums: {
      friendship_status: "pending" | "accepted" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      friendship_status: ["pending", "accepted", "rejected"],
    },
  },
} as const
