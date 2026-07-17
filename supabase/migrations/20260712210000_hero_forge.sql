-- Hero Forge — turn each user's AI avatar into THEIR rigged 3D arena hero.
--
-- 1. profiles.hero_model_url — public URL of the final multi-clip GLB
--    (avatars/{uid}/hero-{ts}.glb). Read by Arena.tsx (?model= iframe param).
-- 2. hero_forges — one row per forge job. It is a persisted state machine
--    advanced by client polling against the forge-hero Edge Function:
--    rig_image → meshy_model → meshy_rig → meshy_anim → downloading →
--    merging → done | failed. Written ONLY by the service role.
--    * one ACTIVE forge per user is enforced atomically by a partial
--      unique index (no read-then-insert race);
--    * the weekly re-forge cooldown reads the latest 'done' row.
--
-- Idempotent on purpose (IF NOT EXISTS / DROP POLICY IF EXISTS) so it can be
-- applied to the live project via the Management API safely.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hero_model_url TEXT;

CREATE TABLE IF NOT EXISTS public.hero_forges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'rig_image' CHECK (status IN
    ('rig_image','meshy_model','meshy_rig','meshy_anim','downloading','merging','done','failed')),
  error_code TEXT,                          -- i18n key when status = 'failed'
  gender TEXT,                              -- snapshot for the m/f fallback skin
  rig_image_path TEXT,                      -- avatars/{uid}/forge/{id}/rig.png
  meshy_model_task TEXT,                    -- image-to-3d task id
  meshy_rig_task TEXT,                      -- rigging task id
  meshy_anim_tasks JSONB NOT NULL DEFAULT '{}'::jsonb,  -- { idle, run, attack } → task ids
  glb_paths JSONB NOT NULL DEFAULT '{}'::jsonb,         -- { base, idle, run, attack } → bucket paths
  model_url TEXT,                           -- final public URL (mirror of profiles.hero_model_url)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- One active forge per user, enforced at the index level (INSERT fails, no race).
CREATE UNIQUE INDEX IF NOT EXISTS hero_forges_one_active
  ON public.hero_forges (user_id) WHERE status NOT IN ('done','failed');

-- Weekly cooldown lookup: latest successful forge.
CREATE INDEX IF NOT EXISTS hero_forges_done_idx
  ON public.hero_forges (user_id, completed_at DESC) WHERE status = 'done';

CREATE INDEX IF NOT EXISTS hero_forges_user_idx
  ON public.hero_forges (user_id, created_at DESC);

ALTER TABLE public.hero_forges ENABLE ROW LEVEL SECURITY;

-- Users can watch their own forge progress; ALL writes happen with the
-- service role inside the Edge Function (bypasses RLS), so no INSERT/UPDATE
-- policies exist on purpose.
DROP POLICY IF EXISTS "Users can view own forges" ON public.hero_forges;
CREATE POLICY "Users can view own forges"
  ON public.hero_forges FOR SELECT
  USING (auth.uid() = user_id);
