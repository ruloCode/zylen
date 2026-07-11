import type { UserSlice } from './userSlice';
import type { HabitsSlice } from './habitsSlice';
import type { StreaksSlice } from './streaksSlice';
import type { ShopSlice } from './shopSlice';
import type { ChatSlice } from './chatSlice';
import type { LifeAreasSlice } from './lifeAreasSlice';
import type { OnboardingSlice } from './onboardingSlice';
import type { SocialSlice } from './socialSlice';
import type { LeaderboardSlice } from './leaderboardSlice';
import type { RootHabitSlice } from './rootHabitSlice';
import type { AchievementsSlice } from './achievementsSlice';
import type { HabitTemplatesSlice } from './habitTemplatesSlice';
import type { ThemeSlice } from './themeSlice';
import type { ArenaSlice } from './arenaSlice';
import type { FocusSlice } from './focusSlice';
import type { CommunitySlice } from './communitySlice';

/**
 * Combined store type. Lives in its own module so individual slices can
 * type their StateCreator as StateCreator<AppStore, [], [], XSlice> and
 * read/write sibling slices (e.g. habits updating user XP) without casts.
 */
export type AppStore = UserSlice &
  HabitsSlice &
  StreaksSlice &
  ShopSlice &
  ChatSlice &
  LifeAreasSlice &
  OnboardingSlice &
  SocialSlice &
  LeaderboardSlice &
  RootHabitSlice &
  AchievementsSlice &
  HabitTemplatesSlice &
  ThemeSlice &
  ArenaSlice &
  FocusSlice &
  CommunitySlice;
