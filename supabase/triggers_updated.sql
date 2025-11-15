-- ===========================================================================
-- Updated Trigger: handle_new_user
-- ===========================================================================
-- This trigger automatically creates:
-- 1. Profile
-- 2. Streak record
-- 3. 6 predefined life areas
-- 4. 4 default shop items
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  area_types TEXT[] := ARRAY['health', 'finance', 'creativity', 'social', 'family', 'career'];
  area_type TEXT;
BEGIN
  -- 1. Create profile
  INSERT INTO public.profiles (id, name, points, total_xp_earned, level)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    0,
    0,
    1
  );

  -- 2. Create streak record
  INSERT INTO public.streaks (user_id)
  VALUES (NEW.id);

  -- 3. Create 6 predefined life areas (disabled by default - user selects in onboarding)
  FOREACH area_type IN ARRAY area_types
  LOOP
    INSERT INTO public.life_areas (
      user_id,
      area_type,
      level,
      total_xp,
      is_custom,
      enabled
    )
    VALUES (
      NEW.id,
      area_type,
      1,
      0,
      false,
      false
    );
  END LOOP;

  -- 4. Create 4 default shop items
  INSERT INTO public.shop_items (user_id, name, icon_name, cost, description, category, is_default)
  VALUES
    (NEW.id, 'shop.items.sweetTreat.name', 'Candy', 50, 'shop.items.sweetTreat.description', 'food', true),
    (NEW.id, 'shop.items.impulseBuy.name', 'ShoppingCart', 100, 'shop.items.impulseBuy.description', 'shopping', true),
    (NEW.id, 'shop.items.stayUpLate.name', 'Moon', 75, 'shop.items.stayUpLate.description', 'leisure', true),
    (NEW.id, 'shop.items.extraCoffee.name', 'Coffee', 30, 'shop.items.extraCoffee.description', 'food', true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Comment
COMMENT ON FUNCTION public.handle_new_user IS 'Automatically creates profile, streak, life areas, and shop items for new users';
