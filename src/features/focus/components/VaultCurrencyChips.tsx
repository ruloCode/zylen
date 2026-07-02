/**
 * VaultCurrencyChips — the vault header's currency row: Luz (XP), Esencia
 * (points) and total gems grown, plus an (i) popover explaining the
 * platform. Values come straight from the store; no backend calls.
 */

import { useState } from 'react';
import { Coins, Gem, Info, Sparkles } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { useUser } from '@/store';
import type { FocusStats } from '@/types/focus';
import { totalGems } from '../utils/gemAssets';

interface VaultCurrencyChipsProps {
  stats: FocusStats | null;
}

export function VaultCurrencyChips({ stats }: VaultCurrencyChipsProps) {
  const { t } = useLocale();
  const { user } = useUser();
  const [infoOpen, setInfoOpen] = useState(false);

  const gems = stats ? totalGems(stats.speciesCounts) : 0;

  return (
    <div className="relative flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => setInfoOpen((o) => !o)}
        aria-label={t('focus.vaultInfo')}
        className="w-7 h-7 rounded-full glass-card grid place-items-center text-white/60 shrink-0"
      >
        <Info size={13} />
      </button>
      <span
        aria-label={t('focus.vaultChipLight')}
        className="glass-card px-2 py-1 flex items-center gap-1 text-[11px] font-bold text-teal-300 whitespace-nowrap"
      >
        <Sparkles size={11} /> {user?.totalXPEarned ?? 0}
      </span>
      <span
        aria-label={t('focus.vaultChipEssence')}
        className="glass-card px-2 py-1 flex items-center gap-1 text-[11px] font-bold text-gold-400 whitespace-nowrap"
      >
        <Coins size={11} /> {user?.points ?? 0}
      </span>
      <span
        aria-label={t('focus.vaultChipGems')}
        className="glass-card px-2 py-1 flex items-center gap-1 text-[11px] font-bold text-purple-300 whitespace-nowrap"
      >
        <Gem size={11} /> {gems}
      </span>

      {infoOpen && (
        <div
          className="absolute top-9 right-0 z-40 w-64 glass-card rounded-2xl p-3 animate-pop-in motion-reduce:animate-none"
          onClick={() => setInfoOpen(false)}
        >
          <p className="text-white/80 text-xs leading-relaxed">
            {t('focus.vaultInfo')}
          </p>
        </div>
      )}
    </div>
  );
}
