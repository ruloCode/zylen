-- Life areas enabled by default
--
-- Bug: handle_new_user() insertaba las 6 áreas con `enabled = false` explícito
-- (ignorando el DEFAULT true de la columna). Eso era coherente cuando el
-- onboarding tenía un paso de selección de áreas que llamaba a
-- updateSelectedLifeAreas() para activarlas; el onboarding v2 de mobile eliminó
-- ese paso asumiendo lo contrario ("every area ships enabled by default").
--
-- Consecuencia: un usuario nuevo llegaba al paso "Elige tu primer ritual" sin
-- ninguna área activa → las plantillas no resolvían categoría (0 sugerencias) y
-- el hábito custom no podía formarse (defaultAreaId vacío) → CTA "Siguiente"
-- deshabilitado para siempre. Dead-end sin salida en el onboarding.
--
-- 1) El trigger ahora crea las áreas activas.
-- 2) Backfill de los usuarios ya afectados.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  area_types TEXT[] := ARRAY['health', 'finance', 'creativity', 'social', 'family', 'career'];
  area_type TEXT;
BEGIN
  INSERT INTO public.profiles (id, name, points, total_xp_earned, level)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'User'), 0, 0, 1);
  INSERT INTO public.streaks (user_id) VALUES (NEW.id);
  FOREACH area_type IN ARRAY area_types LOOP
    -- enabled = true: el onboarding ya no tiene paso de selección de áreas.
    INSERT INTO public.life_areas (user_id, area_type, level, total_xp, is_custom, enabled)
    VALUES (NEW.id, area_type, 1, 0, false, true);
  END LOOP;
  INSERT INTO public.shop_items (user_id, name, icon_name, cost, description, category, is_default)
  VALUES
    (NEW.id, 'shop.items.sweetTreat.name', 'Candy', 50, 'shop.items.sweetTreat.description', 'food', true),
    (NEW.id, 'shop.items.impulseBuy.name', 'ShoppingCart', 100, 'shop.items.impulseBuy.description', 'shopping', true),
    (NEW.id, 'shop.items.stayUpLate.name', 'Moon', 75, 'shop.items.stayUpLate.description', 'leisure', true),
    (NEW.id, 'shop.items.extraCoffee.name', 'Coffee', 30, 'shop.items.extraCoffee.description', 'food', true);
  RETURN NEW;
END;
$function$;

-- Backfill: solo usuarios con CERO áreas activas (los bloqueados por el bug).
-- Quien desactivó alguna a propósito conserva su configuración intacta.
UPDATE public.life_areas
SET enabled = true
WHERE user_id IN (
  SELECT user_id
  FROM public.life_areas
  GROUP BY user_id
  HAVING count(*) FILTER (WHERE enabled) = 0
);
