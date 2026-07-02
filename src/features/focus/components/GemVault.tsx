/**
 * GemVault — "Bóveda de gemas": period tabs (Hoy/Semana/Mes/Año), stat
 * cards, the isometric platform where the period's gems grow, the species
 * collection rail and the Arena power teaser.
 */

import { useMemo, useState } from 'react';
import { Clock, Gem, HeartCrack, Lock, ShieldCheck, Swords } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useLocale } from '@/hooks/useLocale';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { FOCUS_CONFIG } from '@/constants/config';
import {
  GEM_SPECIES,
  type FocusStats,
  type FocusVaultPeriod,
} from '@/types/focus';
import { getIcon } from '@/components/atoms/icons/iconMaps';
import { gemStageImage, speciesMeta, totalGems } from '../utils/gemAssets';
import { MAX_PLATFORM_TILES } from '../utils/platformAnchors';
import { VaultPlatform } from './VaultPlatform';

interface GemVaultProps {
  stats: FocusStats;
}

const PERIODS: Array<{ key: FocusVaultPeriod; labelKey: string }> = [
  { key: 'today', labelKey: 'focus.vaultToday' },
  { key: 'week', labelKey: 'focus.vaultWeek' },
  { key: 'month', labelKey: 'focus.vaultMonth' },
  { key: 'year', labelKey: 'focus.vaultYear' },
];

export function GemVault({ stats }: GemVaultProps) {
  const { t } = useLocale();
  const [period, setPeriod] = useState<FocusVaultPeriod>('today');

  const periodStats = stats[period];
  const animatedGems = useAnimatedNumber(periodStats.completed);
  const animatedMinutes = useAnimatedNumber(periodStats.minutes);

  // Period sessions are a prefix of the newest-first list (all windows end
  // at now), so filter + cap is lossless up to the grid size.
  const periodSessions = useMemo(() => {
    const start = new Date(stats.periodStarts[period]).getTime();
    return stats.recentSessions
      .filter((s) => s.endedAt && new Date(s.endedAt).getTime() >= start)
      .slice(0, MAX_PLATFORM_TILES);
  }, [stats.recentSessions, stats.periodStarts, period]);

  const total = totalGems(stats.speciesCounts);
  const shieldTarget = FOCUS_CONFIG.arena.shieldUnlockGems;
  const shieldUnlocked = total >= shieldTarget;

  return (
    <div className="w-full space-y-4 pb-2">
      {/* Period tabs */}
      <div className="flex gap-1 p-1 rounded-2xl bg-white/5">
        {PERIODS.map(({ key, labelKey }) => (
          <button
            key={key}
            type="button"
            onClick={() => setPeriod(key)}
            className={cn(
              'flex-1 py-2 rounded-xl text-[13px] font-semibold transition-all',
              period === key
                ? 'bg-teal-500 text-white shadow-glow-teal'
                : 'text-white/60 hover:text-white'
            )}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="glass-card p-3 flex flex-col items-center gap-1">
          <span className="w-7 h-7 rounded-full bg-teal-500/15 grid place-items-center">
            <Gem size={14} className="text-teal-300" />
          </span>
          <p className="text-xl font-extrabold text-white tabular-nums leading-none">
            {animatedGems}
          </p>
          <p className="text-white/55 text-[11px] font-semibold">
            {t('focus.statsGems')}
          </p>
        </div>
        <div className="glass-card p-3 flex flex-col items-center gap-1">
          <span className="w-7 h-7 rounded-full bg-sky-500/15 grid place-items-center">
            <Clock size={14} className="text-sky-300" />
          </span>
          <p className="text-xl font-extrabold text-white tabular-nums leading-none">
            {animatedMinutes}
          </p>
          <p className="text-white/55 text-[11px] font-semibold">
            {t('focus.statsMinutes')}
          </p>
        </div>
        <div className="glass-card p-3 flex flex-col items-center gap-1">
          <span className="w-7 h-7 rounded-full bg-purple-500/15 grid place-items-center">
            <HeartCrack size={14} className="text-purple-300" />
          </span>
          <p className="text-xl font-extrabold text-white tabular-nums leading-none">
            {periodStats.broken}
          </p>
          <p className="text-white/55 text-[11px] font-semibold">
            {t('focus.statsBroken')}
          </p>
        </div>
      </div>

      {/* The platform */}
      <VaultPlatform sessions={periodSessions} periodStats={periodStats} />

      {/* Species collection rail */}
      <div className="glass-card p-4">
        <h3 className="text-white text-sm font-bold mb-3">
          {t('focus.speciesTotals')}
        </h3>
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {GEM_SPECIES.map((species) => {
            const meta = speciesMeta(species);
            const Icon = getIcon(meta.iconName);
            const count = stats.speciesCounts[species] ?? 0;
            return (
              <div
                key={species}
                className={cn(
                  'shrink-0 w-[72px] rounded-2xl border border-white/10 bg-white/5 p-2 flex flex-col items-center gap-1',
                  count === 0 && 'opacity-45'
                )}
              >
                <img
                  src={gemStageImage(species, 4)}
                  alt=""
                  aria-hidden="true"
                  className="w-10 h-10 object-contain"
                  onError={(e) => {
                    if (e.currentTarget.dataset.fallback) return;
                    e.currentTarget.dataset.fallback = '1';
                    e.currentTarget.src = meta.image;
                  }}
                />
                <span className="flex items-center gap-1">
                  <Icon size={10} style={{ color: meta.color }} />
                  <span className="text-white/80 text-[11px] font-bold tabular-nums">
                    ×{count}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Arena power teaser */}
      <div className="glass-card p-4">
        <h3 className="text-white text-sm font-bold mb-1 flex items-center gap-1.5">
          <Swords size={15} className="text-purple-300" />
          {t('focus.arenaPower')}
        </h3>
        <p className="text-white/55 text-xs leading-snug mb-3">
          {t('focus.arenaPowerHint')}
        </p>
        <div className="flex items-center gap-2">
          {shieldUnlocked ? (
            <ShieldCheck size={18} className="text-teal-300 shrink-0" />
          ) : (
            <Lock size={16} className="text-white/40 shrink-0" />
          )}
          <div className="flex-1">
            <p
              className={cn(
                'text-xs font-bold',
                shieldUnlocked ? 'text-teal-300' : 'text-white/70'
              )}
            >
              {t('focus.shieldProgress', {
                count: Math.min(total, shieldTarget),
                total: shieldTarget,
              })}
            </p>
            <div className="mt-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-500 to-purple-500 transition-all"
                style={{
                  width: `${Math.min(100, (total / shieldTarget) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
