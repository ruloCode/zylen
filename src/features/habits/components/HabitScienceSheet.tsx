/**
 * HabitScienceSheet — educational bottom sheet for a catalog habit.
 * Shows what the science says, short/long-term benefits, how to start well
 * and the typical frustrations (with reframes), so the user understands the
 * habit they're about to integrate into their life.
 */

import { X, FlaskConical, Zap, TrendingUp, Lightbulb, ShieldAlert, Plus } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import type { HabitCatalogEntry } from '@/constants/habitCatalog';
import { cn } from '@/utils/cn';

interface HabitScienceSheetProps {
  entry: HabitCatalogEntry;
  onClose: () => void;
  /** optional CTA shown at the bottom (e.g. create this habit from library) */
  onCreate?: () => void;
}

function BulletList({ items, tone }: { items: string[]; tone: string }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-white/80 leading-relaxed">
          <span className={cn('mt-[7px] w-1.5 h-1.5 rounded-full shrink-0', tone)} />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function HabitScienceSheet({ entry, onClose, onCreate }: HabitScienceSheetProps) {
  const { t } = useLocale();
  // Catalog keys are dynamic (habitCatalog.<slug>.*), outside i18next's typed
  // key union — cast so TS accepts the template-string lookups.
  const tk = t as (key: string, opts?: Record<string, unknown>) => string;
  const tl = t as (key: string, opts: { returnObjects: true }) => string[];

  const base = `habitCatalog.${entry.slug}`;
  const title = tk(`${base}.title`);
  const tagline = tk(`${base}.tagline`);
  const summary = tk(`${base}.summary`);
  const science = tk(`${base}.science`);
  const shortTerm = tl(`${base}.shortTerm`, { returnObjects: true });
  const longTerm = tl(`${base}.longTerm`, { returnObjects: true });
  const tips = tl(`${base}.tips`, { returnObjects: true });
  const frustrations = tl(`${base}.frustrations`, { returnObjects: true });

  const HeaderIcon =
    ((LucideIcons as Record<string, unknown>)[entry.iconName] as typeof FlaskConical) ||
    FlaskConical;

  const sectionCard = 'rounded-2xl p-4 bg-white/[0.04] border border-white/10';
  const sectionTitle = 'flex items-center gap-2 text-sm font-bold text-white mb-3';

  return (
    <div
      className="fixed inset-0 z-[115] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-charcoal-500 rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-soft-xl max-h-[92vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={title}
      >
        {/* Close button (floats over the hero illustration) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-xl grid place-items-center bg-black/40 backdrop-blur-sm text-white/80 hover:bg-black/60"
          aria-label={t('actions.close')}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero illustration */}
        <div className="relative h-40 bg-gradient-to-b from-teal-500/10 to-transparent grid place-items-center">
          <img
            src={`/catalog/${entry.slug}.png`}
            alt=""
            aria-hidden="true"
            className="h-36 w-36 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]"
            onError={(e) => {
              // Fall back to the lucide icon if the illustration is missing.
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Title */}
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl grid place-items-center shrink-0 bg-teal-500/15 text-teal-300">
              <HeaderIcon className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-white leading-tight">{title}</h3>
              <p className="text-xs text-teal-300/90 font-semibold">{tagline}</p>
            </div>
          </div>

          {/* Summary */}
          <p className="text-sm text-white/85 leading-relaxed">{summary}</p>

          {/* Science */}
          <div className={cn(sectionCard, 'bg-teal-500/[0.07] border-teal-400/20')}>
            <h4 className={sectionTitle}>
              <FlaskConical size={16} className="text-teal-300" />
              {t('habitScience.whatScience')}
            </h4>
            <p className="text-sm text-white/75 leading-relaxed">{science}</p>
          </div>

          {/* Short term */}
          <div className={sectionCard}>
            <h4 className={sectionTitle}>
              <Zap size={16} className="text-gold-400" />
              {t('habitScience.shortTermTitle')}
            </h4>
            <BulletList items={shortTerm} tone="bg-gold-400" />
          </div>

          {/* Long term */}
          <div className={sectionCard}>
            <h4 className={sectionTitle}>
              <TrendingUp size={16} className="text-success-400" />
              {t('habitScience.longTermTitle')}
            </h4>
            <BulletList items={longTerm} tone="bg-success-400" />
          </div>

          {/* Tips */}
          <div className={sectionCard}>
            <h4 className={sectionTitle}>
              <Lightbulb size={16} className="text-blue-300" />
              {t('habitScience.tipsTitle')}
            </h4>
            <BulletList items={tips} tone="bg-blue-300" />
          </div>

          {/* Frustrations */}
          <div className={cn(sectionCard, 'bg-orange-500/[0.06] border-orange-400/20')}>
            <h4 className={sectionTitle}>
              <ShieldAlert size={16} className="text-orange-300" />
              {t('habitScience.frustrationsTitle')}
            </h4>
            <BulletList items={frustrations} tone="bg-orange-300" />
          </div>

          {/* CTA */}
          {onCreate && (
            <button
              type="button"
              onClick={onCreate}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-white bg-teal-500 hover:bg-teal-600 transition-colors shadow-lg"
            >
              <Plus size={18} />
              {t('habitScience.createCta')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default HabitScienceSheet;
