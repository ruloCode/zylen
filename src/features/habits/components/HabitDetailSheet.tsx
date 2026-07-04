/**
 * HabitDetailSheet — bottom sheet with habit details and quick actions.
 * Lets the user change the time of day and reminder inline, and jump to
 * analytics, full edit, relapse (quit habits) or delete.
 */

import { useState } from 'react';
import {
  X,
  Sun,
  CloudSun,
  Moon,
  LayoutGrid,
  Bell,
  BellOff,
  TrendingUp,
  Pencil,
  Trash2,
  ShieldAlert,
  Check,
  BarChart3,
  Ban,
  FlaskConical,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useHabits } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { HABIT_ICONS } from './IconSelector';
import { HabitScienceSheet } from './HabitScienceSheet';
import { findCatalogEntry } from '@/constants/habitCatalog';
import type { HabitWithCompletion } from '@/services/supabase/habits.service';
import type { TimeOfDay } from '@/types';
import { cn } from '@/utils/cn';

interface HabitDetailSheetProps {
  habit: HabitWithCompletion;
  onClose: () => void;
  onOpenAnalytics: (id: string) => void;
  onOpenEdit: (id: string) => void;
  onRelapse: (id: string) => void;
}

export function HabitDetailSheet({
  habit,
  onClose,
  onOpenAnalytics,
  onOpenEdit,
  onRelapse,
}: HabitDetailSheetProps) {
  const { t } = useLocale();
  const { updateHabit, deleteHabit } = useHabits();
  const [saving, setSaving] = useState(false);
  const [isScienceOpen, setIsScienceOpen] = useState(false);

  // Science-backed catalog entry for this habit (matched by name)
  const catalogEntry = findCatalogEntry(habit.name);

  const Icon = HABIT_ICONS[habit.iconName];
  const habitType = habit.habitType || 'check';
  const timeOfDay = habit.timeOfDay || 'anytime';
  const reminderEnabled = habit.reminderEnabled ?? false;
  const accent = habit.color || '#2dd4bf';

  const typeMeta = {
    check: { icon: Check, label: t('habitForm.typeCheck') },
    measurable: { icon: BarChart3, label: t('habitForm.typeMeasurable') },
    quit: { icon: Ban, label: t('habitForm.typeQuit') },
  }[habitType];
  const TypeIcon = typeMeta.icon;

  const handleTimeOfDay = async (tod: TimeOfDay): Promise<void> => {
    if (tod === timeOfDay || saving) return;
    setSaving(true);
    try {
      await updateHabit(habit.id, { timeOfDay: tod });
      toast.success(t('habitDetail.saved'));
    } catch {
      toast.error(t('errors.habitUpdateFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleReminder = async (): Promise<void> => {
    if (saving) return;
    setSaving(true);
    try {
      await updateHabit(habit.id, { reminderEnabled: !reminderEnabled });
      toast.success(t('habitDetail.saved'));
    } catch {
      toast.error(t('errors.habitUpdateFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!window.confirm(t('habitDetail.deleteConfirm'))) return;
    try {
      await deleteHabit(habit.id);
      toast.success(t('habitDetail.deleted'));
      onClose();
    } catch {
      toast.error(t('errors.habitDeleteFailed'));
    }
  };

  const timeOptions: { key: TimeOfDay; icon: typeof Sun; label: string }[] = [
    { key: 'anytime', icon: LayoutGrid, label: t('habitForm.timeAnytime') },
    { key: 'morning', icon: Sun, label: t('habitForm.timeMorning') },
    { key: 'afternoon', icon: CloudSun, label: t('habitForm.timeAfternoon') },
    { key: 'evening', icon: Moon, label: t('habitForm.timeEvening') },
  ];

  return (
    <div
      className="fixed inset-0 z-[105] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-charcoal-500 rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-soft-xl max-h-[92vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={t('habitDetail.title')}
      >
        {/* Header */}
        <div className="sticky top-0 bg-charcoal-500/95 backdrop-blur-md px-5 py-4 flex items-center gap-3 border-b border-white/10 z-10">
          <span
            className="w-11 h-11 rounded-2xl grid place-items-center shrink-0"
            style={{ backgroundColor: `${accent}26`, color: accent }}
          >
            {Icon && <Icon className="w-6 h-6" />}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate">{habit.name}</h3>
            <p className="text-xs text-white/50 flex items-center gap-1.5">
              <TypeIcon className="w-3.5 h-3.5" /> {typeMeta.label} · {habit.xp} {t('common.xp')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl grid place-items-center bg-white/10 text-white/70 hover:bg-white/15"
            aria-label={t('actions.cancel')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Time of day (inline edit) */}
          <div>
            <span className="block text-sm font-semibold text-white mb-2">
              {t('habitForm.timeOfDay')}
            </span>
            <div className="grid grid-cols-4 gap-2">
              {timeOptions.map(({ key, icon: OptIcon, label }) => {
                const active = timeOfDay === key;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={saving}
                    onClick={() => handleTimeOfDay(key)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border-2 transition-all duration-200',
                      active
                        ? 'border-teal-400 bg-teal-500/15 text-white'
                        : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20',
                      saving && 'opacity-60'
                    )}
                    aria-pressed={active}
                  >
                    <OptIcon className="w-5 h-5" />
                    <span className="text-[11px] font-semibold leading-tight">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reminder toggle */}
          <button
            type="button"
            disabled={saving}
            onClick={handleToggleReminder}
            className={cn(
              'w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left',
              reminderEnabled
                ? 'border-gold-400/40 bg-gold-500/10'
                : 'border-white/10 bg-white/5'
            )}
            aria-pressed={reminderEnabled}
          >
            <span
              className={cn(
                'w-10 h-10 rounded-xl grid place-items-center shrink-0',
                reminderEnabled ? 'bg-gold-500/20 text-gold-400' : 'bg-white/10 text-white/50'
              )}
            >
              {reminderEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-bold text-white">
                {t('habitDetail.reminder')}
              </span>
              <span className="block text-xs text-white/55 mt-0.5">
                {t('habitDetail.reminderHint')}
              </span>
            </span>
            <span
              className={cn(
                'w-11 h-6 rounded-full relative transition-colors shrink-0',
                reminderEnabled ? 'bg-gold-500' : 'bg-white/15'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform',
                  reminderEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'
                )}
              />
            </span>
          </button>

          {/* Actions */}
          <div className="space-y-2.5">
            {catalogEntry && (
              <button
                type="button"
                onClick={() => setIsScienceOpen(true)}
                className="w-full flex items-center gap-3 p-4 rounded-2xl bg-teal-500/10 border border-teal-400/30 hover:border-teal-400/60 transition-all text-left"
              >
                <FlaskConical className="w-5 h-5 text-teal-300 shrink-0" />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-white">
                    {t('habitScience.learnAboutHabit')}
                  </span>
                  <span className="block text-xs text-white/55 mt-0.5 truncate">
                    {(t as (k: string) => string)(`habitCatalog.${catalogEntry.slug}.tagline`)}
                  </span>
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onOpenAnalytics(habit.id)}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-teal-400/40 transition-all text-left"
            >
              <TrendingUp className="w-5 h-5 text-teal-400 shrink-0" />
              <span className="text-sm font-semibold text-white">
                {t('habitDetail.viewAnalytics')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onOpenEdit(habit.id)}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/30 transition-all text-left"
            >
              <Pencil className="w-5 h-5 text-white/70 shrink-0" />
              <span className="text-sm font-semibold text-white">{t('habitDetail.edit')}</span>
            </button>

            {habitType === 'quit' && (
              <button
                type="button"
                onClick={() => onRelapse(habit.id)}
                className="w-full flex items-center gap-3 p-4 rounded-2xl bg-cyan-500/5 border border-cyan-400/20 hover:border-cyan-400/50 transition-all text-left"
              >
                <ShieldAlert className="w-5 h-5 text-cyan-400 shrink-0" />
                <span className="text-sm font-semibold text-white">
                  {t('habitDetail.relapse')}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDelete}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-red-500/5 border border-red-400/20 hover:border-red-400/50 transition-all text-left"
            >
              <Trash2 className="w-5 h-5 text-red-400 shrink-0" />
              <span className="text-sm font-semibold text-red-300">
                {t('habitDetail.delete')}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Science sheet stacked above the detail sheet */}
      {isScienceOpen && catalogEntry && (
        <HabitScienceSheet entry={catalogEntry} onClose={() => setIsScienceOpen(false)} />
      )}
    </div>
  );
}

export default HabitDetailSheet;
