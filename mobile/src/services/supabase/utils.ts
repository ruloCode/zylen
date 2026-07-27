/**
 * Supabase Service Utilities
 *
 * Common helper functions for Supabase service operations.
 */

import { supabase } from '@/lib/supabase';
import { AuthError } from '@/types/errors';
import { getDayRangeInTimeZone, getProfileTimezone } from './timezone';

/**
 * Get authenticated user ID.
 *
 * Reads the id from the **stored session** (`getSession`), not from
 * `getUser()`: the latter hits `GET /auth/v1/user` on every call, and the
 * services call this helper before nearly every query — on a phone that
 * turned a single screen load into a dozen extra round trips. `getSession`
 * resolves from AsyncStorage and only touches the network when the token
 * actually expired. RLS still validates the JWT server-side, so nothing is
 * trusted that wasn't before.
 *
 * @throws {AuthError} if user is not authenticated
 */
export async function getAuthUserId(): Promise<string> {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session?.user) {
    throw new AuthError('User not authenticated');
  }

  return session.user.id;
}

/**
 * Reject with `AuthError`-style failure if a request outlives `ms`.
 *
 * Mobile radios drop requests without ever closing the socket, and
 * supabase-js has no built-in deadline — the promise simply never settles
 * and the screen spins forever. Racing gives the UI something to show (an
 * error + retry) instead of an eternal spinner.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number = 15_000,
  label = 'request'
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`Timeout: ${label} took longer than ${ms}ms`)),
          ms
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Get authenticated user session
 */
export async function getAuthSession() {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    throw new AuthError('No active session');
  }

  return session;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}

/**
 * Convert database date string to Date object
 */
export function mapDBDateToDate(dbDate: string): Date {
  return new Date(dbDate);
}

/**
 * Convert Date object to database date string (ISO format)
 */
export function mapDateToDBDate(date: Date): string {
  return date.toISOString();
}

/**
 * Get browser's IANA timezone
 * @returns IANA timezone string (e.g., 'America/Bogota', 'America/New_York')
 */
export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn('Failed to detect browser timezone, using default:', error);
    return 'America/Bogota'; // Fallback to default
  }
}

/**
 * Get today's date range for filtering (start and end of day).
 * Computed in the user's STORED profile timezone so it matches the backend
 * RPCs (complete_habit / refresh_user_streak / get_daily_activity), which
 * derive "today" from profiles.timezone — not the device clock.
 */
export function getTodayDateRange(): { start: string; end: string } {
  return getDayRangeInTimeZone(getProfileTimezone());
}

/**
 * Get date range for a specific date (in the user's stored timezone)
 */
export function getDateRange(date: Date): { start: string; end: string } {
  return getDayRangeInTimeZone(getProfileTimezone(), date);
}

/**
 * Handle Supabase errors and throw appropriate service errors
 */
export function handleSupabaseError(error: any, defaultMessage: string): never {
  console.error('Supabase error:', error);
  throw new Error(error?.message || defaultMessage);
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

/**
 * Batch operations helper
 */
export async function batchOperation<T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  batchSize: number = 10
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(operation));
    results.push(...batchResults);
  }

  return results;
}
