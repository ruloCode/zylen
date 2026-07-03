/**
 * Profile timezone cache + timezone-aware day math.
 *
 * The backend RPCs (complete_habit, refresh_user_streak, get_daily_activity)
 * compute "today" in the user's STORED profile timezone. Client-side day
 * boundaries must use the same timezone or completedToday/streak state can
 * diverge from server truth (e.g. when the device timezone differs from the
 * profile or a timezone sync fails mid-session).
 *
 * Self-contained (no imports) so both utils.ts and services can depend on it.
 */

const DEFAULT_TIMEZONE = 'America/Bogota';

let profileTimezone: string | null = null;

/** Cache the user's stored profile timezone (call whenever the profile loads/syncs). */
export function setProfileTimezone(tz: string): void {
  if (tz) profileTimezone = tz;
}

/** The user's stored timezone, falling back to the browser's until the profile loads. */
export function getProfileTimezone(): string {
  if (profileTimezone) return profileTimezone;
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

/** Wall-clock fields of an instant in a given IANA timezone. */
function wallClockParts(tz: string, at: Date): {
  year: number; month: number; day: number; hour: number; minute: number; second: number;
} {
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts: Record<string, number> = {};
  for (const p of dtf.formatToParts(at)) {
    if (p.type !== 'literal') parts[p.type] = Number(p.value);
  }
  const hour = parts.hour ?? 0;
  return {
    year: parts.year ?? 1970,
    month: parts.month ?? 1,
    day: parts.day ?? 1,
    hour: hour === 24 ? 0 : hour, // some engines report midnight as 24
    minute: parts.minute ?? 0,
    second: parts.second ?? 0,
  };
}

/** UTC offset (ms) of the timezone at a given instant. */
function tzOffsetMs(tz: string, at: Date): number {
  const w = wallClockParts(tz, at);
  const asUTC = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second);
  return asUTC - at.getTime();
}

/** Calendar day (YYYY-MM-DD) of an instant in the given timezone. */
export function formatDayKeyInTimeZone(tz: string, date: Date = new Date()): string {
  const w = wallClockParts(tz, date);
  return `${w.year}-${String(w.month).padStart(2, '0')}-${String(w.day).padStart(2, '0')}`;
}

/** Hour of day (0-23) of an instant in the given timezone. */
export function getHourInTimeZone(tz: string, date: Date = new Date()): number {
  return wallClockParts(tz, date).hour;
}

/**
 * UTC instant boundaries of the calendar day containing `date` in the given
 * IANA timezone (DST-safe, no libraries). Matches the backend's
 * `(completed_at AT TIME ZONE tz)::date` semantics.
 */
/** UTC timestamp (ms) of local midnight for a calendar day in the timezone. */
function midnightTs(tz: string, year: number, month: number, day: number): number {
  // First guess: local midnight interpreted as UTC, then correct by the
  // timezone offset at that instant. Iterate once more for DST transitions
  // that happen right at midnight.
  let ts = Date.UTC(year, month - 1, day);
  for (let i = 0; i < 2; i++) {
    ts = Date.UTC(year, month - 1, day) - tzOffsetMs(tz, new Date(ts));
  }
  return ts;
}

export function getDayRangeInTimeZone(
  tz: string,
  date: Date = new Date()
): { start: string; end: string } {
  const w = wallClockParts(tz, date);
  const start = midnightTs(tz, w.year, w.month, w.day);
  // End = next local midnight - 1ms (correct on 23h/25h DST-transition days).
  const nextStart = midnightTs(tz, w.year, w.month, w.day + 1);
  return {
    start: new Date(start).toISOString(),
    end: new Date(nextStart - 1).toISOString(),
  };
}
