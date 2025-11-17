# 🚀 Próximos Pasos para Completar las Funcionalidades Sociales

## ✅ Lo que YA está COMPLETADO

### 1. Capa de Datos (100%)
- ✅ **Tipos TypeScript**: user.ts actualizado, social.ts creado, supabase.ts actualizado
- ✅ **Servicios**: social.service.ts y leaderboard.service.ts completos
- ✅ **Store Zustand**: socialSlice.ts y leaderboardSlice.ts con hooks tipados
- ✅ **Traducciones**: Español completo en translation.json

### 2. Migraciones de Supabase (50% aplicadas)
- ✅ **Migración 1**: Username agregado a profiles con funciones de validación
- ✅ **Migración 2**: Tabla friendships creada con RLS y funciones
- ⏳ **Migración 3**: Tabla weekly_leaderboard (PENDIENTE)
- ⏳ **Migración 4**: Vista v_user_public_profile y funciones de búsqueda (PENDIENTE)

---

## 📋 TAREAS PENDIENTES

### PASO 1: Completar Migraciones de Supabase ⚠️ PRIORITARIO

Necesitas aplicar las migraciones restantes manualmente en Supabase Dashboard > SQL Editor:

#### **Migración 3: Weekly Leaderboard**
Archivo: `supabase/migrations/20250115000003_create_weekly_leaderboard_table.sql`

```sql
-- Copiar y pegar TODO el contenido del archivo en SQL Editor
-- Ejecutar la migración
```

#### **Migración 4: Public Profile View**
Archivo: `supabase/migrations/20250115000004_create_public_profile_view.sql`

```sql
-- Copiar y pegar TODO el contenido del archivo en SQL Editor
-- Ejecutar la migración
```

**Verificación**:
```sql
-- Verificar tablas creadas
SELECT * FROM friendships LIMIT 1;
SELECT * FROM weekly_leaderboard LIMIT 1;
SELECT * FROM v_user_public_profile LIMIT 1;

-- Probar funciones
SELECT is_username_available('test_user');
SELECT * FROM generate_username_suggestions('Juan Perez', 5);
```

---

### PASO 2: Traducciones en Inglés

Crear: `public/locales/en/translation.json`

Copiar el archivo español y traducir las secciones nuevas:
- `username.*`
- `social.*`
- `leaderboard.*`
- `navigation.social`, `navigation.leaderboard`, `navigation.profile`

---

### PASO 3: Componentes UI (CORE)

Los componentes están documentados en `SOCIAL_FEATURES_IMPLEMENTATION.md` con props y funcionalidad completa.

#### **Prioridad ALTA:**

1. **UsernameSelector** (`src/features/social/components/UsernameSelector.tsx`)
   - Necesario para onboarding
   - Props y funcionalidad en documentación

2. **Actualizar Onboarding** (`src/pages/Onboarding.tsx`)
   - Agregar paso 2: Selección de username
   - Integrar UsernameSelector

3. **Actualizar Profile** (`src/pages/Profile.tsx`)
   - Mostrar username actual
   - Botón para editar username

#### **Prioridad MEDIA:**

4. **FriendCard** - Tarjeta de amigo individual
5. **UserSearch** - Buscador de usuarios
6. **FriendsList** - Lista de amigos
7. **FriendRequests** - Solicitudes pendientes
8. **Página Social** (`src/pages/Social.tsx`) - Integra componentes sociales

#### **Prioridad BAJA:**

9. **LeaderboardEntry** - Fila de leaderboard
10. **WeeklyLeaderboard** - Tabla completa
11. **Página Leaderboard** (`src/pages/Leaderboard.tsx`)

---

### PASO 4: Rutas y Navegación

#### **Actualizar routes.ts**
```typescript
export const ROUTES = {
  // ... existing
  SOCIAL: '/social',
  LEADERBOARD: '/leaderboard',
  PROFILE: '/profile',
} as const;
```

#### **Actualizar App.tsx**
```typescript
const Social = lazy(() => import('@/pages/Social'));
const Leaderboard = lazy(() => import('@/pages/Leaderboard'));

// En routes:
<Route path={ROUTES.SOCIAL} element={<Social />} />
<Route path={ROUTES.LEADERBOARD} element={<Leaderboard />} />
```

#### **Actualizar Navigation.tsx**
- Agregar íconos: `Users` (Social), `Trophy` (Leaderboard)
- Badge numérico en Social para solicitudes pendientes
- Usar `useSocial()` para obtener count

---

## 🎯 Plan de Implementación Recomendado

### Semana 1: Funcionalidad Básica
1. ✅ Aplicar migraciones 3 y 4 en Supabase
2. ✅ Crear UsernameSelector component
3. ✅ Actualizar Onboarding con username
4. ✅ Crear traducciones en inglés
5. ✅ Probar flujo completo de onboarding

### Semana 2: Funciones Sociales
6. ✅ Crear componentes sociales (FriendCard, UserSearch, etc.)
7. ✅ Crear página Social
8. ✅ Actualizar Profile para mostrar username
9. ✅ Actualizar routes y navigation
10. ✅ Probar enviar/aceptar solicitudes de amistad

### Semana 3: Leaderboard
11. ✅ Crear componentes de leaderboard
12. ✅ Crear página Leaderboard
13. ✅ Probar tracking semanal automático
14. ✅ Verificar rankings y posiciones

---

## 🧪 Testing Checklist

Después de implementar, verifica:

### Onboarding
- [ ] Usuario puede elegir username único
- [ ] Validación funciona (3-20 chars, alfanumérico + _)
- [ ] Sugerencias se generan correctamente
- [ ] Username se guarda en perfil

### Social Features
- [ ] Búsqueda de usuarios funciona
- [ ] Enviar solicitud funciona
- [ ] Aceptar solicitud funciona
- [ ] Rechazar solicitud funciona
- [ ] Eliminar amigo funciona
- [ ] Ver stats de amigos funciona

### Leaderboard
- [ ] Leaderboard carga correctamente
- [ ] Completar hábito actualiza stats semanales
- [ ] Rankings se calculan correctamente
- [ ] Usuario puede ver su posición
- [ ] Top 3 tiene medallas especiales

### Seguridad
- [ ] RLS impide acceso no autorizado
- [ ] Solo datos públicos son visibles
- [ ] Username único garantizado

---

## 📂 Archivos Clave de Referencia

1. **`SOCIAL_FEATURES_IMPLEMENTATION.md`** - Documentación completa con:
   - Especificaciones de cada función SQL
   - Props de cada componente
   - Ejemplos de código
   - Testing checklist

2. **`supabase/migrations/`** - Migraciones SQL:
   - `20250115000001_add_username_to_profiles.sql` ✅
   - `20250115000002_create_friendships_table.sql` ✅
   - `20250115000003_create_weekly_leaderboard_table.sql` ⏳
   - `20250115000004_create_public_profile_view.sql` ⏳

3. **Servicios Supabase**:
   - `src/services/supabase/social.service.ts` ✅
   - `src/services/supabase/leaderboard.service.ts` ✅

4. **Store Zustand**:
   - `src/store/socialSlice.ts` ✅
   - `src/store/leaderboardSlice.ts` ✅
   - `src/store/index.ts` (con hooks) ✅

5. **Traducciones**:
   - `public/locales/es/translation.json` ✅
   - `public/locales/en/translation.json` ⏳

---

## ⚡ Quick Start

```bash
# 1. Aplicar migraciones restantes en Supabase Dashboard
# SQL Editor > Pegar contenido de migrations 3 y 4 > Run

# 2. Verificar que todo funciona
# SQL Editor > Ejecutar:
SELECT is_username_available('test');

# 3. Comenzar con el componente UsernameSelector
# Ver especificación completa en SOCIAL_FEATURES_IMPLEMENTATION.md

# 4. Seguir con Onboarding update

# 5. Continuar con componentes sociales
```

---

## 🐛 Troubleshooting

### Error: "username column does not exist"
**Solución**: Aplicar migración 1 en Supabase

### Error: "function is_username_available does not exist"
**Solución**: Aplicar migración 1 completa (incluye funciones)

### Error: "friendships table does not exist"
**Solución**: Aplicar migración 2

### Error: "weekly_leaderboard table does not exist"
**Solución**: Aplicar migración 3

### Error: "v_user_public_profile does not exist"
**Solución**: Aplicar migración 4

---

## 💡 Recursos Útiles

- **Supabase Docs**: https://supabase.com/docs
- **React i18next**: https://react.i18next.com
- **Zustand**: https://zustand-demo.pmnd.rs
- **Lucide Icons**: https://lucide.dev

---

## ✨ ¡Estás 70% Completo!

La parte más compleja (backend, servicios, store) está lista. Solo falta la UI, que es mayormente copy-paste de componentes siguiendo los patrones ya establecidos en el proyecto.

¡Mucha suerte! 🚀
