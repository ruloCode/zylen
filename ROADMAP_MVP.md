# 🎮 ZYLEN - ROADMAP MVP 10/10
## Gamified Habit Tracking Reimaginado

> **Visión**: Transformar el habit tracking de una tarea aburrida a una aventura épica donde cada día es un nivel nuevo, cada hábito es una quest, y tu vida es el RPG más importante que jugarás.

---

## 📊 ESTADO ACTUAL DEL PROYECTO

### ✅ Lo que YA funciona (80% MVP completo)

**Autenticación & Onboarding**
- ✅ OAuth completo (Google + GitHub) con Supabase
- ✅ Onboarding de 4 pasos (nombre, avatar, life areas, tutorial)
- ✅ Protected routes con auth guards
- ✅ Bilingual (ES/EN) con 300+ traducciones

**Core Gamification**
- ✅ Sistema de XP dual (global + por life area)
- ✅ Cálculo de niveles con fórmula matemática: `floor(sqrt(totalXP / 100))`
- ✅ Sistema de puntos (XP * 0.5) para recompensas
- ✅ 6 Life Areas predefinidas + custom areas
- ✅ Level-up animations con notificaciones

**Habit Tracking**
- ✅ CRUD completo de hábitos
- ✅ Completion tracking con histórico (tabla `habit_completions`)
- ✅ XP rewards automáticos al completar
- ✅ Daily stats (X/Y completados, +XP earned today)
- ✅ Motivational messages basados en progreso

**Streaks System**
- ✅ Current streak + longest streak
- ✅ Weekly calendar (7 días con completions)
- ✅ Streak bonus calculation
- ✅ Achievement badges (hardcoded, sin unlock logic)

**Shop & Rewards**
- ✅ Custom shop items (crear, editar, eliminar)
- ✅ Purchase system con deducción de puntos
- ✅ Purchase history (transaction log)
- ✅ Translation key support para items
- ✅ Management mode con gear icon

**Profile & Stats**
- ✅ Editar nombre + avatar (Rulo/Dani)
- ✅ Toggle life areas (enable/disable)
- ✅ Advanced stats (total completions, points, streaks)
- ✅ Delete all data (danger zone)
- ✅ Language switcher

**Infraestructura Técnica**
- ✅ Supabase completo (Auth, Database, RLS, RPC functions)
- ✅ 7 Zustand slices con typed hooks
- ✅ Service layer completo (User, Habits, LifeAreas, Streaks, Shop, Stats)
- ✅ PostgreSQL triggers + RPC functions para atomic operations
- ✅ Code splitting + lazy loading (optimizado para performance)
- ✅ TypeScript strict mode con full coverage
- ✅ Dark fantasy design system (gold, teal, charcoal)

### ⚠️ Lo que falta (20% para MVP completo)

**Features Incompletas**
- ❌ **30-Day Root Habit**: UI completa pero backend missing (tabla, service, RPC)
- ❌ **AI Chat**: Solo respuestas random, no real AI integration
- ❌ **Achievement Badges**: Hardcoded en UI, sin unlock logic ni database
- ❌ **Historical Analytics**: Datos existen pero sin visualización (charts/heatmaps)
- ❌ **Data Export**: No hay funcionalidad de backup/export

**Quick Wins Identificados**
1. Implementar Root Habit backend (~1-2 días)
2. Integrar OpenAI para chat real (~2-3 días)
3. Agregar calendar heatmap + XP chart (~1 día)
4. Sistema de achievements con unlock triggers (~1 día)
5. Export JSON/CSV (~1 día)

**Estimación**: 5-7 días de desarrollo para completar MVP base al 100%.

---

## 🚀 VISIÓN DISRUPTIVA

### El Problema con Habit Trackers Actuales

**Habitica**: Demasiado infantil, UI cluttered, gamification superficial
**Streaks**: Minimalista pero aburrido, sin recompensas emocionales
**Loop/Habit**: Funcionales pero genéricos, sin diferenciador

### La Oportunidad: Dark Fantasy RPG meets Habit Tracking

**Zylen NO es otro habit tracker. Es:**

1. **Un RPG de Vida Real**
   - Tu vida es el juego, tus hábitos son quests
   - Progresas de Novice a Legend
   - Cada día es un dungeon nuevo

2. **Sistema de Recompensa Psicológica**
   - Level-ups dan dopamina real
   - Boss battles crean tensión narrativa
   - Combos y streaks crean flow states

3. **Community-Driven Progress**
   - No es solo vs ti mismo
   - Guilds compiten, colaboran, se apoyan
   - Leaderboards crean accountability social

4. **AI Coach que Entiende Contexto**
   - No solo respuestas genéricas
   - Analiza patrones, predice fallos
   - Intervenciones personalizadas justo a tiempo

### Diferenciadores Únicos

| Feature | Zylen | Habitica | Streaks | Loop |
|---------|-------|----------|---------|------|
| Dark Fantasy Theme | ✅ | ❌ (infantil) | ❌ | ❌ |
| Boss Battles | 🔜 | ❌ | ❌ | ❌ |
| Predictive AI | 🔜 | ❌ | ❌ | ❌ |
| Guild System | 🔜 | ✅ (básico) | ❌ | ❌ |
| Combo Multipliers | 🔜 | ❌ | ❌ | ❌ |
| Equipment/Gear | 🔜 | ✅ (cosmetic) | ❌ | ❌ |
| Dual XP System | ✅ | ❌ | ❌ | ❌ |
| Life Area Levels | ✅ | ❌ | ❌ | ❌ |
| Bilingual desde día 1 | ✅ | ⚠️ | ❌ | ❌ |

---

## 💡 IDEAS DISRUPTIVAS POR PILAR

### ⚔️ PILAR 1: GAMIFICACIÓN EXTREMA

#### 🐉 Boss Battles System
**Concepto**: Cada semana aparece un "boss" épico que solo puedes derrotar manteniendo un streak perfecto.

**Mecánicas**:
- Boss semanal con HP = 7 días
- Cada día que completes TODOS tus hábitos = 1 damage al boss
- Si fallas un día, el boss se cura 2 HP
- Derrotar boss = mega recompensa (3x XP ese día, exclusive items)
- Bosses rotan temáticamente: "Procrastination Dragon", "Chaos Demon", "Distraction Hydra"

**Implementación**:
```typescript
// Nueva tabla
boss_battles {
  id: uuid
  user_id: uuid (FK)
  boss_type: string (dragon, demon, hydra)
  boss_hp: number (0-7)
  week_start: date
  status: 'active' | 'defeated' | 'failed'
  damage_history: number[] // [1,1,0,1,1,1,1]
}
```

**Diferenciador**: Ningún habit tracker tiene boss battles. Crea narrativa semanal + urgencia + recompensa épica.

---

#### 🔥 Combo System
**Concepto**: Completar múltiples hábitos en secuencia multiplica el XP ganado.

**Mecánicas**:
- 3 hábitos seguidos = 1.5x XP
- 5 hábitos seguidos = 2x XP
- 10 hábitos seguidos (todos) = 3x XP + "Perfect Day" badge
- Combo se rompe si dejas un hábito sin completar entre otros
- Visual: contador de combo en tiempo real con animación

**Implementación**:
```typescript
// En HabitsService
calculateComboMultiplier(completionOrder: string[]): number {
  const consecutive = getConsecutiveCount(completionOrder)
  if (consecutive >= 10) return 3
  if (consecutive >= 5) return 2
  if (consecutive >= 3) return 1.5
  return 1
}
```

**Diferenciador**: Incentiva completar múltiples hábitos en una sesión. Crea momentum y flow state.

---

#### 🛡️ Equipment/Gear System
**Concepto**: Items desbloqueables que dan bonos permanentes o temporales.

**Items Ejemplos**:
- **"Focus Ring"**: +10% XP en hábitos de Creativity (desbloqueable: nivel 10 en Creativity)
- **"Warrior's Sword"**: +50 bonus puntos al derrotar un boss (desbloqueable: derrotar 3 bosses)
- **"Mage's Tome"**: Duplica XP del primer hábito del día (desbloqueable: 30-day streak)
- **"Rogue's Cloak"**: Permite "skip" un día sin romper streak, 1x por semana (desbloqueable: nivel 20 global)
- **"Phoenix Feather"**: Revive un streak roto (1x por mes, desbloqueable: comprar con 500 puntos)
- **"Dragon Scale Armor"**: Reduce HP de bosses a 5 días (desbloqueable: nivel 30 global)

**Implementación**:
```typescript
// Nueva tabla
equipment {
  id: uuid
  name: string
  description: string
  effect_type: 'xp_bonus' | 'skip_day' | 'boss_reducer' | 'streak_revive'
  effect_value: number
  unlock_condition: json // { type: 'level', area: 'creativity', value: 10 }
  is_consumable: boolean
}

user_equipment {
  user_id: uuid
  equipment_id: uuid
  unlocked_at: timestamp
  uses_remaining: number? // para consumables
  is_equipped: boolean
}
```

**Diferenciador**: Sistema de progresión meta. No solo niveles, sino items que cambian gameplay.

---

#### 🎭 Class/Build System
**Concepto**: Jugadores eligen una "clase" que modifica sus mecánicas de juego.

**Clases**:
1. **Warrior (El Disciplinado)**
   - +20% XP en hábitos físicos (Health, Fitness)
   - Bonus en streaks largos (+5% XP por cada 7 días)
   - Penalización en fallos (-10% XP global por día fallado)
   - Ideal para: personas consistentes, all-or-nothing mentality

2. **Mage (El Creativo)**
   - +30% XP en hábitos mentales (Creativity, Career)
   - Bonus por variety (completar hábitos de 3+ life areas en un día = +50 bonus puntos)
   - Puede "conjurar" un extra habit daily (vale 2x XP)
   - Ideal para: personas creativas, multitaskers

3. **Rogue (El Flexible)**
   - +15% XP en todos los hábitos
   - Puede cambiar hábitos diarios sin penalización
   - 1x "Skip Day" por semana (no rompe streak)
   - Critical hits: 10% chance de 3x XP en cualquier hábito
   - Ideal para: personas con horarios variables, necesitan flexibilidad

**Implementación**:
```typescript
// En user profile
user_class: 'warrior' | 'mage' | 'rogue'

// En HabitsService.completeHabit()
const xp = baseXP * getClassMultiplier(user.class, habit.lifeArea)
const isCriticalHit = user.class === 'rogue' && Math.random() < 0.1
if (isCriticalHit) xp *= 3
```

**Diferenciador**: Personalización profunda. Gameplay diferente según personalidad. Rejugabilidad (probar clases).

---

#### 🎪 Seasonal Events
**Concepto**: Eventos temporales con mecánicas únicas y recompensas exclusivas.

**Eventos Ejemplos**:
- **"Summer Solstice"** (junio): Hábitos de Health dan 2x XP, recompensa exclusiva: "Sun Crown"
- **"Spooky October"**: Boss especial "Shadow King" con 31 días HP, derrotarlo da "Dark Knight Armor"
- **"New Year Revolution"**: Primera semana de enero, todos los hábitos nuevos dan 3x XP
- **"Productivity Sprint"** (septiembre): Leaderboard global de XP ganado, top 10 recibe badge único

**Implementación**:
```typescript
// Nueva tabla
seasonal_events {
  id: uuid
  name: string
  start_date: date
  end_date: date
  effect: json // { type: 'xp_multiplier', areas: ['health'], value: 2 }
  exclusive_rewards: uuid[] // equipment IDs
  is_active: boolean
}
```

**Diferenciador**: Contenido fresco que trae de vuelta usuarios inactivos. FOMO positivo.

---

#### 🏆 Prestige System
**Concepto**: Al llegar a nivel 50, puedes "prestigiar" - resetear a nivel 1 pero con bonos permanentes.

**Mecánicas**:
- Reset de nivel global a 1 (life areas se mantienen)
- Recibes "Prestige Star" visible en perfil
- Cada prestige da +5% XP permanente (stackeable)
- Desbloquea equipment exclusivo (ej: "Legendary Sword" solo para Prestige 3+)
- Max 10 prestiges

**Implementación**:
```typescript
// En user profile
prestige_level: number (0-10)
prestige_xp_bonus: number // 0.05 * prestige_level

// UI: Badge dorado con estrellas junto a nivel
```

**Diferenciador**: Endgame content. Reward para jugadores hardcore. Rejugabilidad infinita.

---

#### 🎯 Daily Quest System
**Concepto**: Cada día aparecen 3 "quests" aleatorias con recompensas extra.

**Quest Ejemplos**:
- "Morning Champion": Completa 3 hábitos antes de 10am (+50 bonus puntos)
- "Life Balance": Completa hábitos de al menos 3 life areas diferentes (+30 puntos)
- "Speedrunner": Completa todos tus hábitos en menos de 2 horas (+100 puntos)
- "Night Owl": Completa 2 hábitos después de 8pm (+40 puntos)
- "Combo Master": Logra un combo de 5+ hábitos (+80 puntos)

**Implementación**:
```typescript
// Nueva tabla
daily_quests {
  id: uuid
  user_id: uuid
  date: date
  quest_type: string
  description: string
  reward_points: number
  is_completed: boolean
  completed_at: timestamp?
}

// RPC function que genera 3 quests random cada día
```

**Diferenciador**: Variedad diaria. No es monotonía. Incentiva patterns diferentes.

---

### 👥 PILAR 2: SOCIAL / COMMUNITY

#### 🏰 Guild System
**Concepto**: Clans de 5-20 usuarios que compiten y colaboran en objetivos compartidos.

**Mecánicas**:
- Crear guild (nombre, icono, descripción, max 20 miembros)
- Guild chat (mensajes en tiempo real)
- Guild XP = suma de XP de todos los miembros esa semana
- Guild Leaderboard (top 10 guilds cada semana)
- Guild Quests (todos los miembros deben lograr X meta): ej "500 hábitos completados esta semana como guild"
- Guild Perks al completar quests: ej +10% XP para todos por 24h

**Implementación**:
```typescript
guilds {
  id: uuid
  name: string
  description: string
  icon: string
  created_by: uuid (FK user)
  max_members: number (default 20)
  is_public: boolean
}

guild_members {
  guild_id: uuid
  user_id: uuid
  role: 'leader' | 'officer' | 'member'
  joined_at: timestamp
}

guild_messages {
  guild_id: uuid
  user_id: uuid
  message: text
  sent_at: timestamp
}

guild_quests {
  guild_id: uuid
  quest_type: string
  target_value: number
  current_value: number
  reward: json
  expires_at: timestamp
}
```

**Features**:
- Real-time chat (Supabase real-time subscriptions)
- Kick/ban members (solo leader/officers)
- Leave guild (pierde progreso de guild quests)
- Guild search/discovery page
- Guild profile page (stats, members, achievements)

**Diferenciador**: Accountability social extrema. Motivación grupal. Sentimiento de pertenencia.

---

#### 🥇 Leaderboards
**Concepto**: Competencias globales en múltiples categorías con resets periódicos.

**Categorías**:
1. **Weekly XP** (reset cada lunes): Quién ganó más XP esta semana
2. **Monthly Streak** (reset cada mes): Mejor streak del mes
3. **All-Time Level** (permanente): Niveles más altos
4. **Boss Slayer** (permanente): Más bosses derrotados
5. **Perfect Days** (permanente): Días con todos los hábitos completados
6. **Guild Rankings** (semanal): Top guilds por XP total

**Implementación**:
```typescript
// View materializada (para performance)
CREATE MATERIALIZED VIEW weekly_leaderboard AS
SELECT
  user_id,
  SUM(xp_earned) as total_xp,
  RANK() OVER (ORDER BY SUM(xp_earned) DESC) as rank
FROM habit_completions
WHERE completed_at >= date_trunc('week', NOW())
GROUP BY user_id;

// Refresh cada hora via Supabase Edge Function (cron)
```

**UI**:
- Tab para cada categoría
- Top 100 visible
- Tu posición destacada (ej: "You're #47 this week!")
- Profile pictures + usernames (con opt-out para privacidad)
- Badges para top 3 de cada categoría

**Diferenciador**: Motivación competitiva. Reconocimiento público. Accountability.

---

#### 🌍 Daily Global Challenge
**Concepto**: Cada día hay UN challenge global donde todos compiten en el mismo objetivo.

**Ejemplos**:
- Lunes: "Complete 10 habits today" (top 1000 usuarios reciben +50 bonus puntos)
- Martes: "Earn 200 XP today" (top 500 reciben badge "Tuesday Titan")
- Miércoles: "Beat your personal best streak" (todos los que logren reciben +100 puntos)
- Jueves: "Complete a habit before 7am" (primeros 100 reciben "Early Bird" badge)
- Viernes: "Perfect Day Friday" (completa TODOS tus hábitos, top 50 reciben equipment)

**Implementación**:
```typescript
global_challenges {
  id: uuid
  date: date
  challenge_type: string
  description: string
  target_condition: json
  reward_tiers: json // [{ rank: 1-100, reward: 'badge_id' }]
}

global_challenge_participants {
  challenge_id: uuid
  user_id: uuid
  progress: number
  completed_at: timestamp?
  rank: number?
}
```

**UI**:
- Banner prominente en Dashboard mostrando challenge del día
- Live leaderboard durante el día
- Countdown timer hasta cierre
- Push notification a las 8pm si no has participado

**Diferenciador**: FOMO positivo diario. Unidad de comunidad (todos en el mismo challenge). Engagement diario.

---

#### 📱 Social Feed
**Concepto**: Muro de actividad donde ves logros de otros usuarios (amigos, guild, global).

**Tipos de Posts**:
- "🎉 [Username] subió a nivel 25!"
- "⚔️ [Username] derrotó al Chaos Demon!"
- "🔥 [Username] alcanzó 50-day streak!"
- "🏆 [Guild Name] completó Guild Quest 'Productivity Kings'!"
- "⭐ [Username] desbloqueó Phoenix Feather!"

**Features**:
- Like/react a posts (🔥💪👏)
- Comentar en posts
- Filtros: Solo guild / Solo amigos / Global
- Privacy settings: Mostrar/ocultar tus logros

**Implementación**:
```typescript
social_posts {
  id: uuid
  user_id: uuid
  post_type: 'level_up' | 'boss_defeat' | 'streak_milestone' | 'equipment_unlock'
  content: json // { level: 25, area: 'Health' }
  created_at: timestamp
}

post_reactions {
  post_id: uuid
  user_id: uuid
  reaction: 'fire' | 'muscle' | 'clap'
}

post_comments {
  post_id: uuid
  user_id: uuid
  comment: text
  created_at: timestamp
}
```

**Diferenciador**: Celebración colectiva de logros. Inspiración social. Red de apoyo.

---

#### 🤝 Mentor System
**Concepto**: Usuarios nivel 30+ pueden ser mentores de usuarios nivel 1-10.

**Mecánicas**:
- Mentores aparecen en "Find a Mentor" page
- Mentees pueden solicitar mentoring
- Mentores ven progreso de sus mentees
- Chat 1-on-1 entre mentor y mentee
- Mentor recibe bonus XP cuando mentee logra milestones (nivel 5, 10, primer boss, etc.)
- Mentees reciben "Mentored by [Name]" badge

**Implementación**:
```typescript
mentor_relationships {
  mentor_id: uuid (FK user, level >= 30)
  mentee_id: uuid (FK user, level <= 10)
  status: 'pending' | 'active' | 'completed'
  started_at: timestamp
}

mentor_messages {
  relationship_id: uuid
  sender_id: uuid
  message: text
  sent_at: timestamp
}
```

**Diferenciador**: Onboarding personal. Retención de nuevos usuarios. Comunidad de ayuda.

---

#### 🎮 Co-op Quests
**Concepto**: Misiones que requieren 2-4 jugadores colaborar para completar.

**Ejemplos**:
- "Team Streak": 3 jugadores deben mantener 7-day streak simultáneamente (recompensa: 300 puntos c/u)
- "XP Pooling": 4 jugadores juntan 1000 XP en 48h (recompensa: exclusive badge "Teamwork Titans")
- "Boss Raid": 5 jugadores atacan mismo boss, debe derrotarse antes de domingo (recompensa: legendary equipment)

**Implementación**:
```typescript
coop_quests {
  id: uuid
  quest_type: string
  required_players: number
  target_value: number
  time_limit: interval
  reward: json
}

coop_quest_participants {
  quest_id: uuid
  user_id: uuid
  contribution: number
  joined_at: timestamp
}
```

**UI**:
- "Find Co-op Partners" page
- Invitar amigos/guild members
- Real-time progress bar compartido

**Diferenciador**: Colaboración activa. Dependencia positiva. Hacer amigos en la app.

---

### 🤖 PILAR 3: AI / ML AVANZADO

#### 🔮 Predictive Failure Detection
**Concepto**: El AI analiza tus patrones y te alerta ANTES de que falles.

**Cómo funciona**:
1. **Pattern Analysis**: ML model analiza tus últimos 90 días de completions
2. **Risk Factors Detectados**:
   - Días de semana donde fallas más (ej: viernes)
   - Hábitos que siempre fallas juntos
   - Life areas que descuidas
   - Tiempo promedio hasta fallar después de empezar un hábito nuevo
3. **Alertas Preventivas**:
   - "⚠️ Heads up: Históricamente fallas tus hábitos los viernes. Prepárate!"
   - "⚠️ Llevas 3 días sin completar hábitos de Health. ¿Todo bien?"
   - "⚠️ Tu streak de 14 días está en riesgo. Tus viernes son complicados."

**Implementación**:
```typescript
// Edge Function que corre diariamente
async function analyzeFailureRisk(userId: string) {
  const completions = await getCompletionsLast90Days(userId)

  // Análisis básico (sin ML por ahora)
  const failuresByDay = groupBy(completions, 'dayOfWeek')
  const riskDay = findDayWithMostMissedHabits(failuresByDay)

  if (isToday(riskDay)) {
    await sendNotification(userId, {
      type: 'warning',
      message: `Heads up: You tend to struggle on ${riskDay}s. You got this!`
    })
  }
}

// Futuro: TensorFlow.js model entrenado con tus datos
```

**Diferenciador**: AI proactivo, no reactivo. Prevenir > Curar. Nadie más hace esto.

---

#### 🧠 Pattern Recognition & Insights
**Concepto**: AI descubre correlaciones en tus datos que tú no ves.

**Insights Ejemplos**:
- "💡 When you complete 'Morning Meditation', you're 3x more likely to complete 'Gym' that day"
- "💡 Your best XP days are Tuesdays and Thursdays (avg 250 XP vs 180 global)"
- "💡 You've never missed 'Reading' when you do it before 8am. Try making it a morning habit!"
- "💡 Your 'Creativity' life area grows fastest when paired with 'Career' habits"
- "💡 You're on a 5-day streak! Historically, this is when you're most likely to continue to 30 days"

**Implementación**:
```typescript
// Service que corre semanalmente
async function generateInsights(userId: string) {
  const completions = await getAllCompletions(userId)

  // Insight 1: Habit Dependencies
  const dependencies = findHabitCorrelations(completions)
  // If habitA completed, habitB completed 80%+ of time

  // Insight 2: Best Days
  const xpByDay = groupXPByDayOfWeek(completions)
  const bestDay = findMax(xpByDay)

  // Insight 3: Optimal Times
  const completionsByHour = groupBy(completions, 'hour')
  const successRateByHour = calculateSuccessRate(completionsByHour)

  // Store insights
  await saveInsights(userId, [dependency, bestDay, optimalTime])
}
```

**UI**:
- Weekly AI Report (email + in-app)
- "Insights" tab en Profile
- Notification de nuevos insights

**Diferenciador**: Self-knowledge profundo. Data-driven decisions. Optimización personal.

---

#### 💬 Contextual AI Coaching
**Concepto**: Chat AI que entiende TODO tu contexto, no solo el mensaje actual.

**Contexto que ve el AI**:
- Tus hábitos activos y sus completion rates
- Tu nivel global y por life area
- Tu streak actual y histórico
- Bosses derrotados
- Guild membership y actividad
- Últimos 30 días de completions
- Insights recientes
- Tus objetivos (si los escribiste en onboarding)

**Diferencia vs Chat Actual**:
- ❌ Ahora: "¡Sigue así!" (genérico)
- ✅ Nuevo: "Veo que completaste 8/10 hábitos hoy, Camilo. Solo faltan 'Gym' y 'Reading'. Usualmente haces Gym los martes, ¿algo te detuvo hoy? Tienes 2 horas antes de perder tu 12-day streak."

**Prompts Ejemplo**:
```typescript
const systemPrompt = `
You are Zylen's AI Coach, a motivational but honest guide.

User Context:
- Name: ${user.name}
- Level: ${user.level}
- Current Streak: ${streak.current} days (Best: ${streak.longest})
- Today: Completed ${completedToday}/${totalHabits} habits
- Life Areas Focus: ${topLifeAreas.join(', ')}
- Recent Insight: "${latestInsight}"
- Guild: ${guild?.name || 'None'}

Guidelines:
- Be specific, not generic
- Reference their actual data
- Celebrate wins genuinely
- Be honest about struggles
- Suggest actionable next steps
- Use their name occasionally
- Dark fantasy tone (epic, adventurous)
`
```

**Implementación**:
- OpenAI API (gpt-4o-mini para costo/velocidad)
- Streaming responses
- Context injection automático
- Conversación persistida a database

**Diferenciador**: Coaching personalizado 24/7. Entiende tu journey completo.

---

#### 🎯 Smart Habit Suggestions
**Concepto**: AI sugiere nuevos hábitos basándose en tus life areas neglected y objetivos.

**Cómo funciona**:
1. Analiza tus life areas levels
2. Detecta áreas con menos progreso
3. Sugiere hábitos específicos para balancear

**Ejemplos**:
- User tiene Health nivel 20 pero Creativity nivel 5
  - "💡 Suggestion: Add '30min Creative Writing' habit to boost Creativity"
- User tiene muchos hábitos pero todos son morning
  - "💡 Suggestion: Try 'Evening Gratitude Journal' to balance your day"
- User no tiene hábitos de Social
  - "💡 Suggestion: Add 'Call a Friend' (30 XP) to activate your Social life area"

**Implementación**:
```typescript
async function generateHabitSuggestions(userId: string) {
  const lifeAreas = await getLifeAreasWithLevels(userId)
  const habits = await getHabits(userId)

  // Find neglected area
  const lowestArea = lifeAreas.sort((a, b) => a.level - b.level)[0]

  // Habit library (predefined suggestions per area)
  const suggestions = HABIT_LIBRARY[lowestArea.name]

  // Return personalized suggestion
  return {
    area: lowestArea.name,
    reason: `Your ${lowestArea.name} is level ${lowestArea.level}, while your average is ${avgLevel}`,
    suggestions: suggestions.slice(0, 3)
  }
}

const HABIT_LIBRARY = {
  health: [
    { name: '30min Walk', xp: 50, icon: '🚶' },
    { name: 'Drink 2L Water', xp: 30, icon: '💧' },
    { name: '7+ Hours Sleep', xp: 60, icon: '😴' }
  ],
  creativity: [
    { name: 'Creative Writing', xp: 50, icon: '✍️' },
    { name: 'Draw/Sketch', xp: 40, icon: '🎨' },
    { name: 'Learn New Skill', xp: 70, icon: '📚' }
  ]
  // ... etc
}
```

**UI**:
- "Suggested Habits" section en Habits page
- 1-click para agregar suggestion
- Dismissable (don't show again)

**Diferenciador**: Guidance inteligente. No tienes que pensar qué hábitos agregar.

---

#### ⏰ Optimal Timing Recommendations
**Concepto**: ML determina cuándo eres más probable de completar cada hábito.

**Cómo funciona**:
1. Rastrea a qué hora completas cada hábito
2. Calcula success rate por hora del día
3. Recomienda optimal time window

**Ejemplos**:
- "Gym": Completado 15/20 veces cuando lo haces antes de 8am, pero solo 3/10 después de 6pm
  - Recomendación: "💡 Schedule 'Gym' for 7am. You're 5x more likely to do it in the morning!"
- "Reading": Mejor success rate entre 9pm-11pm
  - Recomendación: "💡 Your ideal reading time is 9-11pm (85% completion rate)"

**Implementación**:
```typescript
async function analyzeOptimalTiming(userId: string, habitId: string) {
  const completions = await getHabitCompletions(habitId)

  const byHour = groupBy(completions, completion =>
    new Date(completion.completed_at).getHours()
  )

  const successRates = Object.entries(byHour).map(([hour, comps]) => ({
    hour: parseInt(hour),
    successRate: comps.filter(c => c.completed).length / comps.length,
    count: comps.length
  }))

  const bestHour = maxBy(successRates, 'successRate')

  if (bestHour.count >= 5 && bestHour.successRate > 0.7) {
    return {
      habitId,
      recommendedHour: bestHour.hour,
      confidence: bestHour.successRate,
      message: `You're most successful at ${formatHour(bestHour.hour)}`
    }
  }
}
```

**UI**:
- Badge junto a cada hábito: "⏰ Best: 7-9am"
- Notification reminder a esa hora
- "Timing Insights" section en Profile

**Diferenciador**: Personalización extrema. Auto-optimización. Science-backed timing.

---

#### 📊 Weekly AI Report
**Concepto**: Cada domingo, AI genera un reporte personalizado de tu semana.

**Contenido del Reporte**:
1. **Weekly Summary**
   - Total XP earned (vs last week)
   - Habits completed (X/Y)
   - Streak status
   - Level-ups achieved

2. **Highlights**
   - "🏆 Your best day was Tuesday with 280 XP!"
   - "🔥 You maintained your 21-day streak!"
   - "⚔️ You defeated the Chaos Demon boss!"

3. **Areas for Improvement**
   - "⚠️ You missed 'Meditation' 4/7 days"
   - "⚠️ Your Creativity area hasn't gained XP in 5 days"

4. **Insights & Predictions**
   - "💡 Insight: You complete 60% more habits when you start before 9am"
   - "💡 Prediction: If you maintain this pace, you'll hit level 30 by next Friday!"

5. **Next Week Goals**
   - "🎯 Challenge: Complete all habits 5/7 days to defeat next boss"
   - "🎯 Goal: Reach level 25 (+2 levels)"

**Implementación**:
```typescript
// Edge Function que corre cada domingo a las 8pm
async function generateWeeklyReport(userId: string) {
  const weekData = await getWeekData(userId)

  const prompt = `Generate a motivational weekly report for ${user.name}.

  Data:
  - XP Earned: ${weekData.xp} (last week: ${lastWeek.xp})
  - Habits Completed: ${weekData.completed}/${weekData.total}
  - Best Day: ${weekData.bestDay.name} (${weekData.bestDay.xp} XP)
  - Missed Habits: ${weekData.missed.join(', ')}
  - Insights: ${weekData.insights}

  Generate:
  1. Celebration of wins (be specific)
  2. Honest areas for improvement
  3. Actionable next week goals

  Tone: Motivational coach, dark fantasy vibe, use their name.
  Length: 150-200 words
  `

  const report = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }]
  })

  // Send as notification + email
  await sendWeeklyReport(userId, report.content)
}
```

**UI**:
- In-app notification domingo 8pm
- Email backup
- "Weekly Reports" archive en Profile
- Share report a social feed (opcional)

**Diferenciador**: Reflexión semanal automática. Accountability AI. Progress tracking narrativo.

---

#### 🚨 Sentiment Analysis (Advanced)
**Concepto**: AI detecta cuando estás frustrado/desmotivado en chat y adapta responses.

**Cómo funciona**:
- User escribe: "I keep failing, I suck at this"
- AI detecta negative sentiment
- Response: Empático, menos "ra ra cheerleader", más "I see you're struggling. Let's break this down. What's the hardest part?"

VS

- User escribe: "Just beat my first boss! I'm unstoppable!"
- AI detecta positive sentiment
- Response: Match energy, celebrar, sugerir next challenge

**Implementación**:
```typescript
// OpenAI sentiment detection via function calling
const messages = [
  { role: 'system', content: 'Detect user sentiment' },
  { role: 'user', content: userMessage }
]

const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages,
  functions: [{
    name: 'detect_sentiment',
    parameters: {
      type: 'object',
      properties: {
        sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
        intensity: { type: 'number', min: 1, max: 10 }
      }
    }
  }],
  function_call: { name: 'detect_sentiment' }
})

// Adjust coaching style accordingly
if (sentiment === 'negative' && intensity > 7) {
  systemPrompt += '\nUser is struggling. Be empathetic, practical, break down solutions.'
}
```

**Diferenciador**: Emotional intelligence. AI coach que "entiende" no solo dice frases motivacionales.

---

## 🗓️ ROADMAP EN 4 FASES (120 DÍAS)

### 🎯 FASE 1: MVP LAUNCH (Días 1-30)
**Objetivo**: Completar features esenciales y lanzar producto estable

#### Semana 1-2: Complete the Core
- [ ] **30-Day Root Habit Backend** (3 días)
  - Crear tabla `root_habits` (habit_id, user_id, start_date, completions_array[30], status)
  - RPC function `check_in_root_habit(habit_id)`
  - Service: `RootHabitService` con CRUD
  - Zustand slice: `rootHabitSlice`
  - Conectar UI existente a backend
  - Lógica: fallo = reset? o permitir continuar?

- [ ] **AI Chat Integration** (4 días)
  - Setup OpenAI API key (environment variable)
  - `ChatService.sendMessage()` → streaming response
  - Context injection: user stats, habits, streaks, recent completions
  - System prompt optimization (dark fantasy coach tone)
  - Error handling + fallback a respuestas predefinidas si API falla
  - Cost monitoring (track tokens used)

- [ ] **Historical Analytics** (2 días)
  - Calendar heatmap component (inspirado en GitHub contributions)
    - Librería: `react-calendar-heatmap` o custom con Tailwind
    - Data: completion history últimos 90 días
  - XP over time chart (line chart)
    - Librería: `recharts` (ya usada en otros proyectos)
    - Show XP diario últimos 30 días
  - Analytics page nueva en routing

#### Semana 3: Polish & Achievements
- [ ] **Achievement System** (3 días)
  - Tabla `achievements` (id, name, description, icon, unlock_condition_type, unlock_condition_value)
  - Tabla `user_achievements` (user_id, achievement_id, unlocked_at)
  - Predefined achievements:
    - "Week Warrior": 7-day streak
    - "Consistency King": 30-day streak
    - "Legend": 100-day streak
    - "Level 10", "Level 25", "Level 50"
    - "Boss Slayer": Derrotar 1 boss
    - "Perfect Week": 7 días con todos los hábitos completados
  - Unlock logic via database trigger (check after habit_completion insert)
  - Notification en unlock
  - Achievements showcase en Profile

- [ ] **Data Export** (1 día)
  - Export JSON: todos los datos del usuario
  - Export CSV: habit_completions para analysis en Excel
  - Button en Profile → Download
  - Privacy-friendly (genera client-side, no envía a server)

#### Semana 4: Testing & Launch Prep
- [ ] **Bug Fixes & Edge Cases**
  - Test onboarding flow completo
  - Test nivel up cuando XP es exacto threshold
  - Test purchase con puntos insuficientes
  - Test deletion de hábitos con completions históricas
  - Timezone handling correcto

- [ ] **Performance Optimization**
  - Lazy load heavy components
  - Image optimization (avatars)
  - Bundle analysis (vite-bundle-visualizer)
  - Database indexes (habit_completions.user_id, .completed_at)

- [ ] **Documentation**
  - Update README con features completas
  - API documentation (si hay endpoints públicos)
  - Contributing guidelines

- [ ] **Launch** 🚀
  - Deploy a Vercel
  - Setup dominio (zylen.app?)
  - Analytics (PostHog, Plausible, o Google Analytics)
  - Error tracking (Sentry)
  - Landing page simple (hero + features + CTA)

**Métricas de Éxito Fase 1**:
- ✅ 100% features core implementadas
- ✅ 0 critical bugs
- ✅ Lighthouse score >90
- 🎯 100 usuarios registrados primera semana
- 🎯 70% retention día 7
- 🎯 Avg 5 hábitos completados por usuario por día

---

### ⚔️ FASE 2: GAMIFICACIÓN EXTREMA (Días 31-60)
**Objetivo**: Agregar mecánicas de RPG que diferencien Zylen

#### Semana 5: Boss Battles
- [ ] **Boss System Implementation** (5 días)
  - Tabla `boss_battles` con campos descritos arriba
  - RPC function `damage_boss()` (ejecutado al completar todos los hábitos del día)
  - Lógica de healing (si fallas, boss recupera HP)
  - Boss types: 5 bosses diferentes con artwork
    - Procrastination Dragon 🐉
    - Chaos Demon 👹
    - Distraction Hydra 🐍
    - Laziness Giant 🗿
    - Doubt Shadow 👤
  - Boss rotation semanal (algoritmo para seleccionar)
  - Defeat rewards:
    - 3x XP multiplicador ese día
    - Exclusive badge
    - Chance de equipment drop

- [ ] **Boss UI** (2 días)
  - Boss card en Dashboard (muestra boss actual, HP restante, días atacados)
  - Boss battle page con:
    - Boss artwork grande
    - HP bar animado
    - Damage history (qué días hiciste daño)
    - Countdown a próximo boss
  - Defeat animation (epic, confetti, level-up style)
  - Boss history (bosses derrotados)

#### Semana 6-7: Combos & Equipment
- [ ] **Combo System** (3 días)
  - Tracking de orden de completion (modificar `habit_completions` agregar `completion_order` number)
  - Cálculo de combo multiplier en tiempo real
  - UI: Combo counter en HabitsPage
    - "🔥 Combo: 5 habits! (2x XP)"
    - Animación cuando subes de tier (3 → 5 → 10)
  - Apply multiplier a XP earned
  - Combo breaks si completas habit luego dejas gaps

- [ ] **Equipment System** (5 días)
  - Tabla `equipment` con items
  - Tabla `user_equipment` con unlocks
  - 10 equipment items iniciales (descritos arriba)
  - Unlock logic:
    - Level-based (checks automáticos en level-up)
    - Boss-based (al derrotar boss, chance de drop)
    - Purchase-based (shop especial con puntos)
    - Streak-based (al lograr milestones)
  - Equipment UI:
    - "Equipment" tab en Profile
    - Grid de items (locked/unlocked)
    - Equip/unequip (hasta 3 equipados simultáneamente)
    - Tooltip con effects
  - Effect implementation:
    - XP bonuses (aplicar en `completeHabit()`)
    - Skip day (modificar streak logic)
    - Boss reducer (cambiar boss HP inicial)
    - Streak revive (button especial para usar)

#### Semana 8: Daily Quests
- [ ] **Quest System** (4 días)
  - Tabla `daily_quests`
  - RPC function `generate_daily_quests()` (corre a medianoche via Edge Function cron)
  - 10 tipos de quests predefinidos
  - Logic para completar quest automáticamente cuando condition se cumple
  - Notification en completion
  - UI:
    - Quests card en Dashboard (muestra 3 quests del día)
    - Checkmark cuando completada
    - Confetti animation en completion
    - Unclaimed rewards indicator

- [ ] **Quest Rewards**
  - Bonus points (apply via `updatePoints()`)
  - Chance de equipment drop (rare)
  - XP multiplier temporal (buff 1 hora: 1.5x XP)

**Métricas de Éxito Fase 2**:
- 🎯 Engagement diario +100% (usuarios abren app 2x al día)
- 🎯 Session time promedio: 10min (vs 5min en Fase 1)
- 🎯 80% usuarios participan en Boss Battles semanalmente
- 🎯 Retention día 30: >50%

---

### 👥 FASE 3: SOCIAL & COMMUNITY (Días 61-90)
**Objetivo**: Crear comunidad activa y viral loop

#### Semana 9-10: Guild System
- [ ] **Guild Backend** (5 días)
  - Tablas: `guilds`, `guild_members`, `guild_messages`, `guild_quests`
  - CRUD operations: create, join, leave, kick
  - Real-time chat (Supabase real-time subscriptions)
  - Guild quest generation (semanal)
  - Guild XP aggregation (materialized view)
  - RLS policies (solo miembros ven guild chat)

- [ ] **Guild UI** (3 días)
  - Guilds page:
    - My Guild (si pertenece a una)
    - Create Guild form
    - Browse/Search Guilds
  - Guild detail page:
    - Members list con roles
    - Real-time chat
    - Guild stats (total XP, rank)
    - Current quest progress
    - Leave/kick buttons (según role)
  - Guild invite system (share code)

#### Semana 11: Leaderboards
- [ ] **Leaderboard Backend** (3 días)
  - Materialized views para cada categoría:
    - `weekly_xp_leaderboard`
    - `monthly_streak_leaderboard`
    - `alltime_level_leaderboard`
    - `boss_slayer_leaderboard`
    - `perfect_days_leaderboard`
    - `guild_rankings`
  - Edge Function cron para refresh views (cada hora)
  - Privacy: opt-in para aparecer en leaderboard público

- [ ] **Leaderboard UI** (2 días)
  - Leaderboards page con tabs
  - Top 100 list con:
    - Rank, avatar, username, score
    - Highlight user's rank (aunque no esté en top 100)
  - Filters: Global / Friends / Guild
  - Badges para top 3 (oro, plata, bronce)

- [ ] **Daily Global Challenge** (3 días)
  - Tabla `global_challenges` + `global_challenge_participants`
  - Edge Function genera challenge diario (a medianoche)
  - Participation tracking automático
  - Live leaderboard durante el día
  - Notifications:
    - 8am: "Today's challenge: X"
    - 8pm: "You haven't participated yet!"
    - 11:59pm: "Final results!"
  - Rewards distribution automática (top N usuarios)

#### Semana 12: Social Feed
- [ ] **Feed Backend** (2 días)
  - Tabla `social_posts` (auto-generated en achievements, level-ups, etc.)
  - Tabla `post_reactions` + `post_comments`
  - Feed query optimizado (pagination, filters)
  - Privacy settings (mostrar/ocultar posts)

- [ ] **Feed UI** (2 días)
  - Feed page (infinite scroll)
  - Post card con:
    - User avatar + name
    - Achievement/milestone
    - Timestamp
    - Reactions (fire, muscle, clap)
    - Comments (collapsible)
  - Filters: Guild / Friends / Global
  - Compose comment (text input)

- [ ] **Mentor System** (2 días)
  - Tabla `mentor_relationships`
  - Find a Mentor page (level 30+ usuarios disponibles)
  - Request mentoring
  - Mentor dashboard (ver mentees progress)
  - 1-on-1 chat

**Métricas de Éxito Fase 3**:
- 🎯 2000 usuarios activos
- 🎯 30% usuarios en guilds
- 🎯 50% participa en Daily Global Challenge
- 🎯 Viral coefficient: 1.2 (cada usuario invita 1.2 amigos)
- 🎯 Retention 30-day: >60%

---

### 🤖 FASE 4: AI/ML AVANZADO (Días 91-120)
**Objetivo**: AI coach se vuelve el diferenciador #1

#### Semana 13: Predictive Analytics
- [ ] **Failure Prediction** (4 días)
  - Analytics service que corre diariamente
  - Pattern detection:
    - Días de semana problemáticos
    - Hábitos que siempre fallan juntos
    - Tiempo desde empezar hábito hasta fallar
  - Risk score calculation (0-100)
  - Preventive notifications:
    - "High risk day ahead"
    - "Your streak is vulnerable"
  - UI: Risk indicator en Dashboard

- [ ] **Pattern Recognition** (3 días)
  - Correlation analysis entre hábitos
  - Best/worst days identification
  - Optimal time windows per habit
  - Success rate by life area
  - Store insights en `user_insights` table
  - Weekly insight generation (Edge Function)

#### Semana 14: Smart Suggestions
- [ ] **Habit Suggestions** (3 días)
  - Habit library (100+ predefined habits con XP, icon, area)
  - Suggestion algorithm:
    - Detect neglected life areas
    - Match habits from library
    - Personalize XP values based on user level
  - UI: Suggested Habits card en Habits page
  - 1-click add
  - Feedback (useful / not useful)

- [ ] **Optimal Timing** (2 días)
  - Per-habit timing analysis
  - Success rate calculation by hour
  - Recommendations cuando confidence >70%
  - UI: Badge junto a habit "⏰ Best: 7-9am"
  - Smart notifications (enviar reminder a optimal time)

#### Semana 15: AI Coach Enhancement
- [ ] **Contextual Coaching** (4 días)
  - Enhanced system prompt con full user context
  - Function calling para actions:
    - `get_habit_stats(habit_id)`
    - `get_recent_insights()`
    - `get_streak_info()`
  - Multi-turn conversations (mantener historial)
  - Personalized responses basados en:
    - Personality (detectar si user es competitivo, colaborativo, etc.)
    - Progress level (beginner vs advanced)
    - Current struggles (detectar via sentiment)

- [ ] **Weekly AI Report** (2 días)
  - Edge Function cron (domingos 8pm)
  - Report generation con OpenAI
  - Template: Summary, Highlights, Improvements, Insights, Goals
  - Delivery: In-app notification + email
  - Archive: "Weekly Reports" section en Profile
  - Share report a social feed (optional)

- [ ] **Sentiment Analysis** (2 días)
  - Detect sentiment en user messages
  - Adjust coaching tone accordingly
  - Track emotional journey over time
  - Flag cuando user está en "crisis" (muy negative sentiment) → prioritize empathy

#### Semana 16: Polish & Launch
- [ ] **AI Cost Optimization**
  - Implement caching para common queries
  - Use gpt-4o-mini para mayoría de requests (fast + cheap)
  - Reserve gpt-4 para weekly reports o insights complejos
  - Set cost limits (max $ per user por mes)

- [ ] **AI Testing**
  - Test edge cases (empty habits, brand new user, advanced user)
  - Test sentiment detection accuracy
  - Test suggestions relevance (manual review)

- [ ] **Announcement & Marketing**
  - Blog post: "Zylen AI Coach 2.0: Your Personal Habit Mentor"
  - Email a usuarios existentes
  - Demo video mostrando AI features
  - Social media campaign

**Métricas de Éxito Fase 4**:
- 🎯 5000 usuarios activos
- 🎯 80% usuarios usa AI chat semanalmente
- 🎯 90% encuentra insights útiles (survey)
- 🎯 AI coach es #1 feature mencionada en reviews
- 🎯 Retention 60-day: >70%

---

## 🌙 FEATURES "MOONSHOT" (Post-MVP, Futuro)

> Ideas más arriesgadas/experimentales para después del MVP. Requieren más R&D.

### 🥽 AR Integration
**Concepto**: Usa cámara para "scan" objetos físicos y completar hábitos.

**Ejemplos**:
- Habit "Drink Water": Scan tu botella de agua
- Habit "Read": Scan un libro
- Habit "Gym": Scan tu gym membership card
- Easter eggs: Scan objetos especiales desbloquea equipment secreto

**Tech**: React Native (para mobile app) + AR.js o expo-camera

**Effort**: ~3-4 semanas
**Impact**: WOW factor alto, viral potential

---

### 🗺️ Procedural World
**Concepto**: Mapa generado proceduralmente que evoluciona con tu progreso.

**Mecánicas**:
- Start en "Dark Forest" (nivel 1-10)
- Unlock "Mountain Path" (nivel 10-20)
- Unlock "Crystal Caves" (nivel 20-30)
- Final: "Legendary Castle" (nivel 50+)
- Cada región tiene estética única + enemies únicos
- Boss battles ocurren en locations específicas

**Tech**: Canvas 2D o Three.js (3D)
**Effort**: ~4-6 semanas
**Impact**: Immersión profunda, diferenciador visual único

---

### 📖 Story Mode
**Concepto**: Narrativa épica que progresa con tus hábitos.

**Historia Ejemplo**:
- Eres un "Chosen One" destinado a salvar el reino de "Habitus"
- El reino está corrupto por "Chaos" (malos hábitos)
- Cada life area es una región del reino
- Completar hábitos = liberar regiones
- NPCs te dan quests
- Plot twists basados en tus decisiones

**Chapters**:
- Chapter 1: "The Awakening" (niveles 1-10)
- Chapter 2: "Rising Darkness" (niveles 10-20)
- Chapter 3: "The Great Battle" (niveles 20-30)
- Epilogue: "Legendary Hero" (nivel 50+)

**Tech**: Narrative engine + dialogue system
**Effort**: ~6-8 semanas (mucho writing)
**Impact**: Emotional investment profundo, única retention mechanism

---

### 🎙️ Voice AI Coach
**Concepto**: Conversaciones por voz con tu AI coach.

**Features**:
- Press to talk (WhatsApp style)
- AI responde con voz (text-to-speech)
- Conversaciones naturales
- Manos libres (usar mientras haces ejercicio)

**Tech**: OpenAI Whisper (speech-to-text) + TTS API
**Effort**: ~2-3 semanas
**Impact**: Accessibility + convenience

---

### ⌚ Wearables Integration
**Concepto**: Sync con Apple Watch, Fitbit, etc.

**Features**:
- Auto-complete hábitos físicos (ej: "10k steps" se marca auto si Watch detecta)
- Quick check-in desde Watch
- Complications mostrando streak, level
- Haptic feedback en level-ups

**Tech**: HealthKit (iOS), Google Fit (Android)
**Effort**: ~3-4 semanas
**Impact**: Convenience, automatic tracking

---

### 🌐 Multi-language Expansion
**Concepto**: Más allá de ES/EN, agregar 10+ idiomas.

**Prioridad**:
1. Portugués (Brasil market enorme)
2. Francés
3. Alemán
4. Italiano
5. Japonés (gamification culture)
6. Coreano (similar)
7. Mandarín

**Tech**: i18next ya soporta, solo traducir
**Effort**: ~1 semana por idioma (con traductores profesionales)
**Impact**: 10x market size potencial

---

### 💱 Real-World Rewards
**Concepto**: Convertir puntos en rewards tangibles.

**Partnerships**:
- Uber Eats créditos
- Amazon gift cards
- Gym memberships descuentos
- Curso online discounts (Udemy, etc.)

**Modelo**:
- 1000 puntos = $1 USD equivalent
- Zylen compra rewards al por mayor (descuento) y los revende
- Margins pequeños pero cubre costos de servidor

**Effort**: ~4-6 semanas (partnerships, legal, payment integration)
**Impact**: Motivación tangible, monetización indirecta

---

### 🎨 NFT Achievements (Web3)
**Concepto**: Achievements únicos como NFTs en blockchain.

**Mecánicas**:
- "First 100 users to beat Procrastination Dragon" → exclusive NFT
- NFTs tradables (OpenSea)
- Flex en social profiles
- Valor apreciable (collectibles)

**Tech**: Solana or Polygon (gas fees bajos)
**Effort**: ~3-4 semanas
**Impact**: Controversial pero viral potential alto, early adopter appeal

---

## 📈 MÉTRICAS DE ÉXITO GENERALES

### North Star Metric
**Weekly Active Users (WAU)** con al menos 1 hábito completado

### Secondary Metrics
- **Retention Cohorts**:
  - Day 1: >80%
  - Day 7: >60%
  - Day 30: >40%
  - Day 90: >30%

- **Engagement**:
  - Avg habits completed per user per day: >5
  - Avg session time: >8 min
  - Sessions per week: >10

- **Social**:
  - % users in guilds: >40%
  - % participating in daily challenge: >50%
  - Viral coefficient: >1.1

- **AI**:
  - % users chatting with AI weekly: >70%
  - % finding insights useful: >85%

- **Revenue** (si/cuando hay monetización):
  - ARPU (average revenue per user)
  - Conversion rate free → paid
  - LTV (lifetime value)

---

## 🛠️ STACK TÉCNICO REQUERIDO

### Nuevas Dependencias

```json
{
  "dependencies": {
    "openai": "^4.20.0",
    "recharts": "^2.10.0",
    "react-calendar-heatmap": "^1.9.0",
    "@supabase/realtime-js": "^2.8.0",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "vite-bundle-visualizer": "^0.10.0"
  }
}
```

### Supabase Additions

**Edge Functions** (Deno):
- `generate-daily-quests` (cron: diario a medianoche)
- `generate-boss-battles` (cron: semanal domingo)
- `refresh-leaderboards` (cron: cada hora)
- `weekly-ai-report` (cron: domingos 8pm)
- `analyze-patterns` (cron: semanal)

**Database Extensions**:
- `pg_cron` (para scheduled jobs)
- `pgvector` (si hacemos embeddings para semantic search en futuro)

**Storage Buckets**:
- `boss-images` (artwork de bosses)
- `equipment-images` (artwork de items)
- `user-avatars` (custom avatars en futuro)

### External APIs

- **OpenAI**: GPT-4o-mini (chat, insights, reports)
- **Sentry**: Error tracking
- **PostHog** or **Plausible**: Analytics
- **Resend** or **SendGrid**: Email notifications

---

## 🎯 PRIORIZACIÓN & TRADE-OFFS

### Must-Have (P0)
- Completar MVP core (Fase 1)
- Boss Battles (wow factor)
- Guild System (social lock-in)
- AI Chat real (diferenciador)

### Should-Have (P1)
- Combos (engagement boost)
- Leaderboards (competition)
- Daily Quests (variety)
- Predictive analytics (AI value)

### Nice-to-Have (P2)
- Equipment system (complexity vs value)
- Class system (rejugabilidad pero puede confundir)
- Seasonal events (requires constant content creation)
- Mentor system (nice pero no crítico)

### Future (P3)
- AR, Voice, Story Mode, NFTs (experimental)

---

## 🚨 RIESGOS & MITIGACIONES

### Riesgo 1: AI Costs
**Problema**: OpenAI puede ser caro con miles de usuarios.

**Mitigación**:
- Usar gpt-4o-mini (20x más barato que gpt-4)
- Implementar rate limits (ej: 20 mensajes por día por usuario)
- Caché responses comunes
- Fallback a respuestas predefinidas si budget excedido
- Monitorear costos diarios (alert si >$X)

### Riesgo 2: Complexity Creep
**Problema**: Agregar demasiadas features confunde usuarios.

**Mitigación**:
- Progressive disclosure (unlock features a medida que subes nivel)
- Tutorial en cada feature nueva
- "Simple Mode" toggle (oculta features avanzadas)
- User testing antes de launch

### Riesgo 3: Social Features Ghost Town
**Problema**: Guilds/leaderboards vacíos si no hay usuarios.

**Mitigación**:
- Seed con bot accounts (ethical bots que actúan como usuarios)
- Invitar beta testers en grupos (ej: 20 amigos al mismo tiempo)
- No lanzar social hasta tener >500 usuarios activos
- Promover guild formation activamente (ej: match users buscando guild)

### Riesgo 4: Retention Plateau
**Problema**: Usuarios se aburren después de 30 días.

**Mitigación**:
- Seasonal events (contenido fresco)
- Weekly challenges diferentes
- Prestige system (endgame content)
- AI coach evoluciona (mejores insights con más datos)
- Community mantiene interesante (social feed, guilds)

### Riesgo 5: Technical Debt
**Problema**: Moverse rápido puede crear deuda técnica.

**Mitigación**:
- Code reviews (aunque sea solo tú revisando al día siguiente)
- Refactor proactivo (1 día por semana dedicado a cleanup)
- Tests para features críticos (payments, XP calculations)
- Monitoring + alerts (catch bugs before users report)

---

## 🎬 CONCLUSIÓN

Este roadmap transforma Zylen de un **habit tracker funcional** a un **RPG de vida real** que es:

1. **Adictivo** (boss battles, combos, daily quests)
2. **Social** (guilds, leaderboards, mentores)
3. **Inteligente** (AI coach que predice, sugiere, motiva)
4. **Único** (dark fantasy + gamification extrema + AI = ningún competidor hace esto)

### Próximos Pasos Inmediatos

1. ✅ Revisar y aprobar este roadmap
2. ✅ Priorizar features según resources/tiempo
3. ✅ Empezar Fase 1 mañana
4. ✅ Setup project management (Linear, GitHub Projects, o Notion)
5. ✅ Communicate progress semanalmente

### Visión a 1 Año

- **10,000+ usuarios activos**
- **Top 10 Productivity app** en Product Hunt
- **4.8+ rating** en reviews
- **Featured** en App Store (si hay mobile app)
- **Community activa** (Discord con 1000+ miembros)
- **Press coverage** (TechCrunch, Product Hunt, HackerNews)

**Zylen no es solo una app. Es un movimiento. Es transformar hábitos aburridos en aventuras épicas.**

Let's build something legendary. 🎮⚔️🐉

---

_Last Updated: 2025-01-15_
_Version: 1.0_
_Author: Claude Code (con Camilo)_
