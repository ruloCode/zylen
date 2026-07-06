/**
 * Supabase Service Utilities
 *
 * Common helper functions for Supabase service operations.
 */

import { supabase } from '@/lib/supabase';
import { AuthError } from '@/types/errors';

/**
 * Get authenticated user ID
 * @throws {AuthError} if user is not authenticated
 */
export async function getAuthUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthError('User not authenticated');
  }

  return user.id;
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
 * Get today's date range for filtering (start and end of day)
 * Note: This uses the browser's local timezone for display purposes.
 * The backend uses the user's stored timezone for validation.
 */
export function getTodayDateRange(): { start: string; end: string } {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

  return {
    start: startOfDay.toISOString(),
    end: endOfDay.toISOString(),
  };
}

/**
 * Get date range for a specific date
 */
export function getDateRange(date: Date): { start: string; end: string } {
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

  return {
    start: startOfDay.toISOString(),
    end: endOfDay.toISOString(),
  };
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
