# Auditoría UI/UX — Julio 2026

Auditoría completa de las 13 páginas de la web app (viewport móvil 390×844, usuario QA real contra Supabase live), con benchmarking en Mobbin contra las mejores apps de la categoría: **Finch, Fabulous, Life Reset, Duolingo, Mimo, Fitbit, Stadium Live, Notion/Copilot** (chat AI). Todos los hallazgos de esta auditoría fueron **implementados en esta misma pasada**; al final queda el backlog de lo que se decidió NO hacer aún.

---

## Diagnóstico raíz

La app convivía con **dos sistemas de diseño**: el v1 "DOFUS" (Bebas Neue en MAYÚSCULAS forzadas globalmente, verde lima `rgb(155,215,50)`, gradientes ámbar) y el v2 moderno (glass cards, teal/gold, títulos sentence-case). Las páginas rediseñadas (Dashboard, Rituales, Progreso, Reinos, Focus, Legado) se sentían premium; las que no (Shop, Mood, RootHabit, Chat, headers de Leaderboard) delataban la app.

**La causa técnica**: `src/index.css` definía `h1–h6 { font-family: 'Bebas Neue'; text-transform: uppercase }` a nivel global. Cualquier heading sin `font-sans normal-case` explícito gritaba en Bebas — incluyendo **contenido del usuario** (nombres de hábitos: "BEBER 2L DE AGUA", plantillas: "ESTUDIAR 30 MINUTOS").

## Cambios transversales (fundaciones)

| Cambio | Detalle |
|---|---|
| Tipografía | Body/UI: Roboto → **Manrope** (400–800). Bebas Neue queda como acento opt-in vía `font-display`. Escala de headings sentence-case con tracking negativo (`index.css`) |
| `text-transform: uppercase` global | **Eliminado** de h1–h6. Las 5 páginas v1 se modernizaron automáticamente y el contenido de usuario dejó de gritar |
| `.section-label` | Nueva utility (11px, 700, uppercase, tracking 0.16em, color secundario) — el eyebrow estándar para agrupar secciones (Focus, Arena/Armería, headers de ranking, labels de stats) |
| `.pressable` | Feedback táctil estándar (scale 0.975 en `:active`) para cards/botones interactivos |
| Scrollbars | Finos y translúcidos globalmente (5px, `--glass-border`); ocultos en el chat y rieles horizontales. Antes: barra blanca gruesa de escritorio |
| Focus visible | `:focus-visible` global con ring del tema (accesibilidad teclado) |
| `prefers-reduced-motion` | Animaciones colapsadas si el OS lo pide (seguridad vestibular) |
| Tap highlight | `-webkit-tap-highlight-color: transparent` + antialiasing (sensación nativa) |
| Transición de página | `animate-page-in` (fade + rise 220ms) en la columna de contenido de TODAS las páginas |
| CSS muerto | Eliminados `.btn-dofus-primary/secondary`, `.filter-diamond*`, `.text-dofus` (0 usos) y 6 clases fantasma del Shop (`shimmer`, `coin-spin`, `points-pop`…) que no existían en ningún CSS |
| Header.tsx | Verde lima hardcodeado `rgb(137,184,32)` → tokens del tema (`text-gold-400`, `ring-ring`, `bg-primary/20`) |

## Cambios por página

- **Shop (Santuario de Recompensas)** — referencia: Duolingo Shop / Binance Rewards / Mimo Store
  - Card de balance: gradiente oliva/khaki ilegible → glass oscuro con aura radial dorada, label `section-label`, número 5xl tabular, tile de moneda. Sin emojis duplicados (⚖️/⚠️ fuera de los strings i18n).
  - Ítems: título sentence-case, precio en **chip dorado** (antes verde lima), y **estado de asequibilidad real**: botón "Canjear" activo solo si alcanza; si no, deshabilitado con "Te faltan N" (`shop.notEnough`). Antes el botón siempre invitaba a comprar y fallaba con toast.
  - Card de advertencia: 1 icono (antes 3 señales de warning), copy secundario.
  - Gear de gestión: ahora con `aria-label` + `aria-pressed`.
- **Mood (Estado de ánimo)** — referencia: Fitbit mood log
  - Selector: emojis nativos sueltos → tiles circulares con **grayscale + dim en reposo** y color/ring/glow del mood al seleccionar (pop-in). Label del mood coloreado.
  - Bug "Julio De 2026": el `capitalize` CSS title-caseaba el "de" → capitalización en JS solo de la primera letra.
  - Hoy resaltado en el calendario, empty state con icono, distribución con `section-label`.
- **RootHabit (El Renacer de la Luz)** — referencia: Fabulous journey / Yazio milestones. Página v1 completa → v2:
  - Header izquierda con tile de icono (antes círculo naranja centrado gigante).
  - Card de desafío con contador grande + chip % dorado + **hitos 7/14/21/30** con estrellas.
  - Grid de 30 días con estados ricos: completado (gradiente dorado + check), **siguiente día (ring teal pulsante)**, futuro (dim).
  - Quote: gradiente ámbar barroso → glass con borde izquierdo dorado e icono de cita.
- **Leaderboard (Guardianes)** — referencia: Duolingo Leagues / Stadium Live
  - **Header duplicado eliminado** (el hero repetía "GUARDIANES" + descripción bajo el título) → una sola línea de contexto por tab. ~90px verticales recuperados.
  - **Countdown de reinicio semanal** ("Se reinicia en 3d 2h") en el header del ranking, computado a lunes 00:00 local.
  - Fix `406` en consola: `weekly_leaderboard` con `.single()` → `.maybeSingle()` (`leaderboard.service.ts`).
- **Chat (El Mentor)** — referencia: Copilot/Notion AI: header v2 compacto, subtítulo secundario, **scrollbar oculto** en la lista de mensajes.
- **Focus / Arena (Armería)**: labels de sección ("Elige tu gema", "Duración", "Bastones", "Gemas"…) → `section-label`.
- **Dashboard**: label "Guardián Nivel 1" balanceado (`text-wrap: balance`), plural "1 día".
- **Habits/Rituales**: nombre del hábito en sentence-case (fix global), **"1 día" singular** (antes "1 días") vía `progress.daysCount` con count.
- **Profile (Legado)**: stat "1 día de llama" plural correcto (`progress.streakChip`); headings de sección consistentes.
- **i18n**: claves nuevas `shop.notEnough`, `shop.buyAria`, `community.ranking.resetsIn`, `rootHabit.dayDone`; EN `shop.title` alineado a la narrativa ("Reward Sanctuary").

## Interacciones auditadas OK (sin cambios)

- Completar hábito: ya tiene XPBurst + pop-in + sparkle (premium).
- Navegación inferior hexagonal: distintiva, con aria-labels y `aria-current`, feedback activo. Se conserva como firma visual.
- Realms, Focus: ya eran v2 sólidos.
- Login/Welcome/Onboarding: rediseño reciente, headings con clases explícitas — no afectados por el cambio global.

## Backlog recomendado (no implementado)

1. **Ritmo vertical**: el top-padding varía entre páginas (~9 variantes). Normalizar con tokens (pendiente de [[zylen-spacing-system]]).
2. **Día tocable en calendario de Mood** → sheet con detalle/edición de días pasados.
3. **Podio top-3** en el ranking cuando haya ≥3 guardianes con datos (estilo Stadium Live).
4. **Paridad mobile (Expo)**: `mobile/` no recibió nada de esta pasada.
5. Migrar los wrappers `max-w-md mx-auto px-4` restantes a `<PageContainer>`.

## Verificación

- `pnpm run build` ✓ (3.6s, mismos chunks; warnings de tamaño preexistentes).
- Recorrido Playwright completo re-capturado tras los cambios: 0 errores de consola nuevos, el 406 de `weekly_leaderboard` eliminado.
