/**
 * Check if two dates are on the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Check if date is yesterday
 */
export function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
}

/**
 * Get start of day
 */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of day
 */
export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString();
}

/**
 * Get days between two dates
 */
export function daysBetween(date1: Date, date2: Date): number {
  const diffInMs = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
}

/**
 * Localized short relative time ("hace 20 min" / "20 min ago"). Web uses
 * Intl.RelativeTimeFormat; Hermes' Intl coverage is partial, so fall back
 * to hand-rolled es/en strings when the API is missing. For anything under
 * a minute the caller should show its own "just now" copy (returns empty
 * string as the signal).
 */
export function formatRelativeShort(date: Date, locale: string): string {
  const diffInMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffInMs / (1000 * 60));
  if (minutes < 1) return '';

  const rtf =
    typeof Intl !== 'undefined' && typeof (Intl as any).RelativeTimeFormat === 'function'
      ? new Intl.RelativeTimeFormat(locale, { style: 'short', numeric: 'always' })
      : null;
  const isEs = locale.startsWith('es');
  const format = (value: number, unit: Intl.RelativeTimeFormatUnit, short: string): string =>
    rtf ? rtf.format(-value, unit) : isEs ? `hace ${value} ${short}` : `${value} ${short} ago`;

  if (minutes < 60) return format(minutes, 'minute', 'min');
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return format(hours, 'hour', 'h');
  const days = Math.floor(hours / 24);
  if (days < 7) return format(days, 'day', isEs ? 'd' : 'd');
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return format(weeks, 'week', isEs ? 'sem' : 'wk');
  return date.toLocaleDateString(locale);
}
