/**
 * Centralized Icon Mappings
 *
 * Consolidates all icon mappings used throughout the app to prevent duplication
 *
 * Previously duplicated in:
 * - src/features/habits/components/HabitItem.tsx
 * - src/features/shop/components/ShopItem.tsx
 * - src/features/dashboard/components/LifeAreaCard.tsx
 * - src/features/dashboard/components/LifeAreaModal.tsx
 */

import {
  // Health & Fitness
  Dumbbell,
  Bike,
  Heart,
  Apple,
  Droplets,
  Bed,
  Utensils,

  // Mental & Learning
  Brain,
  Book,
  Pencil,
  Code,
  Target,
  Sparkles,

  // Social & Relationships
  Users,
  MessageCircle,
  Home,
  Gift,

  // Career & Finance
  Briefcase,
  DollarSign,
  Trophy,
  Star,
  TrendingUp,

  // Creativity & Hobbies
  Palette,
  Music,
  Camera,
  Coffee,

  // Misc
  Flame,
  Zap,
  Moon,
  Sunrise,
  CheckCircle2,
  Award,
  ShoppingCart,
  Candy,

  type LucideIcon,
} from 'lucide-react';

/**
 * Available icons for habits (32 icons)
 *
 * Re-exported from IconSelector for backwards compatibility
 */
export const HABIT_ICONS: Record<string, LucideIcon> = {
  // Health & Fitness
  Dumbbell,
  Bike,
  Heart,
  Apple,
  Droplets,
  Bed,
  Utensils,

  // Mental & Learning
  Brain,
  Book,
  Pencil,
  Code,
  Target,
  Sparkles,

  // Social & Relationships
  Users,
  MessageCircle,
  Home,
  Gift,

  // Career & Finance
  Briefcase,
  DollarSign,
  Trophy,
  Star,
  TrendingUp,

  // Creativity & Hobbies
  Palette,
  Music,
  Camera,
  Coffee,

  // Misc
  Flame,
  Zap,
  Moon,
  Sunrise,
  CheckCircle2,
  Award,
  ShoppingCart,
  Candy,
};

/**
 * Icons for life areas (6 icons)
 *
 * Used in LifeAreaCard, LifeAreaModal, Dashboard
 */
export const LIFE_AREA_ICONS: Record<string, LucideIcon> = {
  Health: Heart,
  Finance: DollarSign,
  Creativity: Palette,
  Social: Users,
  Family: Home,
  Career: Briefcase,
};

/**
 * Icons for shop items (6+ icons)
 *
 * Used in ShopItem, ShopItemForm
 */
export const SHOP_ICONS: Record<string, LucideIcon> = {
  Candy,
  ShoppingCart,
  Moon,
  Coffee,
  Gift,
  Sparkles,
};

/**
 * Unified icon map combining all categories
 *
 * Use this when you need access to any icon regardless of category
 */
export const ALL_ICONS: Record<string, LucideIcon> = {
  ...HABIT_ICONS,
  // LIFE_AREA_ICONS and SHOP_ICONS are subsets of HABIT_ICONS, so no need to merge
};

/**
 * Get an icon by name with fallback
 *
 * @param iconName - Name of the icon
 * @param fallback - Fallback icon if not found (defaults to Target)
 * @returns The icon component
 *
 * @example
 * ```tsx
 * const Icon = getIcon('Heart');
 * const IconWithFallback = getIcon('NonExistent', Sparkles);
 * ```
 */
export function getIcon(iconName: string, fallback: LucideIcon = Target): LucideIcon {
  return ALL_ICONS[iconName] || fallback;
}
