# Zylen

**Tu vida, subida de nivel** (Your life, leveled up)

Zylen is a gamified habit tracking application that helps you build better habits by earning XP and leveling up different areas of your life. Turn your daily routines into an engaging RPG-like experience where progress is rewarded and indulgences are earned, not given.

## What is Zylen?

Zylen transforms habit building into a game. Instead of just checking off tasks, you:

- **Earn XP** for completing habits and level up your life areas
- **Build streaks** and unlock achievements as you maintain consistency
- **Spend points** on controlled indulgences that you've earned through hard work
- **Track progress** across multiple life dimensions (health, career, relationships, personal growth, etc.)
- **Challenge yourself** with 30-day root habit commitments
- **Get guidance** from an AI coach to stay motivated

The core philosophy: Make healthy habits rewarding and turn indulgences into something you consciously earn, creating a sustainable balance between discipline and enjoyment.

## Features

### Core Functionality
- **Gamified Habit Tracking** - Complete habits to earn XP and level up life areas
- **Multi-Dimensional Progress** - Track 6+ life areas independently (Health, Career, Relationships, Personal Growth, Finances, Creativity)
- **Streak System** - Build momentum with daily streaks and unlock achievement badges
- **30-Day Root Habit Challenge** - Commit to one foundational habit for 30 days
- **Reward Shop** - Spend earned points on controlled indulgences (guilty pleasures, cheat meals, gaming time)
- **AI Coach Chat** - Get motivational support and habit-building advice

### User Experience
- **Multi-Step Onboarding** - Personalized setup flow with profile creation and life area selection
- **Bilingual Support** - Full Spanish and English translations with instant language switching
- **Dark Fantasy Theme** - Immersive UI with glassmorphism effects and a unique color palette
- **Responsive Design** - Optimized for mobile and desktop
- **Offline-First** - All data persisted locally with no backend required

### Technical Highlights
- **Type-Safe** - Full TypeScript coverage with strict mode
- **Performant** - Code splitting, lazy loading, and optimized bundle sizes
- **Accessible** - WCAG compliant with semantic HTML and ARIA labels
- **Modern Stack** - React 18, Vite 5, Zustand, React Router, i18next

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 18 with TypeScript |
| **Build Tool** | Vite 5 |
| **Routing** | React Router DOM v6 (lazy loading) |
| **State Management** | Zustand |
| **Data Persistence** | localStorage via service layer |
| **Styling** | Tailwind CSS with custom design system |
| **Icons** | Lucide React |
| **Internationalization** | i18next + react-i18next |
| **Package Manager** | pnpm |

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: use [nvm](https://github.com/nvm-sh/nvm))
- pnpm 8+ (`npm install -g pnpm`)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd Zylen

# Install dependencies
pnpm install
```

### Development

```bash
# Start development server (http://localhost:5173)
pnpm run dev

# Lint code
pnpm run lint

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

## Project Structure

Zylen follows a feature-based architecture for scalability:

```
src/
├── app/                  # App initialization
├── pages/               # Route-level components (lazy-loaded)
├── features/            # Feature modules by domain
│   ├── habits/
│   ├── streaks/
│   ├── shop/
│   ├── chat/
│   ├── dashboard/
│   ├── onboarding/
│   └── profile/
├── components/          # Shared components
│   ├── ui/             # Reusable UI primitives
│   ├── layout/         # Layout components
│   └── branding/       # Brand assets
├── store/              # Zustand state management (slices)
├── services/           # Data layer (localStorage)
├── types/              # TypeScript definitions
├── constants/          # App-wide constants
├── utils/              # Utility functions
├── hooks/              # Custom React hooks
└── assets/             # Static files
```

## Key Concepts

### Life Areas
Users can track progress across multiple life dimensions. Each area has its own XP and level:
- Health & Fitness
- Career & Education
- Relationships & Social
- Personal Growth
- Finances
- Creativity & Hobbies

### XP and Leveling
Completing habits earns XP for the associated life area. As XP accumulates, that area levels up, providing a sense of progression and achievement.

### Points and Indulgences
In addition to XP, completing habits earns points that can be spent in the Shop on controlled indulgences. This creates a balanced reward system where treats are earned, not impulsive.

### Streaks
Consistency is rewarded through streak tracking. Maintain daily habits to build streaks and unlock achievement badges at milestones (7, 14, 30, 60, 100+ days).

### Root Habit
Commit to one foundational habit for 30 consecutive days. This focused challenge helps establish keystone habits that can transform other areas of life.

## Internationalization

Zylen supports Spanish (default) and English:

```tsx
import { useLocale } from '@/hooks/useLocale';

function MyComponent() {
  const { t, language, changeLanguage, toggleLanguage } = useLocale();

  return <h1>{t('dashboard.title')}</h1>;
}
```

Translation files: `public/locales/{es|en}/translation.json`

Language preference is persisted to localStorage.

## Data Persistence

All user data is stored in **localStorage** via a service layer:
- User profile and stats
- Habits and completion history
- Streaks and achievements
- Purchase history
- Onboarding state
- Language preference

No backend or authentication is required (currently).

## Build & Deployment

Production build is optimized with:
- **Code splitting** - Automatic page-level chunks via lazy loading
- **Vendor chunks** - React, Zustand, UI libraries separated
- **Tree shaking** - Removes unused code
- **CSS optimization** - Separate CSS files per page
- **Minification** - Fast esbuild minification

Typical production bundle:
- React vendor: ~160KB (52KB gzipped)
- UI vendor: ~42KB (13KB gzipped)
- Per-page chunks: 2-7KB (1-3KB gzipped)

Deploy to any static hosting provider (Vercel, Netlify, GitHub Pages, etc.).

## Contributing

This is a personal project, but contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - feel free to use this project as inspiration for your own habit tracking app!

## Roadmap

Future enhancements planned:
- [ ] Backend integration for cross-device sync
- [ ] Social features (friend challenges, leaderboards)
- [ ] Real AI integration for the coach chat
- [ ] Habit analytics and insights
- [ ] Custom habit templates
- [ ] Calendar view for habit history
- [ ] Export/import data functionality
- [ ] Progressive Web App (PWA) support

---

**Built with React, TypeScript, and Vite** | [Report Bug](https://github.com/yourusername/zylen/issues) | [Request Feature](https://github.com/yourusername/zylen/issues)
