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
      activity_events: {
        Row: {
          completion_id: string | null
          created_at: string
          dedup_key: string | null
          event_type: string
          id: string
          payload: Json
          user_id: string
        }
        Insert: {
          completion_id?: string | null
          created_at?: string
          dedup_key?: string | null
          event_type: string
          id?: string
          payload?: Json
          user_id: string
        }
        Update: {
          completion_id?: string | null
          created_at?: string
          dedup_key?: string | null
          event_type?: string
          id?: string
          payload?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_events_completion_id_fkey"
            columns: ["completion_id"]
            isOneToOne: false
            referencedRelation: "habit_completions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_public_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      arena_progress: {
        Row: {
          gems: Json
          owned_gems: Json
          owned_weapons: Json
          tier: number
          updated_at: string
          user_id: string
          weapon_id: string
        }
        Insert: {
          gems?: Json
          owned_gems?: Json
          owned_weapons?: Json
          tier?: number
          updated_at?: string
          user_id: string
          weapon_id?: string
        }
        Update: {
          gems?: Json
          owned_gems?: Json
          owned_weapons?: Json
          tier?: number
          updated_at?: string
          user_id?: string
          weapon_id?: string
        }
        Relationships: []
      }
      avatar_generations: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      focus_daily_reward_claims: {
        Row: {
          claim_date: string
          created_at: string
          points_awarded: number
          user_id: string
          xp_awarded: number
        }
        Insert: {
          claim_date: string
          created_at?: string
          points_awarded?: number
          user_id: string
          xp_awarded?: number
        }
        Update: {
          claim_date?: string
          created_at?: string
          points_awarded?: number
          user_id?: string
          xp_awarded?: number
        }
        Relationships: []
      }
      focus_gem_species: {
        Row: {
          is_default: boolean
          key: string
          life_area_key: string | null
          price_points: number
          sort_order: number
        }
        Insert: {
          is_default?: boolean
          key: string
          life_area_key?: string | null
          price_points?: number
          sort_order?: number
        }
        Update: {
          is_default?: boolean
          key?: string
          life_area_key?: string | null
          price_points?: number
          sort_order?: number
        }
        Relationships: []
      }
      focus_gems: {
        Row: {
          activity: string | null
          created_at: string
          habit_id: string | null
          id: string
          is_archived: boolean
          name: string
          species: string
          user_id: string
        }
        Insert: {
          activity?: string | null
          created_at?: string
          habit_id?: string | null
          id?: string
          is_archived?: boolean
          name: string
          species: string
          user_id: string
        }
        Update: {
          activity?: string | null
          created_at?: string
          habit_id?: string | null
          id?: string
          is_archived?: boolean
          name?: string
          species?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_gems_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "focus_gems_species_fkey"
            columns: ["species"]
            isOneToOne: false
            referencedRelation: "focus_gem_species"
            referencedColumns: ["key"]
          },
        ]
      }
      focus_sessions: {
        Row: {
          break_reason: string | null
          duration_minutes: number
          ended_at: string | null
          gem_id: string | null
          id: string
          life_area_id: string | null
          paused_ms: number
          points_awarded: number
          species: string
          started_at: string
          status: string
          user_id: string
          xp_awarded: number
        }
        Insert: {
          break_reason?: string | null
          duration_minutes: number
          ended_at?: string | null
          gem_id?: string | null
          id?: string
          life_area_id?: string | null
          paused_ms?: number
          points_awarded?: number
          species: string
          started_at?: string
          status?: string
          user_id: string
          xp_awarded?: number
        }
        Update: {
          break_reason?: string | null
          duration_minutes?: number
          ended_at?: string | null
          gem_id?: string | null
          id?: string
          life_area_id?: string | null
          paused_ms?: number
          points_awarded?: number
          species?: string
          started_at?: string
          status?: string
          user_id?: string
          xp_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "focus_sessions_gem_id_fkey"
            columns: ["gem_id"]
            isOneToOne: false
            referencedRelation: "focus_gems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "focus_sessions_life_area_id_fkey"
            columns: ["life_area_id"]
            isOneToOne: false
            referencedRelation: "life_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      focus_species_unlocks: {
        Row: {
          points_paid: number
          species: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          points_paid?: number
          species: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          points_paid?: number
          species?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_species_unlocks_species_fkey"
            columns: ["species"]
            isOneToOne: false
            referencedRelation: "focus_gem_species"
            referencedColumns: ["key"]
          },
        ]
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
          value: number | null
          xp_earned: number
        }
        Insert: {
          completed_at?: string
          habit_id: string
          id?: string
          points_earned: number
          user_id: string
          value?: number | null
          xp_earned: number
        }
        Update: {
          completed_at?: string
          habit_id?: string
          id?: string
          points_earned?: number
          user_id?: string
          value?: number | null
          xp_earned?: number
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
      habit_relapses: {
        Row: {
          habit_id: string
          id: string
          note: string | null
          relapsed_at: string
          user_id: string
        }
        Insert: {
          habit_id: string
          id?: string
          note?: string | null
          relapsed_at?: string
          user_id: string
        }
        Update: {
          habit_id?: string
          id?: string
          note?: string | null
          relapsed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_relapses_habit_id_fkey"
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
          color: string | null
          created_at: string
          daily_goal: number | null
          habit_type: string
          icon_name: string
          id: string
          is_archived: boolean
          life_area_id: string
          name: string
          points: number
          reminder_enabled: boolean
          time_of_day: string
          unit: string | null
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          daily_goal?: number | null
          habit_type?: string
          icon_name: string
          id?: string
          is_archived?: boolean
          life_area_id: string
          name: string
          points?: number
          reminder_enabled?: boolean
          time_of_day?: string
          unit?: string | null
          updated_at?: string
          user_id: string
          xp: number
        }
        Update: {
          color?: string | null
          created_at?: string
          daily_goal?: number | null
          habit_type?: string
          icon_name?: string
          id?: string
          is_archived?: boolean
          life_area_id?: string
          name?: string
          points?: number
          reminder_enabled?: boolean
          time_of_day?: string
          unit?: string | null
          updated_at?: string
          user_id?: string
          xp?: number
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
      hero_forges: {
        Row: {
          completed_at: string | null
          created_at: string
          error_code: string | null
          gender: string | null
          glb_paths: Json
          id: string
          meshy_anim_tasks: Json
          meshy_model_task: string | null
          meshy_rig_task: string | null
          model_url: string | null
          rig_image_path: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_code?: string | null
          gender?: string | null
          glb_paths?: Json
          id?: string
          meshy_anim_tasks?: Json
          meshy_model_task?: string | null
          meshy_rig_task?: string | null
          model_url?: string | null
          rig_image_path?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_code?: string | null
          gender?: string | null
          glb_paths?: Json
          id?: string
          meshy_anim_tasks?: Json
          meshy_model_task?: string | null
          meshy_rig_task?: string | null
          model_url?: string | null
          rig_image_path?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_range: string | null
          avatar_body_url: string | null
          avatar_url: string | null
          created_at: string
          experience_level: string | null
          gender: string | null
          has_completed_onboarding: boolean
          hero_model_url: string | null
          id: string
          last_active_at: string | null
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
          avatar_body_url?: string | null
          avatar_url?: string | null
          created_at?: string
          experience_level?: string | null
          gender?: string | null
          has_completed_onboarding?: boolean
          hero_model_url?: string | null
          id: string
          last_active_at?: string | null
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
          avatar_body_url?: string | null
          avatar_url?: string | null
          created_at?: string
          experience_level?: string | null
          gender?: string | null
          has_completed_onboarding?: boolean
          hero_model_url?: string | null
          id?: string
          last_active_at?: string | null
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
      shared_mission_checkins: {
        Row: {
          checkin_date: string
          created_at: string
          mission_id: string
          user_id: string
        }
        Insert: {
          checkin_date: string
          created_at?: string
          mission_id: string
          user_id: string
        }
        Update: {
          checkin_date?: string
          created_at?: string
          mission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_mission_checkins_mission_id_user_id_fkey"
            columns: ["mission_id", "user_id"]
            isOneToOne: false
            referencedRelation: "shared_mission_participants"
            referencedColumns: ["mission_id", "user_id"]
          },
        ]
      }
      shared_mission_participants: {
        Row: {
          completed_at: string | null
          days_completed: number
          joined_at: string
          mission_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          days_completed?: number
          joined_at?: string
          mission_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          days_completed?: number
          joined_at?: string
          mission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_mission_participants_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "shared_missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_mission_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_mission_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_public_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_missions: {
        Row: {
          code: string
          created_at: string
          description: string
          duration_days: number
          icon_name: string | null
          id: string
          is_active: boolean
          reward_points: number
          reward_xp: number
          title: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string
          duration_days: number
          icon_name?: string | null
          id?: string
          is_active?: boolean
          reward_points?: number
          reward_xp?: number
          title: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          duration_days?: number
          icon_name?: string | null
          id?: string
          is_active?: boolean
          reward_points?: number
          reward_xp?: number
          title?: string
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
          last_active_at: string | null
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
      arena_item_cost: {
        Args: { p_item_id: string; p_item_type: string }
        Returns: number
      }
      break_focus_session: {
        Args: { p_reason: string; p_session_id: string }
        Returns: Json
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
      checkin_shared_mission: { Args: { p_mission_id: string }; Returns: Json }
      claim_achievement_reward: {
        Args: { p_achievement_id: string; p_user_id: string }
        Returns: Json
      }
      claim_daily_focus_reward: {
        Args: {
          p_minutes_goal: number
          p_reward_points: number
          p_reward_xp: number
        }
        Returns: Json
      }
      complete_arena_tier: { Args: { p_tier: number }; Returns: number }
      complete_focus_session: { Args: { p_session_id: string }; Returns: Json }
      complete_habit: {
        Args: { p_habit_id: string; p_value?: number }
        Returns: Json
      }
      equip_arena_gear: {
        Args: { p_gems: Json; p_weapon_id: string }
        Returns: {
          gems: Json
          owned_gems: Json
          owned_weapons: Json
          tier: number
          updated_at: string
          user_id: string
          weapon_id: string
        }
        SetofOptions: {
          from: "*"
          to: "arena_progress"
          isOneToOne: true
          isSetofReturn: false
        }
      }
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
      get_ally_stats: {
        Args: never
        Returns: {
          active_now: number
          active_today: number
          best_streak: number
          best_streak_username: string
          shared_weekly_points: number
          shared_weekly_xp: number
          total_allies: number
        }[]
      }
      get_arena_progress: {
        Args: never
        Returns: {
          gems: Json
          owned_gems: Json
          owned_weapons: Json
          tier: number
          updated_at: string
          user_id: string
          weapon_id: string
        }
        SetofOptions: {
          from: "*"
          to: "arena_progress"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_current_week_range: {
        Args: never
        Returns: {
          week_end: string
          week_start: string
        }[]
      }
      get_daily_activity: {
        Args: { p_days?: number }
        Returns: {
          completions: number
          day: string
          xp: number
        }[]
      }
      get_focus_stats: { Args: never; Returns: Json }
      get_friend_activity: {
        Args: { p_before?: string; p_limit?: number }
        Returns: {
          avatar_url: string
          created_at: string
          event_type: string
          id: string
          is_current_user: boolean
          payload: Json
          user_id: string
          username: string
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
          last_active_at: string
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
      get_shared_missions: {
        Args: never
        Returns: {
          code: string
          description: string
          duration_days: number
          icon_name: string
          is_joined: boolean
          mission_id: string
          my_checked_in_today: boolean
          my_completed: boolean
          my_days_completed: number
          participant_avatars: Json
          participant_count: number
          reward_points: number
          reward_xp: number
          title: string
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
          current_streak: number
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
      join_shared_mission: { Args: { p_mission_id: string }; Returns: Json }
      purchase_arena_item: {
        Args: { p_item_id: string; p_item_type: string }
        Returns: Json
      }
      record_relapse: { Args: { p_habit_id: string }; Returns: Json }
      refresh_user_streak: { Args: { p_user_id: string }; Returns: Json }
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
      start_focus_session: {
        Args: { p_duration_minutes: number; p_gem_id: string }
        Returns: Json
      }
      touch_last_active: { Args: never; Returns: undefined }
      track_weekly_habit_completion: {
        Args: {
          p_points_earned: number
          p_user_id: string
          p_xp_earned: number
        }
        Returns: undefined
      }
      uncomplete_habit: { Args: { p_habit_id: string }; Returns: Json }
      unlock_focus_species: { Args: { p_species: string }; Returns: Json }
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
