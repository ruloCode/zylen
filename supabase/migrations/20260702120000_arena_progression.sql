-- Arena roguelite progression: per-user tier ladder + weapon/gem inventory.
-- Purchases are ATOMIC (points check + deduct + grant in one function) — unlike
-- the Santuario shop flow, gear must never double-spend or grant without paying.

CREATE TABLE IF NOT EXISTS public.arena_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier INT NOT NULL DEFAULT 1 CHECK (tier >= 1 AND tier <= 50),
  weapon_id TEXT NOT NULL DEFAULT 'staff_novice',
  gems JSONB NOT NULL DEFAULT '[]'::jsonb,
  owned_weapons JSONB NOT NULL DEFAULT '["staff_novice"]'::jsonb,
  owned_gems JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.arena_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "arena_progress_select_own" ON public.arena_progress;
CREATE POLICY "arena_progress_select_own" ON public.arena_progress
  FOR SELECT USING (auth.uid() = user_id);
-- All writes go through SECURITY DEFINER RPCs; no direct insert/update policies.

-- Server-side gear catalog: cost is validated here, never trusted from the client.
CREATE OR REPLACE FUNCTION public.arena_item_cost(p_item_type TEXT, p_item_id TEXT)
RETURNS INT
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_item_type = 'weapon' THEN CASE p_item_id
      WHEN 'staff_novice'    THEN 0
      WHEN 'staff_adept'     THEN 300
      WHEN 'staff_guardian'  THEN 800
      WHEN 'staff_everlight' THEN 2000
    END
    WHEN p_item_type = 'gem' THEN CASE p_item_id
      WHEN 'vitality' THEN 150
      WHEN 'swift'    THEN 150
      WHEN 'wisdom'   THEN 250
      WHEN 'wrath'    THEN 400
      WHEN 'haste'    THEN 500
      WHEN 'leech'    THEN 600
    END
  END;
$$;

CREATE OR REPLACE FUNCTION public.get_arena_progress()
RETURNS public.arena_progress
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_row public.arena_progress;
BEGIN
  INSERT INTO public.arena_progress (user_id)
  VALUES (auth.uid())
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_row FROM public.arena_progress WHERE user_id = auth.uid();
  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.purchase_arena_item(p_item_type TEXT, p_item_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_cost INT;
  v_points INT;
  v_owned JSONB;
  v_row public.arena_progress;
BEGIN
  v_cost := public.arena_item_cost(p_item_type, p_item_id);
  IF v_cost IS NULL THEN
    RAISE EXCEPTION 'unknown_item';
  END IF;

  -- ensure the progress row exists
  INSERT INTO public.arena_progress (user_id) VALUES (auth.uid())
  ON CONFLICT (user_id) DO NOTHING;

  SELECT CASE WHEN p_item_type = 'weapon' THEN owned_weapons ELSE owned_gems END
  INTO v_owned
  FROM public.arena_progress WHERE user_id = auth.uid() FOR UPDATE;

  IF v_owned ? p_item_id THEN
    RAISE EXCEPTION 'already_owned';
  END IF;

  -- atomic points check + deduct (row-locked)
  SELECT points INTO v_points FROM public.profiles WHERE id = auth.uid() FOR UPDATE;
  IF v_points IS NULL OR v_points < v_cost THEN
    RAISE EXCEPTION 'insufficient_points';
  END IF;
  UPDATE public.profiles SET points = points - v_cost, updated_at = now()
  WHERE id = auth.uid();

  IF p_item_type = 'weapon' THEN
    UPDATE public.arena_progress
    SET owned_weapons = owned_weapons || to_jsonb(p_item_id), updated_at = now()
    WHERE user_id = auth.uid();
  ELSE
    UPDATE public.arena_progress
    SET owned_gems = owned_gems || to_jsonb(p_item_id), updated_at = now()
    WHERE user_id = auth.uid();
  END IF;

  SELECT * INTO v_row FROM public.arena_progress WHERE user_id = auth.uid();
  RETURN jsonb_build_object(
    'new_points', v_points - v_cost,
    'owned_weapons', v_row.owned_weapons,
    'owned_gems', v_row.owned_gems
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.equip_arena_gear(p_weapon_id TEXT, p_gems JSONB)
RETURNS public.arena_progress
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_row public.arena_progress;
  v_gem TEXT;
BEGIN
  INSERT INTO public.arena_progress (user_id) VALUES (auth.uid())
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_row FROM public.arena_progress WHERE user_id = auth.uid() FOR UPDATE;

  IF NOT (v_row.owned_weapons ? p_weapon_id) THEN
    RAISE EXCEPTION 'weapon_not_owned';
  END IF;
  IF jsonb_typeof(p_gems) <> 'array' OR jsonb_array_length(p_gems) > 2 THEN
    RAISE EXCEPTION 'invalid_gems';
  END IF;
  FOR v_gem IN SELECT jsonb_array_elements_text(p_gems) LOOP
    IF NOT (v_row.owned_gems ? v_gem) THEN
      RAISE EXCEPTION 'gem_not_owned';
    END IF;
  END LOOP;

  UPDATE public.arena_progress
  SET weapon_id = p_weapon_id, gems = p_gems, updated_at = now()
  WHERE user_id = auth.uid()
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_arena_tier(p_tier INT)
RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_tier INT;
BEGIN
  INSERT INTO public.arena_progress (user_id) VALUES (auth.uid())
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.arena_progress
  SET tier = LEAST(50, GREATEST(tier, p_tier + 1)), updated_at = now()
  WHERE user_id = auth.uid()
  RETURNING tier INTO v_tier;
  RETURN v_tier;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_arena_progress() TO authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_arena_item(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.equip_arena_gear(TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_arena_tier(INT) TO authenticated;
