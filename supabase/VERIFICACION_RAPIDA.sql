-- ===========================================================================
-- ✅ VERIFICACIÓN RÁPIDA DESPUÉS DEL FIX
-- ===========================================================================
-- Ejecuta estas queries DESPUÉS de aplicar FIX_COMPLETO.sql
-- para asegurarte de que todo está funcionando correctamente
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. TU PERFIL (Lo más importante)
-- ---------------------------------------------------------------------------
SELECT
  '===== TU PERFIL ACTUAL =====' as separador;

SELECT
  total_xp_earned as "Tu XP",
  level as "Tu Nivel",
  points as "Tus Puntos",
  CASE
    WHEN level = 1 AND total_xp_earned < 350 THEN '✅ CORRECTO'
    WHEN level = 2 AND total_xp_earned >= 350 AND total_xp_earned < 440 THEN '✅ CORRECTO'
    ELSE '⚠️ Verifica que ejecutaste FIX_COMPLETO.sql'
  END as "Estado"
FROM public.profiles
WHERE id = auth.uid();

-- RESULTADO ESPERADO:
-- Con 30 XP deberías ver:
-- Tu XP: 30
-- Tu Nivel: 1
-- Estado: ✅ CORRECTO

-- ---------------------------------------------------------------------------
-- 2. TABLA DE PROGRESIÓN (Para referencia)
-- ---------------------------------------------------------------------------
SELECT
  '===== CUÁNTO XP NECESITAS =====' as separador;

SELECT
  nivel as "Nivel",
  xp_total as "XP Total Necesario",
  xp_total - LAG(xp_total, 1, 0) OVER (ORDER BY nivel) as "XP para Este Nivel",
  CEIL((xp_total - LAG(xp_total, 1, 0) OVER (ORDER BY nivel))::FLOAT / 30) as "Hábitos Necesarios"
FROM (
  SELECT
    level as nivel,
    CASE
      WHEN level = 1 THEN 0
      ELSE CEIL(350.0 * POWER(1.12, level - 1))
    END as xp_total
  FROM generate_series(1, 10) as level
) t;

-- RESULTADO ESPERADO:
-- Nivel 1: 0 XP
-- Nivel 2: 350 XP (12 hábitos desde nivel 1)
-- Nivel 3: 440 XP (3 hábitos desde nivel 2)
-- Nivel 10: 971 XP

-- ---------------------------------------------------------------------------
-- 3. TEST RÁPIDO DE LA FUNCIÓN
-- ---------------------------------------------------------------------------
SELECT
  '===== VERIFICAR FUNCIONES =====' as separador;

SELECT
  xp as "XP",
  public.calculate_user_level(xp) as "Nivel Calculado",
  CASE
    WHEN xp = 30 AND public.calculate_user_level(xp) = 1 THEN '✅'
    WHEN xp = 350 AND public.calculate_user_level(xp) = 1 THEN '✅'
    WHEN xp = 393 AND public.calculate_user_level(xp) = 2 THEN '✅'
    ELSE '❌'
  END as "Estado"
FROM (VALUES (30), (350), (393)) as test(xp);

-- RESULTADO ESPERADO:
-- Todos deberían mostrar ✅

-- ---------------------------------------------------------------------------
-- 4. TUS ÁREAS DE VIDA
-- ---------------------------------------------------------------------------
SELECT
  '===== TUS ÁREAS DE VIDA =====' as separador;

SELECT
  area_type as "Área",
  total_xp as "XP",
  level as "Nivel",
  CASE
    WHEN level = public.calculate_life_area_level(total_xp) THEN '✅'
    ELSE '❌ Nivel incorrecto'
  END as "Estado"
FROM public.life_areas
WHERE user_id = auth.uid() AND enabled = true
ORDER BY total_xp DESC;

-- RESULTADO ESPERADO:
-- Todas las áreas deberían mostrar ✅

-- ===========================================================================
-- 🎯 RESUMEN
-- ===========================================================================
-- Si TODOS los estados de arriba muestran ✅, el fix funcionó correctamente
--
-- SIGUIENTE PASO:
-- Ve a la app, completa un hábito, y verifica que:
-- 1. Tu XP aumenta
-- 2. Tu nivel se actualiza correctamente cuando llegas a 350 XP
-- 3. No hay errores en la consola
-- ===========================================================================
