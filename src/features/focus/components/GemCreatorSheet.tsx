/**
 * GemCreatorSheet — bottom sheet to create a focus gem: name + either a
 * linked habit (species auto-derives from its life area and locks) or a
 * free-form activity + species pick.
 *
 * Species follow Forest-style progression: two are free, the rest are
 * bought with points (Esencia) right from the picker.
 */

import { useMemo, useState } from 'react';
import { X, Gem, Check, Link2, Lock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';
import { useLocale } from '@/hooks/useLocale';
import { useFocus, useHabits, useLifeAreas, useUser } from '@/store';
import type { FocusGem, GemSpecies } from '@/types/focus';
import { GEM_SPECIES } from '@/types/focus';
import { getIcon } from '@/components/atoms/icons/iconMaps';
import { speciesMeta } from '../utils/gemAssets';

interface GemCreatorSheetProps {
  onClose: () => void;
  onCreated: (gem: FocusGem) => void;
}

export function GemCreatorSheet({ onClose, onCreated }: GemCreatorSheetProps) {
  const { t } = useLocale();
  const { createFocusGem, focusSpecies, unlockFocusSpecies } = useFocus();
  const { habits } = useHabits();
  const { getLifeAreaById } = useLifeAreas();
  const { user } = useUser();

  const [name, setName] = useState('');
  const [habitId, setHabitId] = useState<string>('');
  const [activity, setActivity] = useState('');
  const [species, setSpecies] = useState<GemSpecies>('career');
  const [saving, setSaving] = useState(false);
  const [unlockTarget, setUnlockTarget] = useState<GemSpecies | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  const speciesState = useMemo(
    () => new Map(focusSpecies.map((s) => [s.key, s])),
    [focusSpecies]
  );
  const isUnlocked = (key: GemSpecies) =>
    speciesState.get(key)?.unlocked ?? true;
  const priceOf = (key: GemSpecies) => speciesState.get(key)?.price ?? 0;

  // A linked habit derives (and locks) the species from its life area.
  const derivedSpecies = useMemo<GemSpecies | null>(() => {
    if (!habitId) return null;
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return null;
    const area = getLifeAreaById(habit.lifeArea);
    const key = String(area?.area ?? habit.lifeArea).toLowerCase();
    return (GEM_SPECIES as string[]).includes(key)
      ? (key as GemSpecies)
      : null;
  }, [habitId, habits, getLifeAreaById]);

  const effectiveSpecies = derivedSpecies ?? species;
  const effectiveLocked = !isUnlocked(effectiveSpecies);
  const canSave = name.trim().length > 0 && !saving && !effectiveLocked;

  const points = user?.points ?? 0;

  const handleSave = async () => {
    if (!canSave) return;
    try {
      setSaving(true);
      const gem = await createFocusGem({
        name: name.trim().slice(0, 40),
        species: effectiveSpecies,
        habitId: habitId || undefined,
        activity: habitId ? undefined : activity.trim().slice(0, 80) || undefined,
      });
      onCreated(gem);
    } catch {
      toast.error(t('focus.errors.createFailed'));
      setSaving(false);
    }
  };

  const handleUnlock = async () => {
    if (!unlockTarget || unlocking) return;
    const price = priceOf(unlockTarget);
    if (points < price) {
      toast.error(t('focus.creator.insufficientPoints'));
      return;
    }
    try {
      setUnlocking(true);
      await unlockFocusSpecies(unlockTarget);
      toast.success(t('focus.creator.unlocked'));
      if (!derivedSpecies) setSpecies(unlockTarget);
      setUnlockTarget(null);
    } catch {
      toast.error(t('focus.creator.unlockFailed'));
    } finally {
      setUnlocking(false);
    }
  };

  const onSpeciesTap = (key: GemSpecies) => {
    if (derivedSpecies !== null) return;
    if (isUnlocked(key)) {
      setSpecies(key);
    } else {
      setUnlockTarget(key);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full sm:max-w-md bg-charcoal-500 rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-soft-xl p-5 animate-slide-up max-h-[90dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl grid place-items-center bg-teal-500/20 text-teal-300">
            <Gem className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate">
              {t('focus.creator.title')}
            </h3>
          </div>
          <span className="glass-card px-2.5 py-1 text-gold-400 text-xs font-bold whitespace-nowrap">
            ◆ {points}
          </span>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl grid place-items-center bg-white/10 text-white/70 hover:bg-white/15"
            aria-label={t('actions.cancel')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Name */}
        <label className="block mb-4">
          <span className="text-white/70 text-xs font-bold uppercase tracking-wide">
            {t('focus.creator.name')}
          </span>
          <input
            type="text"
            autoFocus
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('focus.creator.namePlaceholder')}
            className="mt-1.5 w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white font-semibold focus:outline-none focus:border-teal-400/60 placeholder:text-white/30"
          />
        </label>

        {/* Optional habit link */}
        <label className="block mb-4">
          <span className="text-white/70 text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
            <Link2 size={12} /> {t('focus.creator.linkHabit')}
          </span>
          <select
            value={habitId}
            onChange={(e) => setHabitId(e.target.value)}
            className="mt-1.5 w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white font-semibold focus:outline-none focus:border-teal-400/60 appearance-none [&>option]:bg-charcoal-500"
          >
            <option value="">{t('focus.creator.noHabit')}</option>
            {habits.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </label>

        {/* Free-form activity (only without a habit) */}
        {!habitId && (
          <label className="block mb-4">
            <span className="text-white/70 text-xs font-bold uppercase tracking-wide">
              {t('focus.creator.activity')}
            </span>
            <input
              type="text"
              maxLength={80}
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              placeholder={t('focus.creator.activityPlaceholder')}
              className="mt-1.5 w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white font-semibold focus:outline-none focus:border-teal-400/60 placeholder:text-white/30"
            />
          </label>
        )}

        {/* Species */}
        <div className="mb-6">
          <span className="text-white/70 text-xs font-bold uppercase tracking-wide">
            {t('focus.creator.species')}
          </span>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {GEM_SPECIES.map((key) => {
              const meta = speciesMeta(key);
              const Icon = getIcon(meta.iconName);
              const active = effectiveSpecies === key;
              const unlocked = isUnlocked(key);
              const dimmed = derivedSpecies !== null && !active;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={derivedSpecies !== null}
                  onClick={() => onSpeciesTap(key)}
                  className={cn(
                    'relative rounded-2xl border p-2.5 flex flex-col items-center gap-1 transition-all',
                    active
                      ? 'border-2 bg-white/10'
                      : 'border-white/10 bg-white/5',
                    dimmed && 'opacity-30',
                    !unlocked && !dimmed && 'opacity-70'
                  )}
                  style={active ? { borderColor: meta.color } : undefined}
                >
                  {!unlocked && (
                    <span className="absolute top-1.5 right-1.5 text-white/50">
                      <Lock size={11} />
                    </span>
                  )}
                  <Icon
                    size={18}
                    style={{ color: unlocked ? meta.color : '#8a9499' }}
                  />
                  <span className="text-white text-[11px] font-bold leading-tight">
                    {t(meta.i18nKey)}
                  </span>
                  {!unlocked && (
                    <span className="text-gold-400 text-[10px] font-bold">
                      ◆ {priceOf(key)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {derivedSpecies && !effectiveLocked && (
            <p className="text-white/45 text-[11px] mt-1.5">
              {t('focus.creator.speciesLocked')}
            </p>
          )}
          {/* Linked habit's species still locked: offer the unlock inline */}
          {derivedSpecies && effectiveLocked && (
            <button
              type="button"
              onClick={() => setUnlockTarget(derivedSpecies)}
              className="mt-2 w-full py-2.5 rounded-xl bg-gold-500/15 border border-gold-500/40 text-gold-300 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Lock size={12} />
              {t('focus.creator.unlockCta', {
                species: t(speciesMeta(derivedSpecies).i18nKey),
                price: priceOf(derivedSpecies),
              })}
            </button>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={!canSave}
          className="btn-primary w-full disabled:opacity-40"
        >
          <Check className="w-5 h-5" />
          {t('focus.creator.create')}
        </button>

        {/* Unlock confirm */}
        {unlockTarget && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in px-6">
            <div className="w-full max-w-sm bg-charcoal-500 rounded-3xl border border-white/10 p-6 animate-pop-in motion-reduce:animate-none text-center">
              <img
                src={`/gems/${unlockTarget}-stage-4.png`}
                alt=""
                aria-hidden="true"
                className="w-24 h-24 object-contain mx-auto mb-2"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <h3 className="text-white font-bold text-lg mb-1">
                {t('focus.creator.unlockTitle', {
                  species: t(speciesMeta(unlockTarget).i18nKey),
                })}
              </h3>
              <p className="text-white/65 text-sm mb-4">
                {t('focus.creator.unlockBody', {
                  price: priceOf(unlockTarget),
                })}
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleUnlock}
                  disabled={unlocking || points < priceOf(unlockTarget)}
                  className="btn-primary w-full disabled:opacity-40"
                >
                  {unlocking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>◆ {priceOf(unlockTarget)}</span>
                  )}
                  <span>· {t('focus.creator.unlock')}</span>
                </button>
                {points < priceOf(unlockTarget) && (
                  <p className="text-danger-300 text-xs font-semibold">
                    {t('focus.creator.insufficientPoints')}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setUnlockTarget(null)}
                  className="w-full py-2.5 rounded-2xl bg-white/10 text-white/70 font-bold text-sm"
                >
                  {t('actions.cancel')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
