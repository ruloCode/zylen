-- ============================================================
-- Feedback de beta testers (portal público /feedback)
--   - feedback_reports: reportes con fotos, categoría y estado de triage
--   - bucket storage 'feedback' (público, 5MB, solo imágenes)
--   - RLS: cualquiera puede enviar y leer; solo el admin
--     (rulocode7@gmail.com) puede cambiar el estado.
-- Idempotente: seguro de re-aplicar.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.feedback_reports (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  reporter_name text NOT NULL CHECK (char_length(reporter_name) BETWEEN 1 AND 60),
  category      text NOT NULL DEFAULT 'bug'
                CHECK (category IN ('bug', 'idea', 'diseno', 'otro')),
  message       text NOT NULL CHECK (char_length(message) BETWEEN 3 AND 2000),
  photos        jsonb NOT NULL DEFAULT '[]'::jsonb
                CHECK (jsonb_typeof(photos) = 'array' AND jsonb_array_length(photos) <= 6),
  device        text CHECK (char_length(device) <= 300),
  status        text NOT NULL DEFAULT 'nuevo'
                CHECK (status IN ('nuevo', 'en_progreso', 'resuelto', 'descartado')),
  admin_note    text CHECK (char_length(admin_note) <= 500),
  resolved_at   timestamptz
);

CREATE INDEX IF NOT EXISTS feedback_reports_status_created_idx
  ON public.feedback_reports (status, created_at DESC);

ALTER TABLE public.feedback_reports ENABLE ROW LEVEL SECURITY;

-- resolved_at se gestiona en BD para que el cliente no tenga que hacerlo
CREATE OR REPLACE FUNCTION public.feedback_set_resolved_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status IN ('resuelto', 'descartado') AND OLD.status NOT IN ('resuelto', 'descartado') THEN
    NEW.resolved_at := now();
  ELSIF NEW.status IN ('nuevo', 'en_progreso') THEN
    NEW.resolved_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS feedback_reports_resolved_at ON public.feedback_reports;
CREATE TRIGGER feedback_reports_resolved_at
  BEFORE UPDATE OF status ON public.feedback_reports
  FOR EACH ROW EXECUTE FUNCTION public.feedback_set_resolved_at();

DO $$ BEGIN
  CREATE POLICY "feedback_insert_public" ON public.feedback_reports
    FOR INSERT TO anon, authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "feedback_select_public" ON public.feedback_reports
    FOR SELECT TO anon, authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "feedback_update_admin" ON public.feedback_reports
    FOR UPDATE TO authenticated
    USING ((auth.jwt() ->> 'email') = 'rulocode7@gmail.com')
    WITH CHECK ((auth.jwt() ->> 'email') = 'rulocode7@gmail.com');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Bucket público para las capturas (lectura vía /object/public, sin RLS)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'feedback', 'feedback', true, 5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$ BEGIN
  CREATE POLICY "feedback_upload_public" ON storage.objects
    FOR INSERT TO anon, authenticated
    WITH CHECK (bucket_id = 'feedback');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
