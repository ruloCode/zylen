-- ===========================================================================
-- Focus gem species unlocks (Forest-style progression)
-- ===========================================================================
-- The user starts with two free species (health, career — the starter gem's
-- species) and buys the rest with points (Esencia):
--   creativity 150 · finance 150 · social 200 · family 250
-- unlock_focus_species deducts points atomically and records the unlock.
-- focus_gems INSERT/UPDATE policies are tightened so a gem can only use an
-- available (default or unlocked) species.
-- Idempotent DDL.
-- ===========================================================================

UPDATE public.focus_gem_species SET is_default = true,  price_points = 0   WHERE key IN ('health', 'career');
UPDATE public.focus_gem_species SET is_default = false, price_points = 150 WHERE key IN ('creativity', 'finance');
UPDATE public.focus_gem_species SET is_default = false, price_points = 200 WHERE key = 'social';
UPDATE public.focus_gem_species SET is_default = false, price_points = 250 WHERE key = 'family';

CREATE TABLE IF NOT EXISTS public.focus_species_unlocks (
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  species     TEXT NOT NULL REFERENCES public.focus_gem_species(key),
  points_paid INTEGER NOT NULL DEFAULT 0,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, species)
);

ALTER TABLE public.focus_species_unlocks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'focus_species_unlocks' AND policyname = 'focus_species_unlocks_select_own') THEN
    -- Writes only via the SECURITY DEFINER RPC.
    CREATE POLICY focus_species_unlocks_select_own ON public.focus_species_unlocks
      FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Tighten focus_gems writes: species must be default or unlocked
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS focus_gems_insert_own ON public.focus_gems;
CREATE POLICY focus_gems_insert_own ON public.focus_gems
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      EXISTS (
        SELECT 1 FROM public.focus_gem_species s
        WHERE s.key = focus_gems.species AND s.is_default
      )
      OR EXISTS (
        SELECT 1 FROM public.focus_species_unlocks u
        WHERE u.user_id = auth.uid() AND u.species = focus_gems.species
      )
    )
  );

DROP POLICY IF EXISTS focus_gems_update_own ON public.focus_gems;
CREATE POLICY focus_gems_update_own ON public.focus_gems
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      EXISTS (
        SELECT 1 FROM public.focus_gem_species s
        WHERE s.key = focus_gems.species AND s.is_default
      )
      OR EXISTS (
        SELECT 1 FROM public.focus_species_unlocks u
        WHERE u.user_id = auth.uid() AND u.species = focus_gems.species
      )
    )
  );

-- ---------------------------------------------------------------------------
-- unlock_focus_species
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.unlock_focus_species(p_species TEXT)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_species RECORD;
  v_points INTEGER;
  v_new_points INTEGER;
  v_unlocked TEXT[];
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_species
  FROM public.focus_gem_species
  WHERE key = p_species;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'species_not_found';
  END IF;

  IF v_species.is_default THEN
    RAISE EXCEPTION 'species_already_available';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.focus_species_unlocks
    WHERE user_id = v_user_id AND species = p_species
  ) THEN
    RAISE EXCEPTION 'species_already_unlocked';
  END IF;

  SELECT points INTO v_points
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF COALESCE(v_points, 0) < v_species.price_points THEN
    RAISE EXCEPTION 'insufficient_points';
  END IF;

  UPDATE public.profiles
  SET points = points - v_species.price_points
  WHERE id = v_user_id
  RETURNING points INTO v_new_points;

  INSERT INTO public.focus_species_unlocks (user_id, species, points_paid)
  VALUES (v_user_id, p_species, v_species.price_points);

  SELECT COALESCE(array_agg(species), '{}') INTO v_unlocked
  FROM public.focus_species_unlocks
  WHERE user_id = v_user_id;

  RETURN jsonb_build_object(
    'species', p_species,
    'points_paid', v_species.price_points,
    'new_points', v_new_points,
    'unlocked_species', to_jsonb(v_unlocked)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.unlock_focus_species(TEXT) TO authenticated;

COMMENT ON FUNCTION public.unlock_focus_species IS 'Buy a focus gem species with points: validates availability and balance, deducts points, records the unlock; returns new_points + unlocked list';
