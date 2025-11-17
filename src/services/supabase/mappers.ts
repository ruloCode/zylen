/**
 * Supabase Type Mappers
 *
 * Functions to convert between database types and application types.
 */

import type { Database } from '@/types/supabase';
import type { User } from '@/types/user';
import type { LifeArea } from '@/types/lifeArea';
import type { Habit, HabitCompletion } from '@/types/habit';
import type { Streak } from '@/types/streak';
import type { ShopItem, Purchase } from '@/types/shop';
import { mapDBDateToDate } from './utils';
import { AVATARS } from '@/constants';

// Database row types for convenience
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type LifeAreaRow = Database['public']['Tables']['life_areas']['Row'];
type HabitRow = Database['public']['Tables']['habits']['Row'];
type HabitCompletionRow = Database['public']['Tables']['habit_completions']['Row'];
type StreakRow = Database['public']['Tables']['streaks']['Row'];
type ShopItemRow = Database['public']['Tables']['shop_items']['Row'];
type PurchaseRow = Database['public']['Tables']['purchases']['Row'];

/**
 * Map Profile DB row to User type
 */
export function mapProfileToUser(profile: ProfileRow, selectedLifeAreas: string[] = []): User {
  return {
    id: profile.id,
    name: profile.name,
    username: profile.username || undefined,
    points: profile.points,
    totalXPEarned: profile.total_xp_earned,
    level: profile.level,
    joinedAt: mapDBDateToDate(profile.created_at),
    avatarUrl: profile.avatar_url || AVATARS.RULO, // Default to RULO avatar if not set
    hasCompletedOnboarding: profile.has_completed_onboarding,
    selectedLifeAreas, // This needs to be fetched separately from life_areas where enabled=true
    timezone: profile.timezone || 'America/Bogota', // Default timezone if not set
  };
}

/**
 * Capitalize first letter of string (for converting db area_type to LifeAreaType)
 */
function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Map LifeArea DB row to LifeArea type
 */
export function mapLifeAreaRowToLifeArea(row: LifeAreaRow): LifeArea {
  // Convert area_type from lowercase (db) to PascalCase (app)
  const areaName = row.is_custom
    ? (row.custom_name || row.area_type)
    : capitalizeFirstLetter(row.area_type);

  return {
    id: row.id,
    area: areaName,
    level: row.level,
    totalXP: row.total_xp,
    isCustom: row.is_custom,
    enabled: row.enabled,
    iconName: row.icon_name || undefined,
    color: row.color || undefined,
  };
}

/**
 * Map Habit DB row to Habit type
 * NOTE: This includes completed and completedAt fields for backward compatibility,
 * but these should be fetched separately via habit_completions table
 */
export function mapHabitRowToHabit(
  row: HabitRow,
  completed: boolean = false,
  completedAt?: Date
): Habit {
  return {
    id: row.id,
    name: row.name,
    iconName: row.icon_name,
    xp: row.xp,
    points: row.points,
    completed, // Temporary state, not persisted in habits table
    lifeArea: row.life_area_id,
    createdAt: mapDBDateToDate(row.created_at),
    completedAt, // From habit_completions join
  };
}

/**
 * Map HabitCompletion DB row to HabitCompletion type
 */
export function mapHabitCompletionRowToHabitCompletion(
  row: HabitCompletionRow
): HabitCompletion {
  return {
    habitId: row.habit_id,
    completedAt: mapDBDateToDate(row.completed_at),
    xpEarned: row.xp_earned,
  };
}

/**
 * Map Streak DB row to Streak type
 */
export function mapStreakRowToStreak(row: StreakRow): Streak {
  return {
    currentStreak: row.current_streak,
    weeklyStreak: row.last_seven_days.filter(Boolean).length, // Calculate from array
    longestStreak: row.longest_streak,
    lastSevenDays: row.last_seven_days,
    lastCompletionDate: row.last_completion_date
      ? mapDBDateToDate(row.last_completion_date)
      : undefined,
  };
}

/**
 * Map ShopItem DB row to ShopItem type
 */
export function mapShopItemRowToShopItem(row: ShopItemRow): ShopItem {
  return {
    id: row.id,
    name: row.name,
    iconName: row.icon_name,
    cost: row.cost,
    description: row.description || '',
    category: (row.category as ShopItem['category']) || 'other',
    available: row.available,
  };
}

/**
 * Map Purchase DB row to Purchase type
 */
export function mapPurchaseRowToPurchase(row: PurchaseRow): Purchase {
  return {
    id: row.id,
    itemId: row.shop_item_id,
    itemName: row.item_name,
    cost: row.cost,
    purchasedAt: mapDBDateToDate(row.purchased_at),
  };
}

/**
 * Map User type to Profile DB Insert type
 */
export function mapUserToProfileInsert(
  user: Partial<User>
): Database['public']['Tables']['profiles']['Insert'] {
  return {
    id: user.id!,
    name: user.name || 'User',
    points: user.points || 0,
    total_xp_earned: user.totalXPEarned || 0,
    level: user.level || 1,
    avatar_url: user.avatarUrl || null,
    has_completed_onboarding: user.hasCompletedOnboarding || false,
  };
}

/**
 * Map User type to Profile DB Update type
 */
export function mapUserToProfileUpdate(
  user: Partial<User>
): Database['public']['Tables']['profiles']['Update'] {
  const update: Database['public']['Tables']['profiles']['Update'] = {};

  if (user.name !== undefined) update.name = user.name;
  if (user.username !== undefined) update.username = user.username || null;
  if (user.points !== undefined) update.points = user.points;
  if (user.totalXPEarned !== undefined) update.total_xp_earned = user.totalXPEarned;
  if (user.level !== undefined) update.level = user.level;
  if (user.avatarUrl !== undefined) update.avatar_url = user.avatarUrl || null;
  if (user.hasCompletedOnboarding !== undefined)
    update.has_completed_onboarding = user.hasCompletedOnboarding;
  if (user.timezone !== undefined) update.timezone = user.timezone;

  return update;
}

/**
 * Map LifeArea type to LifeArea DB Insert type
 */
export function mapLifeAreaToInsert(
  lifeArea: Partial<LifeArea>,
  userId: string
): Database['public']['Tables']['life_areas']['Insert'] {
  return {
    user_id: userId,
    area_type: lifeArea.isCustom ? 'custom' : (lifeArea.area as string).toLowerCase(),
    level: lifeArea.level || 1,
    total_xp: lifeArea.totalXP || 0,
    is_custom: lifeArea.isCustom || false,
    enabled: lifeArea.enabled !== undefined ? lifeArea.enabled : true,
    custom_name: lifeArea.isCustom ? lifeArea.area as string : null,
    icon_name: lifeArea.iconName || null,
    color: lifeArea.color || null,
  };
}

/**
 * Map Habit type to Habit DB Insert type
 */
export function mapHabitToInsert(
  habit: Partial<Habit>,
  userId: string
): Database['public']['Tables']['habits']['Insert'] {
  return {
    user_id: userId,
    name: habit.name!,
    icon_name: habit.iconName!,
    xp: habit.xp!,
    life_area_id: habit.lifeArea!, // This is now a UUID
    // points is auto-calculated by trigger
  };
}

/**
 * Map ShopItem type to ShopItem DB Insert type
 */
export function mapShopItemToInsert(
  item: Partial<ShopItem>,
  userId: string,
  isDefault: boolean = false
): Database['public']['Tables']['shop_items']['Insert'] {
  return {
    user_id: userId,
    name: item.name!,
    icon_name: item.iconName!,
    cost: item.cost!,
    description: item.description || '',
    category: item.category || 'other',
    available: item.available !== undefined ? item.available : true,
    is_default: isDefault,
  };
}
