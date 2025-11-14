# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MyWay (LifeQuest) is a gamified habit tracking application that helps users build better habits by earning XP and leveling up life areas. The app uses a reward/indulgence system where users can spend earned points on controlled indulgences.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS with custom design system
- **Icons**: Lucide React

## Architecture

### Route Structure

The app uses client-side routing via `App.tsx` with the following pages:

- `/` - Dashboard (main overview with life areas, points, and streak)
- `/habits` - HabitLog (daily habit tracking)
- `/streaks` - Streaks (streak tracking)
- `/root-habit` - RootHabit (core habit management)
- `/shop` - Shop (indulgence rewards system)
- `/chat` - Chat (AI coach interface)

All pages include a bottom Navigation component that persists across routes.

### Component Organization

- `src/pages/` - Full page components corresponding to routes
- `src/components/` - Reusable UI components (Button, Navigation, HabitItem, etc.)
- `src/lib/` - Utility functions (currently contains `cn()` for className merging)

### State Management

Currently uses React local state (`useState`) within individual pages. There is no global state management solution (Redux, Zustand, etc.) in place. State is not persisted - it resets on page reload.

### Design System

Custom color palette defined in `src/index.css` with CSS variables:
- `--quest-blue` / `--quest-blue-light` - Primary brand colors
- `--quest-green` - Success/positive actions
- `--quest-gold` - XP/points/rewards
- `--quest-purple` - Secondary accent

Utility classes:
- `.glass-card` - Glassmorphism effect for cards
- `.glow-effect` - Subtle glow shadows
- `.float-animation` - Floating animation keyframes

### Path Aliases

The project uses `@/` as an alias for `./src/` (configured in both `vite.config.ts` and `tsconfig.json`).

## Important Notes

- **Mock Data**: All data is currently hardcoded in components (points, habits, streaks, life areas). No backend or persistence layer exists.
- **AI Chat**: The Chat page has a simulated AI response with a 1-second delay - not a real AI integration.
- **No Tests**: No testing framework is configured.
- **Package Manager**: Uses npm scripts but has a `pnpm-lock.yaml`, indicating pnpm was used for installation.
