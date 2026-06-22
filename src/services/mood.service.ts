/**
 * Mood service — localStorage-backed daily mood journal (Daylio-style).
 * Keeps the feature self-contained and offline-first.
 */

import { StorageService } from './storage';
import type { MoodEntry, MoodLevel } from '@/types/mood';

const STORAGE_KEY = 'zylen.mood.entries';

export function localDateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

export class MoodService {
  static getAll(): MoodEntry[] {
    return StorageService.get<MoodEntry[]>(STORAGE_KEY) || [];
  }

  static getByDate(date: string): MoodEntry | undefined {
    return this.getAll().find((e) => e.date === date);
  }

  static getToday(): MoodEntry | undefined {
    return this.getByDate(localDateKey());
  }

  /** Create or update the entry for a given day */
  static upsert(date: string, mood: MoodLevel, note?: string): MoodEntry[] {
    const all = this.getAll();
    const idx = all.findIndex((e) => e.date === date);
    const entry: MoodEntry = { date, mood, note, updatedAt: new Date().toISOString() };
    if (idx >= 0) all[idx] = entry;
    else all.push(entry);
    all.sort((a, b) => a.date.localeCompare(b.date));
    StorageService.set(STORAGE_KEY, all);
    return all;
  }

  static remove(date: string): MoodEntry[] {
    const all = this.getAll().filter((e) => e.date !== date);
    StorageService.set(STORAGE_KEY, all);
    return all;
  }

  /** Consecutive-day logging streak ending today (or yesterday) */
  static getStreak(): number {
    const set = new Set(this.getAll().map((e) => e.date));
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    if (!set.has(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
    let streak = 0;
    while (set.has(localDateKey(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  static getAverage(entries?: MoodEntry[]): number | null {
    const list = entries || this.getAll();
    if (list.length === 0) return null;
    return list.reduce((s, e) => s + e.mood, 0) / list.length;
  }
}
