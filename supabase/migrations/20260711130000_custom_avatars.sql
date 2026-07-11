-- Custom AI avatars ("crea tu avatar con tu foto")
--
-- 1. profiles.avatar_body_url — full-body hero PNG for the Home stage. The
--    bust keeps living in profiles.avatar_url (works transparently for the
--    leaderboard snapshot + public_profile view, which copy avatar_url TEXT).
-- 2. avatar_generations — one row per Edge Function generation, used to rate
--    limit Gemini spend per user/day. Inserted with the service role.
-- 3. storage bucket `avatars` — public read; authenticated users can only
--    write inside their own folder: avatars/{auth.uid()}/...
--
-- Idempotent on purpose (IF NOT EXISTS / ON CONFLICT / DROP POLICY IF EXISTS)
-- so it can be applied to the live project via the Management API safely.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_body_url TEXT;

CREATE TABLE IF NOT EXISTS public.avatar_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS avatar_generations_user_day_idx
  ON public.avatar_generations (user_id, created_at DESC);

ALTER TABLE public.avatar_generations ENABLE ROW LEVEL SECURITY;

-- Users can read their own generation history; writes happen with the
-- service role inside the Edge Function (bypasses RLS), so no INSERT policy.
DROP POLICY IF EXISTS "Users can view own avatar generations" ON public.avatar_generations;
CREATE POLICY "Users can view own avatar generations"
  ON public.avatar_generations FOR SELECT
  USING (auth.uid() = user_id);

-- Storage bucket for generated avatars (public CDN read).
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Avatar images are publicly readable" ON storage.objects;
CREATE POLICY "Avatar images are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload own avatars" ON storage.objects;
CREATE POLICY "Users can upload own avatars"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
CREATE POLICY "Users can update own avatars"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
CREATE POLICY "Users can delete own avatars"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
