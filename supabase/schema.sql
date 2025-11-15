-- ============================================================================
-- ZYLEN DATABASE SCHEMA
-- ============================================================================
-- This file contains the complete database schema for the Zylen application
-- Run this SQL in your Supabase SQL Editor to create all tables, policies, and functions
--
-- Order of execution:
-- 1. Create tables
-- 2. Enable Row Level Security (RLS)
-- 3. Create RLS policies
-- 4. Create indexes
-- 5. Create triggers and functions
-- ============================================================================

-- ============================================================================
-- 1. CREATE TABLES
-- ============================================================================

-- Table: profiles
-- Extends auth.users with app-specific user data
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  total_xp_earned INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  avatar_url TEXT,
  has_completed_onboarding BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: life_areas
-- Stores user's life areas (predefined and custom)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.life_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area_type TEXT NOT NULL, -- 'health', 'finance', 'creativity', 'social', 'family', 'career', or 'custom'
  level INTEGER NOT NULL DEFAULT 1,
  total_xp INTEGER NOT NULL DEFAULT 0,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  enabled BOOLEAN NOT NULL DEFAULT true,
  custom_name TEXT, -- Only for custom areas
  icon_name TEXT, -- Lucide icon name for custom areas
  color TEXT, -- Hex color for custom areas
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: habits
-- Stores user's daily habits
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  life_area_id UUID NOT NULL REFERENCES public.life_areas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  xp INTEGER NOT NULL CHECK (xp >= 10 AND xp <= 100),
  points INTEGER NOT NULL DEFAULT 0, -- Calculated as xp * 0.5
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: habit_completions
-- NEW: Tracks individual habit completions (historical data)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  xp_earned INTEGER NOT NULL,
  points_earned INTEGER NOT NULL
);

-- Table: streaks
-- Tracks user's daily completion streaks
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_completion_date DATE,
  last_seven_days BOOLEAN[] NOT NULL DEFAULT ARRAY[false, false, false, false, false, false, false],
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: shop_items
-- Stores available rewards/indulgences
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.shop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  cost INTEGER NOT NULL CHECK (cost >= 10 AND cost <= 1000),
  description TEXT NOT NULL,
  category TEXT, -- 'food', 'leisure', 'shopping', 'other'
  available BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false, -- true for predefined items
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: purchases
-- Tracks purchase history
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_item_id UUID NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL, -- Cached for display
  cost INTEGER NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: messages
-- Stores chat messages (optional)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 2. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. CREATE RLS POLICIES
-- ============================================================================

-- Policies for profiles
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policies for life_areas
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view own life areas"
  ON public.life_areas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own life areas"
  ON public.life_areas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own life areas"
  ON public.life_areas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own life areas"
  ON public.life_areas FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for habits
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view own habits"
  ON public.habits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habits"
  ON public.habits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits"
  ON public.habits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits"
  ON public.habits FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for habit_completions
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view own completions"
  ON public.habit_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions"
  ON public.habit_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Note: No UPDATE or DELETE policies - completions should be immutable

-- Policies for streaks
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view own streak"
  ON public.streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streak"
  ON public.streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streak"
  ON public.streaks FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies for shop_items
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view own shop items"
  ON public.shop_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shop items"
  ON public.shop_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shop items"
  ON public.shop_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shop items"
  ON public.shop_items FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for purchases
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view own purchases"
  ON public.purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases"
  ON public.purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Note: No UPDATE or DELETE policies - purchases should be immutable

-- Policies for messages
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view own messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages"
  ON public.messages FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. CREATE INDEXES
-- ============================================================================

-- Indexes for life_areas
CREATE INDEX IF NOT EXISTS idx_life_areas_user_id ON public.life_areas(user_id);
CREATE INDEX IF NOT EXISTS idx_life_areas_area_type ON public.life_areas(area_type);

-- Indexes for habits
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_life_area_id ON public.habits(life_area_id);

-- Indexes for habit_completions
CREATE INDEX IF NOT EXISTS idx_completions_user_id ON public.habit_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_completions_habit_id ON public.habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_completions_completed_at ON public.habit_completions(completed_at);

-- Indexes for purchases
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_purchased_at ON public.purchases(purchased_at);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- ============================================================================
-- 5. CREATE TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Function: Auto-update updated_at timestamp
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update profiles.updated_at
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger: Auto-update habits.updated_at
CREATE TRIGGER set_habits_updated_at
  BEFORE UPDATE ON public.habits
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger: Auto-update streaks.updated_at
CREATE TRIGGER set_streaks_updated_at
  BEFORE UPDATE ON public.streaks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function: Auto-calculate habit points from xp
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_habit_points()
RETURNS TRIGGER AS $$
BEGIN
  NEW.points = FLOOR(NEW.xp * 0.5);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-calculate points when habit is inserted or xp is updated
CREATE TRIGGER set_habit_points
  BEFORE INSERT OR UPDATE OF xp ON public.habits
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_habit_points();

-- Function: Create profile on user signup
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, points, total_xp_earned, level)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    0,
    0,
    1
  );

  -- Initialize streak
  INSERT INTO public.streaks (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-create profile and streak on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 6. CREATE HELPER VIEWS (OPTIONAL)
-- ============================================================================

-- View: Daily completion status
-- Shows which habits were completed today
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.today_completions AS
SELECT
  hc.user_id,
  hc.habit_id,
  h.name AS habit_name,
  hc.completed_at,
  hc.xp_earned,
  hc.points_earned
FROM public.habit_completions hc
JOIN public.habits h ON h.id = hc.habit_id
WHERE DATE(hc.completed_at) = CURRENT_DATE;

-- Grant access to the view
GRANT SELECT ON public.today_completions TO authenticated;

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- Next steps:
-- 1. Configure OAuth providers in Supabase Dashboard
-- 2. Update .env.local with your Supabase URL and anon key
-- 3. Test the schema by running queries
-- ============================================================================
