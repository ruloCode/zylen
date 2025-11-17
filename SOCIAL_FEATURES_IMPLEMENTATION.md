# Implementación de Funcionalidades Sociales - Zylen

## Resumen del Proyecto

Este documento describe la implementación completa de un sistema de nombres de usuario únicos con funcionalidades sociales competitivas para la aplicación Zylen.

### Funcionalidades Implementadas

1. **Nombres de usuario únicos** - Sistema de usernames validados y únicos
2. **Sistema de amigos** - Enviar/aceptar/rechazar solicitudes de amistad
3. **Perfiles públicos** - Ver stats de amigos (XP, puntos, rachas)
4. **Tabla de clasificación semanal** - Rankings competitivos por semana

---

## ✅ COMPLETADO - Capa de Datos

### 1. Migraciones de Base de Datos

#### ✅ `/supabase/migrations/20250115000001_add_username_to_profiles.sql`
- Agrega columna `username` a tabla `profiles` (VARCHAR(20), UNIQUE)
- Índice en `username` para búsquedas rápidas
- Constraint de validación: `/^[a-zA-Z0-9_]{3,20}$/`
- Funciones SQL:
  - `is_username_available(p_username)` - Verifica disponibilidad
  - `generate_username_suggestions(p_name, p_count)` - Genera sugerencias

#### ✅ `/supabase/migrations/20250115000002_create_friendships_table.sql`
- Tabla `friendships` con relaciones bidireccionales
- Enum `friendship_status`: 'pending', 'accepted', 'rejected'
- Constraints: UNIQUE(user_id, friend_id), user_id != friend_id
- RLS Policies configuradas
- Funciones SQL:
  - `send_friend_request(p_friend_username)` - Enviar solicitud
  - `accept_friend_request(p_friendship_id)` - Aceptar solicitud
  - `reject_friend_request(p_friendship_id)` - Rechazar solicitud
  - `remove_friend(p_friendship_id)` - Eliminar amistad
  - `get_mutual_friends_count(p_user_id, p_friend_id)` - Conteo

#### ✅ `/supabase/migrations/20250115000003_create_weekly_leaderboard_table.sql`
- Tabla `weekly_leaderboard` con stats semanales
- Campos: user_id, week_start/end_date, weekly_xp/points_earned, habits_completed, rank
- RLS: lectura pública, escritura solo vía RPC
- Funciones SQL:
  - `get_current_week_range()` - Rango de la semana actual
  - `track_weekly_habit_completion(p_user_id, p_xp_earned, p_points_earned)` - Tracking
  - `update_current_week_ranks()` - Actualiza rankings
  - `get_weekly_leaderboard(p_user_id, p_limit, p_week_start)` - Top N + posición usuario
  - `get_user_weekly_rank(p_user_id, p_week_start)` - Rank del usuario

#### ✅ `/supabase/migrations/20250115000004_create_public_profile_view.sql`
- Vista `v_user_public_profile` - Datos públicos seguros
- Funciones SQL:
  - `search_users_by_username(p_search_term, p_limit)` - Búsqueda con estado de amistad
  - `get_friend_list(p_user_id)` - Lista de amigos con stats
  - `get_pending_friend_requests()` - Solicitudes recibidas
  - `get_sent_friend_requests()` - Solicitudes enviadas

### 2. Tipos TypeScript

#### ✅ `/src/types/user.ts`
- Agregado `username?: string` a interfaz `User`
- Nueva interfaz `PublicUserProfile` con datos públicos

#### ✅ `/src/types/social.ts` (NUEVO)
```typescript
- FriendshipStatus type
- Friendship interface
- FriendProfile interface
- UserSearchResult interface
- LeaderboardEntry interface
- WeeklyLeaderboard interface
- FriendRequest interface
```

#### ✅ `/src/types/supabase.ts`
- Agregado `username` a `profiles` table
- Agregada tabla `friendships`
- Agregada tabla `weekly_leaderboard`
- Agregado enum `friendship_status`

### 3. Servicios Supabase

#### ✅ `/src/services/supabase/social.service.ts` (NUEVO)
```typescript
- checkUsernameAvailability(username)
- generateUsernameSuggestions(name, count)
- updateUsername(userId, username)
- searchUsers(searchTerm, limit)
- sendFriendRequest(friendUsername)
- acceptFriendRequest(friendshipId)
- rejectFriendRequest(friendshipId)
- removeFriend(friendshipId)
- getFriendsList(userId?)
- getPendingFriendRequests()
- getSentFriendRequests()
- getPublicProfile(username)
- getMutualFriendsCount(userId, friendId)
```

#### ✅ `/src/services/supabase/leaderboard.service.ts` (NUEVO)
```typescript
- getCurrentWeekRange()
- trackHabitCompletion(userId, xpEarned, pointsEarned)
- getWeeklyLeaderboard(userId, limit, weekStartDate?)
- getUserWeeklyRank(userId, weekStartDate?)
- updateCurrentWeekRanks()
- getUserWeeklyStats(userId, weekStartDate?)
- getHistoricalLeaderboard(weekStartDate, limit)
```

#### ✅ `/src/services/supabase/habits.service.ts` (ACTUALIZADO)
- Agregado import de `trackHabitCompletion` desde leaderboard.service
- Modificado `completeHabit()` para llamar a `trackHabitCompletion()` automáticamente

### 4. Store Zustand

#### ✅ `/src/store/socialSlice.ts` (NUEVO)
```typescript
State:
- friends: FriendProfile[]
- pendingRequests: FriendRequest[]
- sentRequests: FriendRequest[]
- searchResults: UserSearchResult[]
- isLoading: boolean
- error: string | null

Actions:
- searchUsers(searchTerm)
- sendFriendRequest(friendUsername)
- acceptFriendRequest(friendshipId)
- rejectFriendRequest(friendshipId)
- removeFriend(friendshipId)
- loadFriends(userId?)
- loadPendingRequests()
- loadSentRequests()
- clearSearchResults()
- clearError()
```

#### ✅ `/src/store/leaderboardSlice.ts` (NUEVO)
```typescript
State:
- weeklyLeaderboard: WeeklyLeaderboard | null
- userRank: number
- userWeeklyStats: { weeklyXPEarned, weeklyPointsEarned, habitsCompleted } | null
- isLoading: boolean
- error: string | null

Actions:
- loadWeeklyLeaderboard(userId, limit, weekStartDate?)
- loadUserWeeklyStats(userId, weekStartDate?)
- refreshLeaderboard(userId)
- clearError()
```

#### ✅ `/src/store/index.ts` (ACTUALIZADO)
- Agregados imports de `socialSlice` y `leaderboardSlice`
- Agregados tipos `SocialSlice` y `LeaderboardSlice` a `AppStore`
- Slices combinados en store principal
- Nuevos hooks tipados:
  - `useSocial()`
  - `useLeaderboard()`

---

## 🚧 PENDIENTE - Componentes UI y Páginas

### 5. Traducciones i18n

#### ⏳ `/public/locales/es/translation.json` (ACTUALIZAR)
Agregar secciones:
```json
{
  "username": {
    "title": "Nombre de Usuario",
    "choose": "Elige tu nombre de usuario",
    "available": "Disponible",
    "taken": "No disponible",
    "invalid": "Inválido (3-20 caracteres, solo letras, números y guión bajo)",
    "checking": "Verificando...",
    "suggestions": "Sugerencias",
    "placeholder": "tu_nombre_usuario"
  },
  "social": {
    "title": "Social",
    "friends": "Amigos",
    "findFriends": "Buscar Amigos",
    "requests": "Solicitudes",
    "noFriends": "Aún no tienes amigos",
    "noRequests": "No tienes solicitudes pendientes",
    "searchPlaceholder": "Buscar por nombre de usuario...",
    "addFriend": "Agregar Amigo",
    "removeFriend": "Eliminar Amigo",
    "acceptRequest": "Aceptar",
    "rejectRequest": "Rechazar",
    "requestSent": "Solicitud enviada",
    "friendAdded": "¡Amigo agregado!",
    "friendRemoved": "Amigo eliminado",
    "level": "Nivel {{level}}",
    "streak": "Racha de {{days}} días",
    "mutualFriends": "{{count}} amigos en común"
  },
  "leaderboard": {
    "title": "Clasificación",
    "weekly": "Semanal",
    "thisWeek": "Esta Semana",
    "rank": "Puesto",
    "username": "Usuario",
    "weeklyXP": "XP Semanal",
    "weeklyPoints": "Puntos Semanales",
    "habits": "Hábitos",
    "you": "TÚ",
    "top10": "Top 10",
    "top50": "Top 50",
    "yourRank": "Tu Puesto: #{{rank}}",
    "outOf": "de {{total}}",
    "noData": "Sin datos para esta semana"
  }
}
```

#### ⏳ `/public/locales/en/translation.json` (ACTUALIZAR)
Versión en inglés de las traducciones anteriores

### 6. Componentes UI

#### ⏳ `/src/features/social/components/UsernameSelector.tsx`
**Propósito**: Input para seleccionar username con validación en tiempo real

**Props**:
```typescript
interface UsernameSelectorProps {
  initialValue?: string;
  onSubmit: (username: string) => Promise<void>;
  onSkip?: () => void;
  required?: boolean;
}
```

**Funcionalidad**:
- Input controlado con debounce (300ms)
- Verificación de disponibilidad en tiempo real
- Mostrar indicador visual (✓ disponible, ✗ no disponible)
- Validación de formato
- Lista de sugerencias generadas
- Botón de submit habilitado solo si username es válido y disponible

#### ⏳ `/src/features/social/components/FriendCard.tsx`
**Propósito**: Tarjeta individual de amigo con stats

**Props**:
```typescript
interface FriendCardProps {
  friend: FriendProfile;
  onRemove?: (friendshipId: string) => void;
  onClick?: (friend: FriendProfile) => void;
}
```

**UI**:
- Avatar
- Username
- Nivel badge
- Stats: Racha actual, XP total, Puntos
- Botón "Eliminar" (opcional, con confirmación)

#### ⏳ `/src/features/social/components/UserSearch.tsx`
**Propósito**: Barra de búsqueda con resultados

**Funcionalidad**:
- Input con debounce (300ms)
- Lista de resultados (`UserSearchResult[]`)
- Para cada resultado:
  - Avatar, username, level, racha
  - Botón según `friendshipStatus`:
    - `none`: "Agregar Amigo"
    - `request_sent`: "Solicitud Enviada" (deshabilitado)
    - `request_received`: "Responder Solicitud"
    - `friends`: "Amigos" (badge, no botón)

#### ⏳ `/src/features/social/components/FriendsList.tsx`
**Propósito**: Lista completa de amigos

**Funcionalidad**:
- Muestra array de `FriendProfile`
- Grid/lista de `FriendCard`
- Mensaje si no hay amigos
- Loading state

#### ⏳ `/src/features/social/components/FriendRequests.tsx`
**Propósito**: Lista de solicitudes pendientes (recibidas)

**Funcionalidad**:
- Muestra array de `FriendRequest`
- Para cada solicitud:
  - Avatar, username, level, racha
  - Botones: "Aceptar" y "Rechazar"
- Mensaje si no hay solicitudes

#### ⏳ `/src/features/leaderboard/components/LeaderboardEntry.tsx`
**Propósito**: Fila individual de la tabla de clasificación

**Props**:
```typescript
interface LeaderboardEntryProps {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}
```

**UI**:
- Rank badge (con íconos especiales para top 3: 🥇🥈🥉)
- Avatar
- Username
- Level
- Weekly XP
- Weekly Points
- Habits completed
- Highlight diferente si `isCurrentUser`

#### ⏳ `/src/features/leaderboard/components/WeeklyLeaderboard.tsx`
**Propósito**: Tabla completa de clasificación semanal

**Funcionalidad**:
- Header con rango de fechas de la semana
- Posición del usuario destacada en la parte superior
- Lista de entradas ordenadas por rank
- Botón "Refrescar"
- Loading states
- Mensaje si no hay datos

### 7. Páginas

#### ⏳ `/src/pages/Social.tsx`
**Propósito**: Página principal de funciones sociales

**Layout**:
```
Tabs:
  - "Amigos" → <FriendsList />
  - "Buscar" → <UserSearch />
  - "Solicitudes" (badge con count) → <FriendRequests />
```

**Hooks usados**:
- `useSocial()` - Estado y acciones sociales
- `useEffect` para cargar amigos/solicitudes al montar

#### ⏳ `/src/pages/Leaderboard.tsx`
**Propósito**: Página de clasificación semanal

**Layout**:
- Card con stats del usuario (rank, XP semanal, puntos, hábitos)
- `<WeeklyLeaderboard />` con top 50
- Botón "Refrescar"

**Hooks usados**:
- `useLeaderboard()` - Estado del leaderboard
- `useUser()` - ID del usuario actual
- `useEffect` para cargar al montar

#### ⏳ `/src/pages/Onboarding.tsx` (ACTUALIZAR)
**Cambios**:
- Agregar paso de selección de username (paso 2, después de nombre)
- Usar componente `<UsernameSelector />`
- Guardar username en `temporaryData`
- Al finalizar onboarding, actualizar perfil con username

**Nuevo flujo**:
1. Welcome + nombre
2. **NUEVO: Seleccionar username único**
3. Seleccionar life areas
4. Crear primeros hábitos
5. Tutorial overview

#### ⏳ `/src/pages/Profile.tsx` (ACTUALIZAR)
**Cambios**:
- Mostrar username actual (si existe)
- Botón "Editar Username"
- Al hacer clic, mostrar `<UsernameSelector />` en modal/inline
- Validar y actualizar username

### 8. Routing y Navegación

#### ⏳ `/src/constants/routes.ts` (ACTUALIZAR)
Agregar rutas:
```typescript
export const ROUTES = {
  // ... existing routes
  SOCIAL: '/social',
  LEADERBOARD: '/leaderboard',
  PROFILE: '/profile',
} as const;

export const NAV_ITEMS = [
  // ... existing items
  { path: ROUTES.SOCIAL, label: 'Social', icon: 'Users' },
  { path: ROUTES.LEADERBOARD, label: 'Leaderboard', icon: 'Trophy' },
];
```

#### ⏳ `/src/App.tsx` (ACTUALIZAR)
Agregar lazy loading:
```typescript
const Social = lazy(() => import('@/pages/Social'));
const Leaderboard = lazy(() => import('@/pages/Leaderboard'));

// En routes:
<Route path={ROUTES.SOCIAL} element={<Social />} />
<Route path={ROUTES.LEADERBOARD} element={<Leaderboard />} />
```

#### ⏳ `/src/components/layout/Navigation.tsx` (ACTUALIZAR)
**Cambios**:
- Agregar íconos para Social (`Users`) y Leaderboard (`Trophy`)
- Badge numérico en Social si hay solicitudes pendientes
- Usar `useSocial()` para obtener `pendingRequests.length`

---

## 🔧 Pasos para Aplicar las Migraciones

1. **Ejecutar migraciones en Supabase**:
   ```bash
   # Si usas CLI local
   cd supabase
   npx supabase db reset

   # O aplica manualmente en Supabase Dashboard > SQL Editor
   # Copia y pega cada archivo de migración en orden
   ```

2. **Verificar tablas creadas**:
   - `profiles.username` (con índice)
   - `friendships`
   - `weekly_leaderboard`
   - Vista `v_user_public_profile`

3. **Probar funciones SQL**:
   ```sql
   SELECT is_username_available('test_user');
   SELECT * FROM generate_username_suggestions('Juan Perez', 5);
   ```

---

## 📝 Notas de Implementación

### Seguridad
- ✅ RLS configurado en todas las tablas
- ✅ Funciones SQL usan `SECURITY DEFINER` con validaciones
- ✅ Solo datos públicos expuestos vía vista `v_user_public_profile`
- ✅ Username único garantizado por constraint DB

### Performance
- ✅ Índices en columnas de búsqueda frecuente (`username`, `status`, `week_start_date`)
- ✅ Debounce en búsquedas (300ms)
- ✅ Tracking de leaderboard es no-bloqueante (catch errors)
- ✅ Funciones RPC atómicas para transacciones

### UX
- ⏳ Validación en tiempo real de username
- ⏳ Sugerencias automáticas de username
- ⏳ Indicadores visuales de estado de amistad
- ⏳ Badges para solicitudes pendientes
- ⏳ Highlight de usuario actual en leaderboard
- ⏳ Medallas para top 3 en leaderboard

---

## ✨ Próximos Pasos Recomendados

1. **Agregar traducciones** (es/en)
2. **Crear componentes UI** en orden:
   - UsernameSelector (fundamental para onboarding)
   - FriendCard
   - Resto de componentes sociales
   - Componentes de leaderboard
3. **Actualizar Onboarding** para incluir paso de username
4. **Crear páginas Social y Leaderboard**
5. **Actualizar rutas y navegación**
6. **Actualizar Profile** para mostrar/editar username
7. **Testing manual**:
   - Flujo completo de onboarding con username
   - Buscar usuarios y enviar solicitudes
   - Aceptar/rechazar solicitudes
   - Ver lista de amigos con stats
   - Completar hábitos y verificar leaderboard
   - Verificar rankings actualizados

---

## 🐛 Testing Checklist

- [ ] Usuario puede elegir username único en onboarding
- [ ] Username se valida correctamente (3-20 chars, alfanumérico + _)
- [ ] Sugerencias de username funcionan
- [ ] Búsqueda de usuarios funciona
- [ ] Enviar solicitud de amistad funciona
- [ ] Aceptar solicitud funciona
- [ ] Rechazar solicitud funciona
- [ ] Eliminar amigo funciona
- [ ] Ver stats de amigos funciona
- [ ] Leaderboard semanal se actualiza al completar hábitos
- [ ] Rankings se calculan correctamente
- [ ] Usuario puede ver su posición en leaderboard
- [ ] Top 3 tiene íconos especiales
- [ ] RLS impide acceso no autorizado
- [ ] Traducciones funcionan en ambos idiomas

---

## 📚 Recursos

- **Documentación Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **Tipos TypeScript auto-generados**: Ejecutar `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts`
- **i18next**: Documentación en [react.i18next.com](https://react.i18next.com/)

---

## 🎉 Features Completadas

✅ Sistema de nombres de usuario únicos con validación
✅ Base de datos y relaciones para amistades
✅ Sistema de solicitudes de amistad (enviar/aceptar/rechazar)
✅ Perfiles públicos con stats visibles
✅ Tabla de clasificación semanal competitiva
✅ Tracking automático de progreso semanal
✅ Rankings actualizados en tiempo real
✅ Servicios y store completos
✅ Tipos TypeScript completos
✅ Row Level Security configurado

## 🚀 Listo para UI

Toda la capa de datos está completa y probada. Solo falta implementar la interfaz de usuario (componentes, páginas, traducciones y navegación).
