/**
 * Greeting & motivational helpers for the Home screen.
 * Returns i18n keys (not literal strings) so copy stays in translation files.
 */

/**
 * Pick a time-of-day greeting key based on the local hour.
 * @returns one of 'home.greetingMorning' | 'home.greetingAfternoon' | 'home.greetingEvening'
 */
export function getGreetingKey(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'home.greetingMorning';
  if (hour < 19) return 'home.greetingAfternoon';
  return 'home.greetingEvening';
}

/**
 * Stable index into the motivational quotes list, rotating once per day
 * (so it doesn't flicker on every render but still varies day to day).
 */
export function getDailyQuoteIndex(quotesLength: number, date: Date = new Date()): number {
  if (quotesLength <= 0) return 0;
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86_400_000
  );
  return dayOfYear % quotesLength;
}
