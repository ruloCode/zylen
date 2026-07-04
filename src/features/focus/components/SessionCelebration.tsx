/**
 * SessionCelebration — the grown gem pops in with a shard burst, floating
 * "+XP" and animated totals.
 */

import { Gem, Sparkles } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import type {
  CompleteFocusSessionResult,
  GemSpecies,
} from '@/types/focus';
import { gemStageImage, speciesMeta } from '../utils/gemAssets';
import { displayGemName } from '../utils/displayGemName';

interface SessionCelebrationProps {
  result: CompleteFocusSessionResult;
  species: GemSpecies;
  gemName: string;
  onAgain: () => void;
  onVault: () => void;
}

const BURST_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export function SessionCelebration({
  result,
  species,
  gemName,
  onAgain,
  onVault,
}: SessionCelebrationProps) {
  const { t } = useLocale();
  const meta = speciesMeta(species);
  const animatedXP = useAnimatedNumber(result.xpAwarded);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 py-8">
      <div className="relative grid place-items-center">
        {/* Species glow */}
        <div
          className="absolute w-56 h-56 rounded-full blur-3xl opacity-50 animate-glow-pulse"
          style={{ backgroundColor: meta.color }}
        />
        {/* Shard burst */}
        {BURST_ANGLES.map((angle) => {
          const rad = (angle * Math.PI) / 180;
          return (
            <span
              key={angle}
              className="absolute w-2 h-2 rounded-sm animate-burst-particle motion-reduce:animate-none"
              style={{
                backgroundColor: meta.color,
                ['--burst-x' as string]: `${Math.cos(rad) * 110}px`,
                ['--burst-y' as string]: `${Math.sin(rad) * 110}px`,
              }}
            />
          );
        })}
        <img
          src={gemStageImage(species, 4)}
          alt=""
          aria-hidden="true"
          className="relative w-48 h-48 object-contain animate-pop-in motion-reduce:animate-none drop-shadow-[0_16px_28px_rgba(0,0,0,0.6)]"
          onError={(e) => {
            if (e.currentTarget.dataset.fallback) return;
            e.currentTarget.dataset.fallback = '1';
            e.currentTarget.src = meta.image;
          }}
        />
        {/* Floating XP */}
        <span className="absolute -top-3 text-shimmer-gold text-xl font-extrabold animate-xp-float motion-reduce:animate-none">
          +{result.xpAwarded} {t('common.xp')}
        </span>
      </div>

      <div className="text-center px-6">
        <h2 className="text-white text-2xl font-extrabold flex items-center justify-center gap-2">
          <Sparkles size={20} className="text-gold-400" />
          {t('focus.completeTitle')}
        </h2>
        <p className="text-white/70 text-sm font-semibold mt-1">
          {displayGemName(gemName, t)}
        </p>
        <p className="text-gold-300 font-bold text-lg mt-3 tabular-nums">
          {t('focus.completeReward', {
            xp: animatedXP,
            points: result.pointsAwarded,
          })}
        </p>
        {result.capped && (
          <p className="text-white/45 text-xs mt-1">{t('focus.completeCapped')}</p>
        )}
        {result.leveledUp && (
          <p className="text-teal-300 text-sm font-bold mt-2 animate-pop-in">
            {t('levelUp.title')} 🎉
          </p>
        )}
      </div>

      <div className="w-full px-6 flex flex-col gap-2 max-w-sm">
        <button type="button" onClick={onAgain} className="btn-primary w-full">
          {t('focus.growAnother')}
        </button>
        <button
          type="button"
          onClick={onVault}
          className="w-full py-3 rounded-2xl glass-card text-white font-bold text-sm flex items-center justify-center gap-2"
        >
          <Gem size={16} className="text-teal-300" /> {t('focus.vault')}
        </button>
      </div>
    </div>
  );
}
