/**
 * One-time localStorage migration: Zylen → Everlight rebrand.
 *
 * The app was renamed from "Zylen" to "Everlight", and with it every
 * localStorage key moved from the `zylen_*` prefix to `everlight_*`.
 * This utility copies any existing user data from the old keys to the new
 * ones on first load so nobody loses their progress — and, critically, so
 * logged-in users keep their Supabase session instead of being signed out.
 *
 * Design notes:
 * - Dependency-free and idempotent. Safe to call on every boot.
 * - The old `zylen_*` literals are HARDCODED here on purpose. They are a
 *   stable historical record; do NOT derive them from STORAGE_KEYS (those
 *   now hold the new `everlight_*` values).
 * - Values are copied as RAW STRINGS (no JSON parse/stringify) so the
 *   Supabase auth blob is preserved byte-for-byte.
 * - Old keys are intentionally LEFT in place this release for rollback
 *   safety. A later migration can remove them once this is stable.
 * - Must run BEFORE `src/lib/supabase.ts` is imported (the Supabase client
 *   reads its storageKey at construction time). It is called as the first
 *   statement of `src/index.tsx`.
 */

const MIGRATION_SENTINEL = 'everlight_migrated_v1';

/** Every key that changed prefix, oldest → newest. */
const KEY_MIGRATIONS: ReadonlyArray<readonly [oldKey: string, newKey: string]> = [
  ['zylen_user', 'everlight_user'],
  ['zylen_habits', 'everlight_habits'],
  ['zylen_life_areas', 'everlight_life_areas'],
  ['zylen_streaks', 'everlight_streaks'],
  ['zylen_shop', 'everlight_shop'],
  ['zylen_shop_items', 'everlight_shop_items'],
  ['zylen_purchases', 'everlight_purchases'],
  ['zylen_settings', 'everlight_settings'],
  ['zylen_app_state', 'everlight_app_state'],
  ['zylen_theme', 'everlight_theme'],
  // Special cases (not part of STORAGE_KEYS):
  ['zylen.mood.entries', 'everlight.mood.entries'],
  ['zylen_supabase_auth', 'everlight_supabase_auth'], // highest-risk: auth session
];

/**
 * Copy any legacy `zylen_*` localStorage entries to their `everlight_*`
 * counterparts. Runs once (guarded by a sentinel); a no-op afterwards.
 */
export function runStorageMigration(): void {
  if (typeof localStorage === 'undefined') return;

  try {
    if (localStorage.getItem(MIGRATION_SENTINEL) === '1') return;

    for (const [oldKey, newKey] of KEY_MIGRATIONS) {
      const oldValue = localStorage.getItem(oldKey);
      // Only migrate when the old key exists and the new one hasn't been set.
      if (oldValue !== null && localStorage.getItem(newKey) === null) {
        localStorage.setItem(newKey, oldValue);
      }
    }

    localStorage.setItem(MIGRATION_SENTINEL, '1');
  } catch {
    // localStorage can throw (e.g. private mode, quota). Failing the
    // migration must never crash app boot — new users simply start fresh.
  }
}

// Run on module load. This module is imported FIRST (and has no transitive
// dependency on src/lib/supabase.ts), so ES-module post-order evaluation
// guarantees this runs before the Supabase client is constructed.
runStorageMigration();
