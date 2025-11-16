-- ===========================================================================
-- 🔧 FIX AVATAR PATHS - Actualizar rutas antiguas de avatares
-- ===========================================================================
-- IMPORTANTE: Ejecuta este script EN PRODUCCIÓN para arreglar avatares
--
-- QUÉ HACE ESTE SCRIPT:
-- 1. Actualiza avatares con rutas antiguas (/src/assets/...) a nuevas rutas (/avatars/...)
-- 2. Establece avatar default (RULO) para usuarios sin avatar
-- 3. Verifica que todos los usuarios tengan un avatar válido
--
-- RESULTADO ESPERADO:
-- - Todos los usuarios con avatar_url tendrán rutas válidas: /avatars/rulo_avatar.png o /avatars/dani_avatar.png
-- - Usuarios sin avatar tendrán /avatars/rulo_avatar.png como default
-- ===========================================================================

-- ===========================================================================
-- PASO 1: ACTUALIZAR RUTAS ANTIGUAS
-- ===========================================================================
-- Reemplazar rutas que apunten a /src/assets/ con las nuevas rutas de /avatars/
-- ===========================================================================

-- Actualizar Rulo avatar (antigua ruta de import o assets)
UPDATE public.profiles
SET avatar_url = '/avatars/rulo_avatar.png'
WHERE avatar_url LIKE '%rulo_avatar%'
  AND avatar_url != '/avatars/rulo_avatar.png';

-- Actualizar Dani avatar (antigua ruta de import o assets)
UPDATE public.profiles
SET avatar_url = '/avatars/dani_avatar.png'
WHERE avatar_url LIKE '%dani_avatar%'
  AND avatar_url != '/avatars/dani_avatar.png';

-- ===========================================================================
-- PASO 2: ESTABLECER AVATAR DEFAULT
-- ===========================================================================
-- Para usuarios que no tienen avatar (NULL), establecer RULO como default
-- ===========================================================================

UPDATE public.profiles
SET avatar_url = '/avatars/rulo_avatar.png'
WHERE avatar_url IS NULL;

-- ===========================================================================
-- PASO 3: VERIFICACIÓN
-- ===========================================================================
-- Ver cuántos usuarios tienen cada tipo de avatar
-- ===========================================================================

SELECT
  '🎯 RESUMEN DE AVATARES' as titulo;

SELECT
  avatar_url as \"Avatar URL\",
  COUNT(*) as \"Cantidad de Usuarios\",
  CASE
    WHEN avatar_url = '/avatars/rulo_avatar.png' THEN '✅ RULO (Correcto)'
    WHEN avatar_url = '/avatars/dani_avatar.png' THEN '✅ DANI (Correcto)'
    WHEN avatar_url IS NULL THEN '⚠️ Sin avatar (esto no debería pasar)'
    ELSE '❌ Ruta inválida (necesita corrección)'
  END as \"Estado\"
FROM public.profiles
GROUP BY avatar_url
ORDER BY COUNT(*) DESC;

-- ===========================================================================
-- PASO 4: LISTAR USUARIOS CON RUTAS INVÁLIDAS (Si las hay)
-- ===========================================================================
-- Solo se ejecuta si todavía hay rutas inválidas
-- ===========================================================================

SELECT
  '⚠️ USUARIOS CON AVATARES INVÁLIDOS' as titulo;

SELECT
  id as \"User ID\",
  name as \"Nombre\",
  avatar_url as \"Avatar URL\",
  created_at as \"Creado\"
FROM public.profiles
WHERE avatar_url IS NOT NULL
  AND avatar_url NOT IN ('/avatars/rulo_avatar.png', '/avatars/dani_avatar.png')
ORDER BY created_at DESC;

-- ===========================================================================
-- 🎉 ¡LISTO!
-- ===========================================================================
-- Si el resumen muestra que todos los usuarios tienen:
-- - ✅ /avatars/rulo_avatar.png, O
-- - ✅ /avatars/dani_avatar.png
--
-- Entonces el fix funcionó correctamente.
--
-- SIGUIENTE PASO:
-- - Redeploy de la app en Vercel
-- - Los avatares ahora deberían cargar correctamente en producción
-- ===========================================================================
