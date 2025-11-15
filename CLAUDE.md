# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Zylen is a gamified habit tracking application that helps users build better habits by earning XP and leveling up life areas. The app uses a reward/indulgence system where users can spend earned points on controlled indulgences.

## Development Commands

```bash
# Install dependencies (using pnpm)
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Lint code
pnpm run lint

# Preview production build
pnpm run preview
```

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Routing**: React Router DOM v6 with lazy loading
- **State Management**: Zustand
- **Data Persistence**: localStorage via custom service layer
- **Styling**: Tailwind CSS with custom design system
- **Icons**: Lucide React
- **Internationalization**: i18next + react-i18next (Spanish default, English alternative)

## Architecture

### Folder Structure (Feature-Based)

```
src/
├── app/                  # App-level components
│   └── AppProvider.tsx   # Initializes Zustand store on mount
│
├── pages/               # Route-level components (lazy-loaded)
│   ├── Dashboard.tsx
│   ├── HabitLog.tsx
│   ├── Streaks.tsx
│   ├── RootHabit.tsx
│   ├── Shop.tsx
│   └── Chat.tsx
│
├── features/            # Feature modules (organized by domain)
│   ├── habits/
│   │   ├── components/  # HabitItem
│   │   ├── hooks/       # (future)
│   │   └── utils/       # (future)
│   ├── streaks/
│   │   └── components/  # StreakDisplay
│   ├── shop/
│   │   └── components/  # ShopItem
│   ├── chat/
│   │   └── components/  # ChatBubble
│   └── dashboard/
│       └── components/  # LifeAreaCard
│
├── components/          # Shared components
│   ├── ui/             # Reusable UI primitives
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── ProgressBar.tsx
│   ├── layout/         # Layout components
│   │   └── Navigation.tsx
│   └── branding/       # Brand assets
│       └── Logo.tsx
│
├── store/              # Zustand state management
│   ├── index.ts        # Combined store + typed hooks
│   ├── userSlice.ts    # User state (points, XP)
│   ├── habitsSlice.ts  # Habits state + actions
│   ├── streaksSlice.ts # Streak tracking
│   ├── shopSlice.ts    # Purchase history
│   └── chatSlice.ts    # Chat messages
│
├── services/           # Data layer (localStorage)
│   ├── storage.ts      # Generic localStorage wrapper
│   ├── i18n.ts         # i18next configuration
│   ├── user.service.ts
│   ├── habits.service.ts
│   ├── streaks.service.ts
│   └── shop.service.ts
│
├── types/              # TypeScript type definitions
│   ├── habit.ts
│   ├── lifeArea.ts
│   ├── streak.ts
│   ├── shop.ts
│   ├── user.ts
│   ├── chat.ts
│   ├── i18n.d.ts       # i18next type augmentation
│   └── index.ts        # Barrel export
│
├── constants/          # App-wide constants
│   ├── routes.ts       # Route paths
│   ├── config.ts       # App configuration
│   ├── design-tokens.ts # Design system tokens
│   └── index.ts
│
├── utils/              # Utility functions
│   ├── cn.ts          # className merger
│   ├── xp.ts          # XP calculations
│   ├── date.ts        # Date utilities
│   └── index.ts
│
├── hooks/              # Custom React hooks
│   └── useLocale.ts    # i18n hook (translation, language switching)
│
└── assets/             # Static files
    └── rulo_avatar.png
```

Additionally, translation files are located in the public directory:
```
public/
└── locales/            # Translation files
    ├── es/             # Spanish (default)
    │   └── translation.json
    └── en/             # English
        └── translation.json
```

### Route Structure

The app uses client-side routing with lazy loading for optimal performance:

- `/` - Dashboard (main overview with life areas, points, and streak)
- `/habits` - HabitLog (daily habit tracking)
- `/streaks` - Streaks (streak tracking and achievements)
- `/root-habit` - RootHabit (30-day challenge tracker)
- `/shop` - Shop (indulgence rewards system)
- `/chat` - Chat (AI coach interface)

All routes are defined in `src/constants/routes.ts` and lazy-loaded in `App.tsx`.

### State Management

**Zustand** is used for global state management with the following slices:

1. **userSlice** - User data (points, XP, profile)
2. **habitsSlice** - Habit CRUD operations and completion tracking
3. **streaksSlice** - Streak calculation and tracking
4. **shopSlice** - Purchase history and transactions
5. **chatSlice** - Chat messages and loading states

**Typed Hooks:**
- `useUser()` - User state and actions
- `useHabits()` - Habit state and actions
- `useStreaks()` - Streak state and actions
- `useShop()` - Shop state and actions
- `useChat()` - Chat state and actions
- `useLocale()` - i18n translation and language switching

### Data Persistence

All user data is persisted to **localStorage** via a service layer:

- `StorageService` - Generic type-safe localStorage wrapper
- `UserService` - User data CRUD
- `HabitsService` - Habit data CRUD
- `StreaksService` - Streak data CRUD
- `ShopService` - Purchase history CRUD

Data is automatically loaded on app initialization via `AppProvider`.

### Internationalization (i18n)

The app supports **Spanish** (default) and **English** via `react-i18next`:

**Configuration:**
- i18n setup: `src/services/i18n.ts`
- Initialized in: `src/index.tsx` (before app renders)
- Translation files: `public/locales/{lang}/translation.json`
- TypeScript types: `src/types/i18n.d.ts`

**Usage in Components:**

```tsx
import { useLocale } from '@/hooks/useLocale';

function MyComponent() {
  const { t, language, changeLanguage, toggleLanguage } = useLocale();

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('common.points')}: {points}</p>
      <button onClick={() => changeLanguage('en')}>English</button>
      <button onClick={() => changeLanguage('es')}>Español</button>
      {/* or */}
      <button onClick={toggleLanguage}>Toggle Language</button>
    </div>
  );
}
```

**Language Switcher Component:**

The app includes a pre-built `LanguageSwitcher` component:

```tsx
import { LanguageSwitcher } from '@/features/settings/components';

// Compact variant (icon + badge)
<LanguageSwitcher variant="compact" />

// Expanded variant (full buttons)
<LanguageSwitcher variant="expanded" />
```

**Adding New Translations:**

1. Add keys to both language files:
   - `public/locales/es/translation.json`
   - `public/locales/en/translation.json`

2. Use in components via `t()` function:
   ```tsx
   {t('newSection.newKey')}
   ```

3. TypeScript will provide autocomplete for translation keys based on the Spanish translation file.

**Translation File Structure:**

Translations are organized by feature:
- `common` - Shared terms (loading, points, days, etc.)
- `app` - App name and tagline
- `navigation` - Navigation labels
- `dashboard` - Dashboard page
- `lifeAreas` - Life area names
- `streaks` - Streaks page and badges
- `habits` - Habits page
- `rootHabit` - 30-day challenge
- `shop` - Shop page
- `chat` - Chat interface
- `errors` - Error messages
- `actions` - Common action buttons

### Design System

Custom color palette defined in `src/index.css` with CSS variables:
- Gold palette (`gold-*`) - XP/points/rewards
- Teal palette (`teal-*`) - Primary actions
- Charcoal, Neon, Forest, Steel, Pale - Dark fantasy theme
- Semantic colors: `success-*`, `warning-*`, `danger-*`

Utility classes:
- `.glass-card` - Glassmorphism effect for cards
- `.glow-effect` - Subtle glow shadows
- `.float-animation` - Floating animation keyframes

Design tokens are also available in `src/constants/design-tokens.ts`.

### Path Aliases

Configured in both `vite.config.ts` and `tsconfig.json`:

- `@/*` - `./src/*`
- `@/components/*` - `./src/components/*`
- `@/features/*` - `./src/features/*`
- `@/pages/*` - `./src/pages/*`
- `@/hooks/*` - `./src/hooks/*`
- `@/services/*` - `./src/services/*`
- `@/types/*` - `./src/types/*`
- `@/constants/*` - `./src/constants/*`
- `@/utils/*` - `./src/utils/*`
- `@/store/*` - `./src/store/*`
- `@/app/*` - `./src/app/*`

### Build Optimizations

Vite is configured with:
- **Code splitting** - Automatic page-level splitting via lazy loading
- **Manual chunks** - Vendor chunks for React, Zustand, UI libraries
- **Tree shaking** - Removes unused code
- **CSS code splitting** - Separate CSS files per page
- **Minification** - esbuild for fast minification
- **Modern targets** - ES2020+ for smaller bundles

Typical production build:
- React vendor: ~160KB (52KB gzipped)
- UI vendor: ~42KB (13KB gzipped)
- Per-page chunks: 2-7KB (1-3KB gzipped)

## Important Notes

- **Package Manager**: Uses pnpm (not npm)
- **Data Persistence**: All data persisted to localStorage
- **State Management**: Zustand with typed hooks
- **Code Splitting**: Pages are lazy-loaded for performance
- **Type Safety**: Full TypeScript coverage with strict mode
- **Internationalization**: Spanish (default) and English; language preference persisted to localStorage
- **AI Chat**: The Chat page has simulated AI responses (not real AI integration)
- **No Tests**: No testing framework is configured yet
- **Life Areas**: Currently use mock data; future integration with habit tracking planned

## Adding New Features

### To add a new feature module:

1. Create feature folder in `src/features/[feature-name]/`
2. Add components, hooks, utils as needed
3. Create types in `src/types/[feature-name].ts`
4. Add service in `src/services/[feature-name].service.ts`
5. Add Zustand slice in `src/store/[feature-name]Slice.ts`
6. Wire up in store's `index.ts` and create typed hook

### To add a new page:

1. Create page component in `src/pages/[PageName].tsx`
2. Add route constant in `src/constants/routes.ts`
3. Add lazy import in `App.tsx`
4. Add route to navigation in `src/constants/routes.ts` NAV_ITEMS

## Code Style

- Use functional components with hooks
- TypeScript interfaces for all props
- Explicit return types for functions
- JSDoc comments for complex logic
- Semantic HTML with proper ARIA labels
- Tailwind for all styling (no CSS modules)
