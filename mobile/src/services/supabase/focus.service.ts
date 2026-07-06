/**
 * Focus Service - Supabase Implementation
 *
 * Gems (focus tags) are plain table CRUD under RLS; sessions are written
 * exclusively through SECURITY DEFINER RPCs (start/complete/break) so the
 * server owns timing validation, XP award and idempotency.
 *
 * Dev bypass: with SKIP_AUTH the whole service operates on a local kv
 * storage blob so the feature demos offline. The slice and UI stay
 * branch-free; the dev adapter omits profile totals in the completion
 * payload and the slice falls back to local increments.
 */

import { supabase } from '@/lib/supabase';
import { FOCUS_CONFIG } from '@/constants/config';
import type {
  CompleteFocusSessionResult,
  FocusBreakReason,
  FocusGem,
  FocusGemFormData,
  FocusSessionRecord,
  FocusSpeciesState,
  FocusStats,
  GemSpecies,
  SpeciesCounts,
  StartFocusSessionResult,
  UnlockSpeciesResult,
} from '@/types/focus';
import { GEM_SPECIES } from '@/types/focus';
import { getAuthUserId } from './utils';
import { ENV } from '@/lib/env';
import { kv } from '@/lib/kvStorage';

/** Mirror of the focus_gem_species seed (dev adapter pricing). */
const SPECIES_PRICING: Record<GemSpecies, number> = {
  health: 0,
  career: 0,
  creativity: 150,
  finance: 150,
  social: 200,
  family: 250,
};
const DEFAULT_UNLOCKED: GemSpecies[] = ['health', 'career'];

const shouldSkipAuth =
  ENV.SKIP_AUTH;

/* ------------------------------------------------------------------------ */
/* Row mapping                                                              */
/* ------------------------------------------------------------------------ */

interface FocusGemRow {
  id: string;
  name: string;
  species: string;
  habit_id: string | null;
  activity: string | null;
  created_at: string;
}

function mapGemRow(row: FocusGemRow): FocusGem {
  return {
    id: row.id,
    name: row.name,
    species: row.species as GemSpecies,
    habitId: row.habit_id,
    activity: row.activity,
    createdAt: new Date(row.created_at),
  };
}

interface CompleteFocusSessionRpc {
  session_id: string;
  broken: boolean;
  reason?: FocusBreakReason;
  xp_awarded?: number;
  points_awarded?: number;
  capped?: boolean;
  new_total_xp?: number;
  new_level?: number;
  leveled_up?: boolean;
  new_points?: number;
  life_area?: {
    id: string;
    total_xp: number;
    level: number;
    leveled_up: boolean;
  } | null;
  species_counts?: SpeciesCounts;
}

interface FocusPeriodRpc {
  completed: number;
  broken: number;
  minutes: number;
  xp: number;
}

interface FocusStatsRpc {
  species_counts: SpeciesCounts;
  today: FocusPeriodRpc;
  week: FocusPeriodRpc;
  month?: FocusPeriodRpc;
  year?: FocusPeriodRpc;
  period_starts?: { today: string; week: string; month: string; year: string };
  recent_sessions: Array<{
    id: string;
    species: GemSpecies;
    duration_minutes: number;
    started_at: string;
    ended_at: string | null;
    status: 'completed' | 'broken';
    break_reason: FocusBreakReason | null;
    xp_awarded: number;
    gem_name: string | null;
  }>;
}

const EMPTY_PERIOD = { completed: 0, broken: 0, minutes: 0, xp: 0 };

/** Local-midnight fallbacks in case the backend predates the periods migration. */
function localPeriodStarts(): FocusStats['periodStarts'] {
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  const week = new Date(midnight);
  week.setDate(week.getDate() - 6);
  const month = new Date(midnight.getFullYear(), midnight.getMonth(), 1);
  const year = new Date(midnight.getFullYear(), 0, 1);
  return {
    today: midnight.toISOString(),
    week: week.toISOString(),
    month: month.toISOString(),
    year: year.toISOString(),
  };
}

function mapStatsRpc(data: FocusStatsRpc): FocusStats {
  return {
    speciesCounts: data.species_counts ?? {},
    today: data.today ?? EMPTY_PERIOD,
    week: data.week ?? EMPTY_PERIOD,
    month: data.month ?? EMPTY_PERIOD,
    year: data.year ?? EMPTY_PERIOD,
    periodStarts: data.period_starts ?? localPeriodStarts(),
    recentSessions: (data.recent_sessions ?? []).map((s) => ({
      id: s.id,
      species: s.species,
      durationMinutes: s.duration_minutes,
      startedAt: s.started_at,
      endedAt: s.ended_at,
      status: s.status,
      breakReason: s.break_reason,
      xpAwarded: s.xp_awarded,
      gemName: s.gem_name,
    })),
  };
}

/* ------------------------------------------------------------------------ */
/* Dev (SKIP_AUTH) adapter — kv-backed                                       */
/* ------------------------------------------------------------------------ */

interface DevSession {
  id: string;
  gemId: string | null;
  species: GemSpecies;
  durationMinutes: number;
  startedAt: string;
  endedAt: string | null;
  status: 'running' | 'completed' | 'broken';
  breakReason: FocusBreakReason | null;
  xpAwarded: number;
  gemName: string | null;
}

interface DevBlob {
  gems: FocusGemRow[];
  sessions: DevSession[];
  /** Paid species unlocked in dev mode (defaults excluded). */
  unlocked?: string[];
}

function devLoad(): DevBlob {
  try {
    const raw = kv.getItem(FOCUS_CONFIG.devStorageKey);
    if (raw) return JSON.parse(raw) as DevBlob;
  } catch {
    /* corrupted blob -> reseed */
  }
  const seeded: DevBlob = {
    gems: [
      {
        id: 'dev-gem-study',
        name: 'Estudio',
        species: 'career',
        habit_id: null,
        activity: 'Estudiar',
        created_at: new Date().toISOString(),
      },
      {
        id: 'dev-gem-meditation',
        name: 'Meditación',
        species: 'health',
        habit_id: 'dev-meditation',
        activity: null,
        created_at: new Date().toISOString(),
      },
    ],
    sessions: [],
    unlocked: [],
  };
  devSave(seeded);
  return seeded;
}

function devSave(blob: DevBlob): void {
  kv.setItem(FOCUS_CONFIG.devStorageKey, JSON.stringify(blob));
}

function devSpeciesCounts(blob: DevBlob): SpeciesCounts {
  const counts: SpeciesCounts = {};
  for (const s of blob.sessions) {
    if (s.status !== 'completed') continue;
    counts[s.species] = (counts[s.species] ?? 0) + 1;
  }
  return counts;
}

function devPeriodStats(sessions: DevSession[], since: Date) {
  const inRange = sessions.filter(
    (s) => s.endedAt && new Date(s.endedAt) >= since
  );
  const completed = inRange.filter((s) => s.status === 'completed');
  return {
    completed: completed.length,
    broken: inRange.filter((s) => s.status === 'broken').length,
    minutes: completed.reduce((sum, s) => sum + s.durationMinutes, 0),
    xp: completed.reduce((sum, s) => sum + s.xpAwarded, 0),
  };
}

/* ------------------------------------------------------------------------ */
/* Service                                                                  */
/* ------------------------------------------------------------------------ */

export class FocusService {
  /** Species availability for this user (default free + purchased unlocks). */
  static async getSpeciesState(): Promise<FocusSpeciesState[]> {
    if (shouldSkipAuth) {
      const blob = devLoad();
      const unlocked = new Set(blob.unlocked ?? []);
      return GEM_SPECIES.map((key) => ({
        key,
        price: SPECIES_PRICING[key],
        isDefault: DEFAULT_UNLOCKED.includes(key),
        unlocked: DEFAULT_UNLOCKED.includes(key) || unlocked.has(key),
      }));
    }

    const userId = await getAuthUserId();
    const [speciesRes, unlocksRes] = await Promise.all([
      supabase
        .from('focus_gem_species')
        .select('key, is_default, price_points, sort_order')
        .order('sort_order'),
      supabase
        .from('focus_species_unlocks')
        .select('species')
        .eq('user_id', userId),
    ]);

    if (speciesRes.error) {
      console.error('Error in FocusService.getSpeciesState:', speciesRes.error);
      throw new Error('Failed to load species');
    }
    const unlocked = new Set(
      (unlocksRes.data ?? []).map((u) => u.species as GemSpecies)
    );
    return (speciesRes.data ?? []).map((s) => ({
      key: s.key as GemSpecies,
      price: s.price_points,
      isDefault: s.is_default,
      unlocked: s.is_default || unlocked.has(s.key as GemSpecies),
    }));
  }

  /** Buy a species with points; the RPC validates balance atomically. */
  static async unlockSpecies(species: GemSpecies): Promise<UnlockSpeciesResult> {
    if (shouldSkipAuth) {
      const blob = devLoad();
      const unlocked = new Set(blob.unlocked ?? []);
      if (DEFAULT_UNLOCKED.includes(species) || unlocked.has(species)) {
        throw new Error('species_already_unlocked');
      }
      unlocked.add(species);
      blob.unlocked = Array.from(unlocked);
      devSave(blob);
      return { species, pointsPaid: SPECIES_PRICING[species] };
    }

    const { data, error } = await supabase.rpc('unlock_focus_species', {
      p_species: species,
    });

    if (error) {
      console.error('Error in FocusService.unlockSpecies:', error);
      throw new Error(error.message || 'Failed to unlock species');
    }
    const result = data as unknown as {
      species: GemSpecies;
      points_paid: number;
      new_points: number;
    };
    return {
      species: result.species,
      pointsPaid: result.points_paid,
      newPoints: result.new_points,
    };
  }

  static async getGems(): Promise<FocusGem[]> {
    if (shouldSkipAuth) {
      return devLoad().gems.map(mapGemRow);
    }

    const userId = await getAuthUserId();
    const { data, error } = await supabase
      .from('focus_gems')
      .select('id, name, species, habit_id, activity, created_at')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('created_at');

    if (error) {
      console.error('Error in FocusService.getGems:', error);
      throw new Error('Failed to load gems');
    }
    return ((data ?? []) as FocusGemRow[]).map(mapGemRow);
  }

  static async createGem(form: FocusGemFormData): Promise<FocusGem> {
    if (shouldSkipAuth) {
      const blob = devLoad();
      const row: FocusGemRow = {
        id: `dev-gem-${Date.now()}`,
        name: form.name,
        species: form.species,
        habit_id: form.habitId ?? null,
        activity: form.activity ?? null,
        created_at: new Date().toISOString(),
      };
      blob.gems.push(row);
      devSave(blob);
      return mapGemRow(row);
    }

    const userId = await getAuthUserId();
    const { data, error } = await supabase
      .from('focus_gems')
      .insert({
        user_id: userId,
        name: form.name,
        species: form.species,
        habit_id: form.habitId ?? null,
        activity: form.activity ?? null,
      })
      .select('id, name, species, habit_id, activity, created_at')
      .single();

    if (error) {
      console.error('Error in FocusService.createGem:', error);
      throw new Error('Failed to create gem');
    }
    return mapGemRow(data as FocusGemRow);
  }

  static async archiveGem(gemId: string): Promise<void> {
    if (shouldSkipAuth) {
      const blob = devLoad();
      blob.gems = blob.gems.filter((g) => g.id !== gemId);
      devSave(blob);
      return;
    }

    const userId = await getAuthUserId();
    const { error } = await supabase
      .from('focus_gems')
      .update({ is_archived: true })
      .eq('id', gemId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error in FocusService.archiveGem:', error);
      throw new Error('Failed to archive gem');
    }
  }

  static async startSession(
    gemId: string,
    durationMinutes: number
  ): Promise<StartFocusSessionResult> {
    if (shouldSkipAuth) {
      const blob = devLoad();
      const gem = blob.gems.find((g) => g.id === gemId);
      if (!gem) throw new Error('gem_not_found');

      const running = blob.sessions.find((s) => s.status === 'running');
      if (running) {
        const expiresAt =
          new Date(running.startedAt).getTime() +
          running.durationMinutes * 60_000 +
          30 * 60_000;
        if (Date.now() > expiresAt) {
          running.status = 'broken';
          running.breakReason = 'expired';
          running.endedAt = new Date().toISOString();
        } else {
          throw new Error('session_already_running');
        }
      }

      const session: DevSession = {
        id: `dev-session-${Date.now()}`,
        gemId,
        species: gem.species as GemSpecies,
        durationMinutes,
        startedAt: new Date().toISOString(),
        endedAt: null,
        status: 'running',
        breakReason: null,
        xpAwarded: 0,
        gemName: gem.name,
      };
      blob.sessions.push(session);
      devSave(blob);
      return {
        sessionId: session.id,
        startedAt: session.startedAt,
        species: session.species,
      };
    }

    const { data, error } = await supabase.rpc('start_focus_session', {
      p_gem_id: gemId,
      p_duration_minutes: durationMinutes,
    });

    if (error) {
      console.error('Error in FocusService.startSession:', error);
      throw new Error(error.message || 'Failed to start session');
    }

    const result = data as unknown as {
      session_id: string;
      started_at: string;
      species: GemSpecies;
    };
    return {
      sessionId: result.session_id,
      startedAt: result.started_at,
      species: result.species,
    };
  }

  static async completeSession(
    sessionId: string
  ): Promise<CompleteFocusSessionResult> {
    if (shouldSkipAuth) {
      const blob = devLoad();
      const session = blob.sessions.find((s) => s.id === sessionId);
      if (!session || session.status !== 'running') {
        throw new Error('session_not_running');
      }

      const nominalEnd =
        new Date(session.startedAt).getTime() +
        session.durationMinutes * 60_000;
      const now = Date.now();
      if (
        now < nominalEnd - FOCUS_CONFIG.completionGraceMs ||
        now >
          nominalEnd + FOCUS_CONFIG.maxPauseMs + FOCUS_CONFIG.returnGraceMs
      ) {
        session.status = 'broken';
        session.breakReason =
          now < nominalEnd - FOCUS_CONFIG.completionGraceMs
            ? 'abandoned'
            : 'expired';
        session.endedAt = new Date().toISOString();
        devSave(blob);
        return {
          sessionId,
          broken: true,
          reason: session.breakReason,
          xpAwarded: 0,
          pointsAwarded: 0,
          capped: false,
          speciesCounts: devSpeciesCounts(blob),
        };
      }

      const midnight = new Date();
      midnight.setHours(0, 0, 0, 0);
      const todayXP = devPeriodStats(
        blob.sessions.filter((s) => s.id !== sessionId),
        midnight
      ).xp;
      const damping =
        todayXP >= FOCUS_CONFIG.dailyXPSoftCap * 1.5
          ? 0.2
          : todayXP >= FOCUS_CONFIG.dailyXPSoftCap
            ? 0.5
            : 1;
      const xpAwarded = Math.max(
        1,
        Math.round(session.durationMinutes * FOCUS_CONFIG.xpPerMinute * damping)
      );
      const pointsAwarded = Math.max(
        1,
        Math.round(xpAwarded * FOCUS_CONFIG.pointsPerXP)
      );

      session.status = 'completed';
      session.endedAt = new Date().toISOString();
      session.xpAwarded = xpAwarded;
      devSave(blob);

      return {
        sessionId,
        broken: false,
        xpAwarded,
        pointsAwarded,
        capped: damping < 1,
        speciesCounts: devSpeciesCounts(blob),
      };
    }

    const { data, error } = await supabase.rpc('complete_focus_session', {
      p_session_id: sessionId,
    });

    if (error) {
      console.error('Error in FocusService.completeSession:', error);
      throw new Error(error.message || 'Failed to complete session');
    }

    const result = data as unknown as CompleteFocusSessionRpc;
    return {
      sessionId: result.session_id,
      broken: result.broken,
      reason: result.reason,
      xpAwarded: result.xp_awarded ?? 0,
      pointsAwarded: result.points_awarded ?? 0,
      capped: result.capped ?? false,
      newTotalXP: result.new_total_xp,
      newLevel: result.new_level,
      leveledUp: result.leveled_up,
      newPoints: result.new_points,
      lifeArea: result.life_area
        ? {
            id: result.life_area.id,
            totalXP: result.life_area.total_xp,
            level: result.life_area.level,
            leveledUp: result.life_area.leveled_up,
          }
        : null,
      speciesCounts: result.species_counts ?? {},
    };
  }

  static async breakSession(
    sessionId: string,
    reason: FocusBreakReason
  ): Promise<void> {
    if (shouldSkipAuth) {
      const blob = devLoad();
      const session = blob.sessions.find((s) => s.id === sessionId);
      if (!session || session.status !== 'running') {
        throw new Error('session_not_running');
      }
      session.status = 'broken';
      session.breakReason = reason;
      session.endedAt = new Date().toISOString();
      devSave(blob);
      return;
    }

    const { error } = await supabase.rpc('break_focus_session', {
      p_session_id: sessionId,
      p_reason: reason,
    });

    if (error) {
      console.error('Error in FocusService.breakSession:', error);
      throw new Error(error.message || 'Failed to break session');
    }
  }

  static async getStats(): Promise<FocusStats> {
    if (shouldSkipAuth) {
      const blob = devLoad();
      const midnight = new Date();
      midnight.setHours(0, 0, 0, 0);
      const weekStart = new Date(midnight);
      weekStart.setDate(weekStart.getDate() - 6);
      const monthStart = new Date(midnight.getFullYear(), midnight.getMonth(), 1);
      const yearStart = new Date(midnight.getFullYear(), 0, 1);

      const recent: FocusSessionRecord[] = blob.sessions
        .filter((s) => s.status !== 'running')
        .sort(
          (a, b) =>
            new Date(b.endedAt ?? 0).getTime() -
            new Date(a.endedAt ?? 0).getTime()
        )
        .slice(0, 50)
        .map((s) => ({
          id: s.id,
          species: s.species,
          durationMinutes: s.durationMinutes,
          startedAt: s.startedAt,
          endedAt: s.endedAt,
          status: s.status,
          breakReason: s.breakReason,
          xpAwarded: s.xpAwarded,
          gemName: s.gemName,
        }));

      return {
        speciesCounts: devSpeciesCounts(blob),
        today: devPeriodStats(blob.sessions, midnight),
        week: devPeriodStats(blob.sessions, weekStart),
        month: devPeriodStats(blob.sessions, monthStart),
        year: devPeriodStats(blob.sessions, yearStart),
        periodStarts: {
          today: midnight.toISOString(),
          week: weekStart.toISOString(),
          month: monthStart.toISOString(),
          year: yearStart.toISOString(),
        },
        recentSessions: recent,
      };
    }

    const { data, error } = await supabase.rpc('get_focus_stats');

    if (error) {
      console.error('Error in FocusService.getStats:', error);
      throw new Error(error.message || 'Failed to load focus stats');
    }
    return mapStatsRpc(data as unknown as FocusStatsRpc);
  }
}
