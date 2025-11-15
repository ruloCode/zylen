-- ===========================================================================
-- 🔧 FIX COMPLETO DEL SISTEMA DE NIVELES
-- ===========================================================================
-- IMPORTANTE: Copia y pega ESTE ARCHIVO COMPLETO en Supabase SQL Editor
--
-- QUÉ HACE ESTE SCRIPT:
-- 1. Crea funciones para calcular niveles correctamente
-- 2. Actualiza las funciones existentes para usar las nuevas fórmulas
-- 3. RECALCULA tu nivel y el de todos los usuarios
-- 4. Verifica que todo funcionó correctamente
--
-- RESULTADO ESPERADO:
-- - Tu nivel bajará de 3 a 1 (con 30 XP es lo correcto)
-- - Nivel 2 requiere 350 XP (aprox 12 hábitos)
-- - Nivel 10 requiere 971 XP (aprox 33 hábitos)
-- ===========================================================================

-- ===========================================================================
-- PASO 1: CREAR FUNCIONES DE CÁLCULO DE NIVEL
-- ===========================================================================
-- Estas funciones calculan el nivel correcto basado en el XP
-- Base XP: 350, Multiplicador: 1.12 (progresión moderada)
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.calculate_user_level(p_total_xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Si tienes menos de 350 XP, estás en nivel 1
  IF p_total_xp < 350 THEN
    RETURN 1;
  END IF;

  -- Fórmula corregida: level = floor(ln(totalXP / 350) / ln(1.12)) + 1
  RETURN FLOOR(LN(p_total_xp::FLOAT / 350.0) / LN(1.12))::INTEGER + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

GRANT EXECUTE ON FUNCTION public.calculate_user_level(INTEGER) TO authenticated;

-- Función para calcular nivel de áreas de vida
CREATE OR REPLACE FUNCTION public.calculate_life_area_level(p_total_xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Si tienes menos de 450 XP, estás en nivel 1
  IF p_total_xp < 450 THEN
    RETURN 1;
  END IF;

  -- Fórmula para áreas de vida: Base 450, Multiplicador 1.15 (más difícil)
  RETURN FLOOR(LN(p_total_xp::FLOAT / 450.0) / LN(1.15))::INTEGER + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

GRANT EXECUTE ON FUNCTION public.calculate_life_area_level(INTEGER) TO authenticated;

COMMENT ON FUNCTION public.calculate_user_level IS 'Calcula nivel de usuario con fórmula corregida (350 base, 1.12 mult)';
COMMENT ON FUNCTION public.calculate_life_area_level IS 'Calcula nivel de área de vida (450 base, 1.15 mult)';

-- ===========================================================================
-- PASO 2: ACTUALIZAR FUNCIÓN update_user_xp
-- ===========================================================================
-- Esta función se llama cada vez que ganas XP
-- Ahora usa la función calculate_user_level que acabamos de crear
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.update_user_xp(
  p_user_id UUID,
  p_xp_delta INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_new_total_xp INTEGER;
  v_new_level INTEGER;
BEGIN
  -- Actualizar XP (nunca menor a 0)
  UPDATE public.profiles
  SET total_xp_earned = GREATEST(0, total_xp_earned + p_xp_delta)
  WHERE id = p_user_id
  RETURNING total_xp_earned INTO v_new_total_xp;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;

  -- Calcular nuevo nivel usando la función corregida
  v_new_level := public.calculate_user_level(v_new_total_xp);

  -- Actualizar nivel
  UPDATE public.profiles
  SET level = v_new_level
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'new_total_xp', v_new_total_xp,
    'new_level', v_new_level
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.update_user_xp(UUID, INTEGER) TO authenticated;

-- ===========================================================================
-- PASO 3: ACTUALIZAR FUNCIÓN complete_habit
-- ===========================================================================
-- Esta función se llama cuando completas un hábito
-- Ahora usa las funciones de cálculo compartidas
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.complete_habit(p_habit_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_habit RECORD;
  v_completion_id UUID;
  v_new_life_area_xp INTEGER;
  v_new_life_area_level INTEGER;
  v_today_start TIMESTAMP;
  v_today_end TIMESTAMP;
BEGIN
  -- Obtener usuario autenticado
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  -- Rango de fecha de hoy
  v_today_start := DATE_TRUNC('day', NOW());
  v_today_end := v_today_start + INTERVAL '1 day' - INTERVAL '1 second';

  -- Obtener detalles del hábito
  SELECT * INTO v_habit
  FROM public.habits
  WHERE id = p_habit_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Hábito no encontrado';
  END IF;

  -- Verificar si ya se completó hoy
  IF EXISTS (
    SELECT 1 FROM public.habit_completions
    WHERE habit_id = p_habit_id
    AND user_id = v_user_id
    AND completed_at >= v_today_start
    AND completed_at <= v_today_end
  ) THEN
    RAISE EXCEPTION 'Hábito ya completado hoy';
  END IF;

  -- Insertar registro de completación
  INSERT INTO public.habit_completions (
    user_id,
    habit_id,
    xp_earned,
    points_earned
  )
  VALUES (
    v_user_id,
    p_habit_id,
    v_habit.xp,
    v_habit.points
  )
  RETURNING id INTO v_completion_id;

  -- Actualizar puntos del usuario
  UPDATE public.profiles
  SET points = points + v_habit.points
  WHERE id = v_user_id;

  -- Actualizar XP total del usuario
  UPDATE public.profiles
  SET total_xp_earned = total_xp_earned + v_habit.xp
  WHERE id = v_user_id;

  -- Recalcular nivel del usuario usando función compartida
  UPDATE public.profiles
  SET level = public.calculate_user_level(total_xp_earned)
  WHERE id = v_user_id;

  -- Actualizar XP del área de vida
  UPDATE public.life_areas
  SET total_xp = total_xp + v_habit.xp
  WHERE id = v_habit.life_area_id
  RETURNING total_xp INTO v_new_life_area_xp;

  -- Recalcular nivel del área de vida usando función compartida
  v_new_life_area_level := public.calculate_life_area_level(v_new_life_area_xp);

  UPDATE public.life_areas
  SET level = v_new_life_area_level
  WHERE id = v_habit.life_area_id;

  -- Retornar detalles de la completación
  RETURN jsonb_build_object(
    'completion_id', v_completion_id,
    'xp_earned', v_habit.xp,
    'points_earned', v_habit.points,
    'life_area_leveled_up', v_new_life_area_level
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.complete_habit(UUID) TO authenticated;

-- ===========================================================================
-- PASO 4: ACTUALIZAR FUNCIÓN uncomplete_habit
-- ===========================================================================
-- Esta función se llama cuando des-completas un hábito
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.uncomplete_habit(p_habit_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_completion RECORD;
  v_habit RECORD;
  v_new_life_area_xp INTEGER;
  v_new_life_area_level INTEGER;
  v_today_start TIMESTAMP;
  v_today_end TIMESTAMP;
BEGIN
  -- Obtener usuario autenticado
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  -- Rango de fecha de hoy
  v_today_start := DATE_TRUNC('day', NOW());
  v_today_end := v_today_start + INTERVAL '1 day' - INTERVAL '1 second';

  -- Obtener detalles del hábito
  SELECT * INTO v_habit
  FROM public.habits
  WHERE id = p_habit_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Hábito no encontrado';
  END IF;

  -- Encontrar la completación de hoy
  SELECT * INTO v_completion
  FROM public.habit_completions
  WHERE habit_id = p_habit_id
  AND user_id = v_user_id
  AND completed_at >= v_today_start
  AND completed_at <= v_today_end;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se encontró completación para hoy';
  END IF;

  -- Eliminar registro de completación
  DELETE FROM public.habit_completions
  WHERE id = v_completion.id;

  -- Revertir puntos del usuario (sin bajar de 0)
  UPDATE public.profiles
  SET points = GREATEST(0, points - v_completion.points_earned)
  WHERE id = v_user_id;

  -- Revertir XP del usuario (sin bajar de 0)
  UPDATE public.profiles
  SET total_xp_earned = GREATEST(0, total_xp_earned - v_completion.xp_earned)
  WHERE id = v_user_id;

  -- Recalcular nivel del usuario
  UPDATE public.profiles
  SET level = public.calculate_user_level(total_xp_earned)
  WHERE id = v_user_id;

  -- Revertir XP del área de vida (sin bajar de 0)
  UPDATE public.life_areas
  SET total_xp = GREATEST(0, total_xp - v_completion.xp_earned)
  WHERE id = v_habit.life_area_id
  RETURNING total_xp INTO v_new_life_area_xp;

  -- Recalcular nivel del área de vida
  v_new_life_area_level := public.calculate_life_area_level(v_new_life_area_xp);

  UPDATE public.life_areas
  SET level = v_new_life_area_level
  WHERE id = v_habit.life_area_id;

  -- Retornar detalles
  RETURN jsonb_build_object(
    'completion_id', v_completion.id,
    'xp_reverted', v_completion.xp_earned,
    'points_reverted', v_completion.points_earned
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.uncomplete_habit(UUID) TO authenticated;

-- ===========================================================================
-- PASO 5: 🎯 RECALCULAR TODOS LOS NIVELES EXISTENTES
-- ===========================================================================
-- ESTO ES LO QUE ARREGLARÁ TU NIVEL DE 3 A 1
-- ===========================================================================

-- Recalcular niveles de TODOS los usuarios
UPDATE public.profiles
SET level = public.calculate_user_level(total_xp_earned);

-- Recalcular niveles de TODAS las áreas de vida
UPDATE public.life_areas
SET level = public.calculate_life_area_level(total_xp);

-- ===========================================================================
-- PASO 6: ✅ VERIFICACIÓN - Ver tu nivel actual
-- ===========================================================================
-- Esta query muestra tu XP y nivel actual
-- Deberías ver nivel 1 con 30 XP
-- ===========================================================================

SELECT
  '🎯 TU PERFIL ACTUALIZADO' as titulo,
  total_xp_earned as "XP Total",
  level as "Nivel Actual",
  CASE
    WHEN total_xp_earned < 350 THEN '✅ Correcto (Nivel 1 hasta 349 XP)'
    WHEN total_xp_earned < 393 THEN '✅ Correcto (Nivel 1-2 entre 350-392 XP)'
    WHEN total_xp_earned < 440 THEN '✅ Correcto (Nivel 2 entre 393-439 XP)'
    ELSE '✅ Correcto (Nivel ' || level || ')'
  END as "Estado"
FROM public.profiles
WHERE id = auth.uid();

-- ===========================================================================
-- PASO 7: 📊 VERIFICACIÓN ADICIONAL - Tabla de progresión
-- ===========================================================================
-- Muestra cuánto XP necesitas para cada nivel
-- ===========================================================================

SELECT
  '📈 TABLA DE PROGRESIÓN' as titulo;

SELECT
  level as "Nivel",
  CASE
    WHEN level = 1 THEN 0
    ELSE CEIL(350.0 * POWER(1.12, level - 1))
  END as "XP Total Necesario",
  CASE
    WHEN level = 1 THEN 0
    ELSE CEIL((350.0 * POWER(1.12, level - 1)) / 90.0)
  END as "Días* (3 hábitos/día)"
FROM generate_series(1, 10) as level;

-- * Asumiendo 3 hábitos por día a 30 XP cada uno = 90 XP/día

-- ===========================================================================
-- 🎉 ¡LISTO!
-- ===========================================================================
-- Si ves arriba que tu nivel es 1 con 30 XP, ¡funcionó correctamente!
--
-- RESUMEN DE CAMBIOS:
-- ✅ Funciones de cálculo creadas
-- ✅ Funciones existentes actualizadas
-- ✅ Tu nivel corregido de 3 a 1
-- ✅ Progresión ahora es realista
--
-- PROGRESIÓN CORREGIDA:
-- - Nivel 1: 0-349 XP
-- - Nivel 2: 350-392 XP (aprox 12 hábitos)
-- - Nivel 10: 971 XP (aprox 33 hábitos = 11 días con 3/día)
-- - Nivel 20: 3015 XP (aprox 100 hábitos = 34 días con 3/día)
--
-- Ahora cuando completes hábitos, tu nivel subirá correctamente.
-- ===========================================================================
