/**
 * GemPicker — horizontal scroll of the user's gems + a "new gem" card.
 * The selected gem gets a species-colored ring and glow.
 */

import { Plus } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useLocale } from '@/hooks/useLocale';
import type { FocusGem } from '@/types/focus';
import { gemStageImage, speciesMeta } from '../utils/gemAssets';

interface GemPickerProps {
  gems: FocusGem[];
  selectedGemId: string | null;
  onSelect: (gemId: string) => void;
  onCreateNew: () => void;
}

export function GemPicker({
  gems,
  selectedGemId,
  onSelect,
  onCreateNew,
}: GemPickerProps) {
  const { t } = useLocale();

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {gems.map((gem) => {
        const meta = speciesMeta(gem.species);
        const selected = gem.id === selectedGemId;
        return (
          <button
            key={gem.id}
            type="button"
            onClick={() => onSelect(gem.id)}
            className={cn(
              'shrink-0 w-28 glass-card p-3 flex flex-col items-center gap-1.5 transition-all',
              selected
                ? 'border-2 shadow-glow-teal scale-[1.02]'
                : 'border border-white/10 opacity-80'
            )}
            style={selected ? { borderColor: meta.color } : undefined}
          >
            <div className="relative w-16 h-16">
              {selected && (
                <div
                  className="absolute inset-0 rounded-full blur-xl opacity-50 animate-glow-pulse"
                  style={{ backgroundColor: meta.color }}
                />
              )}
              <img
                src={gemStageImage(gem.species, 4)}
                alt=""
                aria-hidden="true"
                className="relative w-16 h-16 object-contain"
                onError={(e) => {
                  if (e.currentTarget.dataset.fallback) return;
                  e.currentTarget.dataset.fallback = '1';
                  e.currentTarget.src = meta.image;
                }}
              />
            </div>
            <span className="text-white text-xs font-bold leading-tight truncate w-full text-center">
              {gem.name}
            </span>
            <span
              className="text-[10px] font-semibold truncate w-full text-center"
              style={{ color: meta.color }}
            >
              {t(meta.i18nKey)}
            </span>
          </button>
        );
      })}

      <button
        type="button"
        onClick={onCreateNew}
        className="shrink-0 w-28 rounded-2xl border-2 border-dashed border-white/20 p-3 flex flex-col items-center justify-center gap-2 text-white/60 hover:text-white hover:border-white/40 transition-all min-h-[124px]"
      >
        <span className="w-10 h-10 rounded-full bg-white/10 grid place-items-center">
          <Plus size={20} />
        </span>
        <span className="text-xs font-bold">{t('focus.newGem')}</span>
      </button>
    </div>
  );
}
