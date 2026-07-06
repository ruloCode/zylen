/**
 * Mood tracking types (Daylio-inspired).
 * Mood levels: 0 = awful … 4 = rad (5-point scale).
 */

export type MoodLevel = 0 | 1 | 2 | 3 | 4;

export interface MoodEntry {
  /** YYYY-MM-DD (local) — one entry per day */
  date: string;
  mood: MoodLevel;
  note?: string;
  updatedAt: string; // ISO timestamp
}

export interface MoodConfig {
  level: MoodLevel;
  /** translation key under `mood.*` */
  labelKey: string;
  emoji: string;
  /** card / dot color */
  color: string;
}

export const MOODS: MoodConfig[] = [
  { level: 4, labelKey: 'rad', emoji: '😄', color: 'hsl(150, 60%, 50%)' },
  { level: 3, labelKey: 'good', emoji: '🙂', color: 'hsl(95, 55%, 52%)' },
  { level: 2, labelKey: 'meh', emoji: '😐', color: 'hsl(45, 95%, 55%)' },
  { level: 1, labelKey: 'bad', emoji: '🙁', color: 'hsl(25, 90%, 55%)' },
  { level: 0, labelKey: 'awful', emoji: '😣', color: 'hsl(0, 80%, 60%)' },
];

export function moodByLevel(level: MoodLevel): MoodConfig {
  return MOODS.find((m) => m.level === level) || MOODS[2];
}
