/**
 * VaultPlatform — the vault's centerpiece: the isometric jungle platform
 * where the selected period's gems grow on a virtual 5×5 grid (Forest-style
 * forest view). Completed sessions plant their species' full gem; broken
 * ones leave a shattered husk. The portal-altar highlights the latest
 * session with a duration chip. Overflow beyond the grid shows as "+N"
 * (computed from the authoritative aggregates, not the visible list).
 */

import { useMemo } from 'react';
import { Gem, Sparkle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useLocale } from '@/hooks/useLocale';
import type { FocusPeriodStats, FocusSessionRecord } from '@/types/focus';
import {
  GEM_BROKEN_IMAGE,
  VAULT_PLATFORM_IMAGE,
  gemStageImage,
  speciesMeta,
} from '../utils/gemAssets';
import {
  FILL_ORDER,
  MAX_PLATFORM_TILES,
  PLATFORM_ASPECT_CLASS,
  PORTAL_ANCHOR,
  anchorFor,
} from '../utils/platformAnchors';

interface VaultPlatformProps {
  /** Newest-first sessions of the selected period (pre-filtered, ≤ grid size). */
  sessions: FocusSessionRecord[];
  /** Authoritative aggregates of the selected period (for totals/overflow). */
  periodStats: FocusPeriodStats;
}

const debugAnchors =
  import.meta.env.DEV &&
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).has('debugAnchors');

export function VaultPlatform({ sessions, periodStats }: VaultPlatformProps) {
  const { t } = useLocale();

  const placed = useMemo(
    () => sessions.slice(0, MAX_PLATFORM_TILES),
    [sessions]
  );
  const latest = placed[0] ?? null;
  const periodTotal = periodStats.completed + periodStats.broken;
  const overflow = Math.max(0, periodTotal - MAX_PLATFORM_TILES);

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-3xl border border-white/10 shadow-soft-xl -mx-0',
        PLATFORM_ASPECT_CLASS
      )}
    >
      {/* Scene */}
      <img
        src={VAULT_PLATFORM_IMAGE}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Ambient light breathing over the scene */}
      <div className="absolute inset-0 bg-teal-400/5 animate-glow-pulse pointer-events-none motion-reduce:animate-none" />
      {/* Soft top/bottom scrims for chip legibility */}
      <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/45 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent pointer-events-none" />

      {/* Gems on the grid — newest first, front-center outward */}
      {placed.map((session, i) => {
        const [row, col] = FILL_ORDER[i];
        const anchor = anchorFor(row, col);
        const meta = speciesMeta(session.species);
        const broken = session.status === 'broken';
        return (
          <div
            key={session.id}
            className="absolute animate-pop-in motion-reduce:animate-none"
            style={{
              left: `${anchor.xPct}%`,
              top: `${anchor.yPct}%`,
              width: `calc(12.5% * ${anchor.scale})`,
              transform: 'translate(-50%, -82%)',
              zIndex: 10 + row,
              animationDelay: `${Math.min(i, 15) * 45}ms`,
              animationFillMode: 'backwards',
            }}
            title={session.gemName ?? undefined}
          >
            {/* Species-colored ground glow */}
            {!broken && (
              <div
                className="absolute left-1/2 bottom-0 w-[85%] h-[30%] -translate-x-1/2 translate-y-[35%] rounded-full blur-md opacity-55"
                style={{ backgroundColor: meta.color }}
              />
            )}
            <img
              src={broken ? GEM_BROKEN_IMAGE : gemStageImage(session.species, 4)}
              alt=""
              aria-hidden="true"
              className={cn(
                'relative w-full h-auto object-contain drop-shadow-[0_6px_8px_rgba(0,0,0,0.55)]',
                broken && 'saturate-0 opacity-60'
              )}
              onError={(e) => {
                if (e.currentTarget.dataset.fallback) return;
                e.currentTarget.dataset.fallback = '1';
                e.currentTarget.src = meta.image;
              }}
            />
          </div>
        );
      })}

      {/* Portal highlight: latest session's duration */}
      {latest && (
        <div
          className="absolute z-30 -translate-x-1/2 -translate-y-full"
          style={{ left: `${PORTAL_ANCHOR.xPct}%`, top: `${PORTAL_ANCHOR.yPct}%` }}
        >
          <span
            className="glass-card px-2 py-0.5 text-[11px] font-bold text-teal-200 whitespace-nowrap animate-pop-in motion-reduce:animate-none"
            aria-label={t('focus.vaultLatest')}
          >
            {latest.durationMinutes}m
          </span>
        </div>
      )}

      {/* Empty state */}
      {placed.length === 0 && (
        <div className="absolute inset-x-6 bottom-16 z-30 flex justify-center">
          <p className="glass-card px-4 py-2 text-white/80 text-xs font-semibold text-center">
            {t('focus.vaultEmpty')}
          </p>
        </div>
      )}

      {/* Bottom counters + overflow */}
      <div className="absolute bottom-2.5 inset-x-3 z-30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="glass-card px-2 py-1 flex items-center gap-1 text-[11px] font-bold text-teal-200">
            <Gem size={11} /> {periodStats.completed}
          </span>
          <span className="glass-card px-2 py-1 flex items-center gap-1 text-[11px] font-bold text-white/55">
            💔 {periodStats.broken}
          </span>
        </div>
        {overflow > 0 && (
          <span className="glass-card px-2 py-1 flex items-center gap-1 text-[11px] font-bold text-gold-300">
            <Sparkle size={11} /> {t('focus.vaultOverflow', { count: overflow })}
          </span>
        )}
      </div>

      {/* Dev-only anchor calibration overlay (?debugAnchors) */}
      {debugAnchors && (
        <>
          {Array.from({ length: 25 }, (_, i) => {
            const row = Math.floor(i / 5);
            const col = i % 5;
            const a = anchorFor(row, col);
            return (
              <div
                key={`dbg-${row}-${col}`}
                className="absolute z-50 w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 ring-1 ring-white text-[7px] text-white grid place-items-center"
                style={{ left: `${a.xPct}%`, top: `${a.yPct}%` }}
              >
                {row}
                {col}
              </div>
            );
          })}
          <div
            className="absolute z-50 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-400 ring-2 ring-white"
            style={{ left: `${PORTAL_ANCHOR.xPct}%`, top: `${PORTAL_ANCHOR.yPct}%` }}
          />
        </>
      )}
    </div>
  );
}
