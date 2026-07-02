/**
 * SessionBrokenScreen — the gem shattered (abandon / pause overrun /
 * expiry). The shared broken artwork gets the species' accent as a dim
 * glow behind it.
 */

import { RotateCcw } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import type { FocusBreakReason, GemSpecies } from '@/types/focus';
import { GEM_BROKEN_IMAGE, speciesMeta } from '../utils/gemAssets';

interface SessionBrokenScreenProps {
  reason: FocusBreakReason;
  species: GemSpecies | null;
  onRetry: () => void;
}

const REASON_KEY: Record<FocusBreakReason, string> = {
  paused_too_long: 'focus.brokenPause',
  abandoned: 'focus.brokenAbandon',
  expired: 'focus.brokenExpired',
};

export function SessionBrokenScreen({
  reason,
  species,
  onRetry,
}: SessionBrokenScreenProps) {
  const { t } = useLocale();
  const meta = species ? speciesMeta(species) : null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 py-8">
      <div className="relative grid place-items-center">
        <div
          className="absolute w-48 h-48 rounded-full blur-3xl opacity-25"
          style={{ backgroundColor: meta?.color ?? '#2DD4BF' }}
        />
        <img
          src={GEM_BROKEN_IMAGE}
          alt=""
          aria-hidden="true"
          className="relative w-44 h-44 object-contain saturate-50 animate-pop-in motion-reduce:animate-none drop-shadow-[0_14px_24px_rgba(0,0,0,0.6)]"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>

      <div className="text-center px-8">
        <p className="text-3xl mb-2">💔</p>
        <h2 className="text-white text-2xl font-extrabold">
          {t('focus.brokenTitle')}
        </h2>
        <p className="text-white/60 text-sm mt-2 leading-relaxed">
          {t(REASON_KEY[reason])}
        </p>
      </div>

      <div className="w-full px-6 max-w-sm">
        <button type="button" onClick={onRetry} className="btn-primary w-full">
          <RotateCcw size={18} /> {t('focus.retry')}
        </button>
      </div>
    </div>
  );
}
