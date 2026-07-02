-- ===========================================================================
-- habit_templates: versions the table that exists in the live DB but had no
-- CREATE TABLE in the repo (habitTemplates.service.ts depends on it).
-- Idempotent: IF NOT EXISTS everywhere; seed uses ON CONFLICT DO NOTHING.
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.habit_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_key TEXT,
  description TEXT,
  description_key TEXT,
  icon_name TEXT NOT NULL,
  life_area_type TEXT NOT NULL,
  suggested_xp INTEGER NOT NULL DEFAULT 20,
  category TEXT,
  popularity INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_habit_templates_life_area
  ON public.habit_templates (life_area_type, sort_order);

ALTER TABLE public.habit_templates ENABLE ROW LEVEL SECURITY;

-- Templates are a global read-only catalog
DROP POLICY IF EXISTS "Templates are readable by authenticated users" ON public.habit_templates;
CREATE POLICY "Templates are readable by authenticated users"
  ON public.habit_templates FOR SELECT
  TO authenticated
  USING (true);

-- increment_template_popularity already exists in live with this exact
-- signature (param name matters: the client calls it as { template_id }).
CREATE OR REPLACE FUNCTION public.increment_template_popularity(template_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.habit_templates
  SET popularity = popularity + 1
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.increment_template_popularity(UUID) TO authenticated;
