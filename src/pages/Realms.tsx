/**
 * Realms — "Reinos de enfoque". Immersive gallery of the life areas as
 * fantasy realms: gem illustration, level, light (XP) progress and habit
 * count per realm. Tapping a realm opens its detail bottom-sheet.
 */

import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Loader2, MoonStar } from 'lucide-react';
import { useHabits, useLifeAreas } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { getAreaLevelProgress } from '@/utils/xp';
import { getLifeAreaMeta } from '@/constants';
import { getIcon } from '@/components/atoms/icons/iconMaps';
import { RealmDetailSheet } from '@/features/realms/components';
import type { LifeArea } from '@/types';

export function Realms() {
  const { lifeAreas, lifeAreasLoading } = useLifeAreas();
  const { habits } = useHabits();
  const { t } = useLocale();
  const location = useLocation();
  const [selectedArea, setSelectedArea] = useState<LifeArea | null>(null);
  const deepOpened = useRef(false);

  // Deep-open a realm when navigated with { state: { areaId } } (e.g. from
  // the focus-areas rows in Progress).
  useEffect(() => {
    if (deepOpened.current) return;
    const areaId = (location.state as { areaId?: string } | null)?.areaId;
    if (!areaId || lifeAreas.length === 0) return;
    const target = lifeAreas.find((a) => a.id === areaId);
    if (target) {
      setSelectedArea(target);
      deepOpened.current = true;
    }
  }, [lifeAreas, location.state]);

  if (lifeAreasLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-500 animate-spin mx-auto mb-4" />
          <p className="text-white font-semibold">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Awake (enabled) realms first; the strongest lead within each group.
  const sortedAreas = [...lifeAreas].sort(
    (a, b) =>
      Number(b.enabled) - Number(a.enabled) ||
      b.level - a.level ||
      b.totalXP - a.totalXP
  );

  return (
    <div className="relative max-w-md mx-auto px-4">
      {/* Atmospheric backdrop: faint teal/gold light bleeding from the top */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-16 h-80"
        style={{
          background:
            'radial-gradient(55% 45% at 25% 0%, hsl(var(--primary) / 0.14), transparent 70%), radial-gradient(45% 40% at 85% 8%, hsl(42 90% 55% / 0.10), transparent 70%)',
        }}
      />

      <header className="relative pt-2 pb-5">
        <h1 className="font-sans normal-case text-[28px] font-extrabold text-white leading-tight">
          {t('realms.title')}
        </h1>
        <p className="text-white/70 text-sm mt-1 leading-snug">{t('realms.subtitle')}</p>
      </header>

      {sortedAreas.length === 0 ? (
        <p className="relative text-white/50 text-sm text-center py-10">{t('realms.empty')}</p>
      ) : (
        <div className="relative grid grid-cols-2 gap-3">
          {sortedAreas.map((area) => {
            const meta = getLifeAreaMeta(area);
            const Icon = getIcon(meta.iconName);
            const label = t(meta.i18nKey, { defaultValue: String(area.area) });
            const prog = getAreaLevelProgress(area.totalXP, area.level);
            const pct =
              prog.max > 0 ? Math.min(Math.max((prog.current / prog.max) * 100, 0), 100) : 0;
            const habitCount = habits.filter((h) => h.lifeArea === area.id).length;

            return (
              <button
                key={area.id}
                type="button"
                onClick={() => setSelectedArea(area)}
                className={`glass-card relative overflow-hidden p-4 flex flex-col items-center text-center transition-transform duration-200 active:scale-[0.97] ${
                  area.enabled ? '' : 'opacity-55 saturate-50'
                }`}
                aria-label={label}
              >
                {/* Ambient glow behind the gem */}
                <span
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(circle at 50% 30%, ${meta.color}30, transparent 68%)`,
                  }}
                />

                {!area.enabled && (
                  <span className="absolute top-2.5 right-2.5 z-10 inline-flex items-center gap-1 rounded-full bg-black/40 border border-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/70">
                    <MoonStar size={10} /> {t('realms.dormant')}
                  </span>
                )}

                <span className="relative w-24 h-24 grid place-items-center mb-2">
                  <img
                    src={meta.image}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="w-full h-full object-contain drop-shadow-lg"
                    onError={(e) => {
                      // Fall back to the colored lucide icon if the gem is missing.
                      const img = e.currentTarget;
                      img.style.display = 'none';
                      const fb = img.nextElementSibling as HTMLElement | null;
                      if (fb) {
                        fb.style.display = 'flex';
                        fb.style.backgroundColor = meta.color;
                      }
                    }}
                  />
                  <span className="absolute inset-4 rounded-full hidden items-center justify-center">
                    <Icon size={34} className="text-white" />
                  </span>
                </span>

                <span className="relative block w-full">
                  <span className="block text-white font-bold text-sm truncate">{label}</span>
                  <span className="block text-white/55 text-[11px] font-medium mt-0.5">
                    {t('realms.levelLabel', { level: area.level })} ·{' '}
                    {t('realms.habitsCount', { count: habitCount })}
                  </span>
                  <span className="mt-2 block h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <span
                      className="block h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: meta.color }}
                    />
                  </span>
                  <span className="mt-1 block text-white/45 text-[10px] font-medium">
                    {prog.current} / {prog.max} {t('progress.xp')}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {selectedArea && (
        <RealmDetailSheet area={selectedArea} onClose={() => setSelectedArea(null)} />
      )}
    </div>
  );
}
