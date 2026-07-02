import React, { useState, useEffect } from 'react';
import { X, Check, BarChart3, Ban, Sun, CloudSun, Moon, LayoutGrid } from 'lucide-react';
import { IconSelector, HABIT_ICONS } from './IconSelector';
import { useLifeAreas } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import type { Habit, HabitFormData, HabitType, TimeOfDay } from '@/types';
import { cn } from '@/utils/cn';
import { XP_CONFIG } from '@/constants/config';

const UNIT_OPTIONS = ['min', 'hr', 'sec', 'km', 'mi', 'pages', 'glasses', 'reps', 'kcal', 'words', '$'];

/** Accent swatches aligned with the dark-fantasy palette */
const COLOR_OPTIONS = [
  '#2dd4bf', // teal
  '#60a5fa', // blue
  '#a78bfa', // violet
  '#f472b6', // pink
  '#f29c06', // gold
  '#4ade80', // green
  '#f87171', // red
  '#22d3ee', // cyan
];

interface HabitFormProps {
  /** Habit to edit (if editing), undefined for new habit */
  habit?: Habit;
  /** Initial data to pre-fill form (e.g., from template) */
  initialData?: Partial<HabitFormData>;
  /** Called when form is submitted with valid data */
  onSubmit: (data: HabitFormData) => void;
  /** Called when user cancels the form */
  onCancel: () => void;
}

export function HabitForm({ habit, initialData, onSubmit, onCancel }: HabitFormProps) {
  const { t } = useLocale();
  const { lifeAreas } = useLifeAreas();

  // Form state - prioritize habit (editing) over initialData (from template)
  const [name, setName] = useState(habit?.name || initialData?.name || '');
  const [lifeArea, setLifeArea] = useState(habit?.lifeArea || initialData?.lifeArea || '');
  const [iconName, setIconName] = useState(habit?.iconName || initialData?.iconName || 'Target');
  const [xp, setXp] = useState(habit?.xp || initialData?.xp || 30);
  const [habitType, setHabitType] = useState<HabitType>(
    habit?.habitType || initialData?.habitType || 'check'
  );
  const [unit, setUnit] = useState(habit?.unit || initialData?.unit || 'min');
  const [dailyGoal, setDailyGoal] = useState<string>(
    habit?.dailyGoal != null ? String(habit.dailyGoal) : initialData?.dailyGoal != null ? String(initialData.dailyGoal) : ''
  );
  const [color, setColor] = useState<string>(habit?.color || initialData?.color || '');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(
    habit?.timeOfDay || initialData?.timeOfDay || 'anytime'
  );

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Reset form when habit or initialData prop changes.
  // In edit mode EVERY field must be restored — omitting the v2 fields here
  // used to silently degrade measurable/quit habits back to 'check'.
  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setLifeArea(habit.lifeArea);
      setIconName(habit.iconName);
      setXp(habit.xp);
      setHabitType(habit.habitType || 'check');
      setUnit(habit.unit || 'min');
      setDailyGoal(habit.dailyGoal != null ? String(habit.dailyGoal) : '');
      setColor(habit.color || '');
      setTimeOfDay(habit.timeOfDay || 'anytime');
    } else if (initialData) {
      if (initialData.name) setName(initialData.name);
      if (initialData.lifeArea) setLifeArea(initialData.lifeArea);
      if (initialData.iconName) setIconName(initialData.iconName);
      if (initialData.xp) setXp(initialData.xp);
      if (initialData.habitType) setHabitType(initialData.habitType);
      if (initialData.unit) setUnit(initialData.unit);
      if (initialData.dailyGoal != null) setDailyGoal(String(initialData.dailyGoal));
      if (initialData.color) setColor(initialData.color);
      if (initialData.timeOfDay) setTimeOfDay(initialData.timeOfDay);
    }
  }, [habit, initialData]);

  /**
   * Validate form fields
   */
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!name.trim()) {
      newErrors.name = t('habitForm.errors.nameRequired');
    } else if (name.trim().length < 3) {
      newErrors.name = t('habitForm.errors.nameTooShort');
    } else if (name.trim().length > 50) {
      newErrors.name = t('habitForm.errors.nameTooLong');
    }

    // Life area validation
    if (!lifeArea) {
      newErrors.lifeArea = t('habitForm.errors.lifeAreaRequired');
    }

    // Icon validation
    if (!iconName || !HABIT_ICONS[iconName]) {
      newErrors.iconName = t('habitForm.errors.iconRequired');
    }

    // XP validation
    if (xp < XP_CONFIG.minHabitXP) {
      newErrors.xp = t('habitForm.errors.xpTooLow', { min: XP_CONFIG.minHabitXP });
    } else if (xp > XP_CONFIG.maxHabitXP) {
      newErrors.xp = t('habitForm.errors.xpTooHigh', { max: XP_CONFIG.maxHabitXP });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      name: true,
      lifeArea: true,
      iconName: true,
      xp: true,
    });

    // Validate and submit
    if (validate()) {
      onSubmit({
        name: name.trim(),
        lifeArea,
        iconName,
        xp,
        habitType,
        unit: habitType === 'measurable' ? unit : undefined,
        dailyGoal:
          habitType === 'measurable' && dailyGoal.trim() !== ''
            ? Number(dailyGoal)
            : undefined,
        color: color || undefined,
        timeOfDay,
        reminderEnabled: habit?.reminderEnabled ?? false,
      });
    }
  };

  /**
   * Handle field blur (mark as touched)
   */
  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validate();
  };

  const isEditing = !!habit;
  const SelectedIcon = HABIT_ICONS[iconName];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-charcoal-500 rounded-3xl shadow-2xl max-w-lg w-full my-8 max-h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 bg-charcoal-500 border-b border-white/10 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-2xl font-bold text-white">
            {isEditing ? t('habitForm.editHabit') : t('habitForm.createHabit')}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            aria-label={t('actions.cancel')}
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Habit Type */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              {t('habitForm.whatType')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { type: 'check' as HabitType, icon: Check, label: t('habitForm.typeCheck'), accent: 'teal' },
                { type: 'measurable' as HabitType, icon: BarChart3, label: t('habitForm.typeMeasurable'), accent: 'blue' },
                { type: 'quit' as HabitType, icon: Ban, label: t('habitForm.typeQuit'), accent: 'cyan' },
              ]).map(({ type, icon: Icon, label, accent }) => {
                const active = habitType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setHabitType(type)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-200 text-center',
                      active
                        ? accent === 'teal'
                          ? 'border-teal-400 bg-teal-500/15'
                          : accent === 'blue'
                          ? 'border-blue-400 bg-blue-500/15'
                          : 'border-cyan-400 bg-cyan-500/15'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    )}
                    aria-pressed={active}
                  >
                    <span
                      className={cn(
                        'w-9 h-9 rounded-xl grid place-items-center',
                        active
                          ? accent === 'teal'
                            ? 'bg-teal-500 text-white'
                            : accent === 'blue'
                            ? 'bg-blue-500 text-white'
                            : 'bg-cyan-500 text-white'
                          : 'bg-white/10 text-white/60'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-semibold text-white leading-tight">{label}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-white/60">
              {habitType === 'measurable'
                ? t('habitForm.typeMeasurableDesc')
                : habitType === 'quit'
                ? t('habitForm.typeQuitDesc')
                : t('habitForm.typeCheckDesc')}
            </p>
          </div>

          {/* Habit Name */}
          <div>
            <label htmlFor="habit-name" className="block text-sm font-semibold text-white mb-2">
              {t('habitForm.habitName')}
            </label>
            <input
              id="habit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleBlur('name')}
              placeholder={t('habitForm.habitNamePlaceholder')}
              className={cn(
                'w-full px-4 py-3 rounded-xl border-2 transition-colors text-white',
                'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent',
                touched.name && errors.name
                  ? 'border-red-500 bg-red-500/10'
                  : 'border-white/20 bg-white/5'
              )}
              aria-invalid={touched.name && !!errors.name}
              aria-describedby={touched.name && errors.name ? 'name-error' : undefined}
            />
            {touched.name && errors.name && (
              <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.name}
              </p>
            )}
          </div>

          {/* Life Area Selection */}
          <div>
            <label htmlFor="life-area" className="block text-sm font-semibold text-white mb-2">
              {t('habitForm.lifeArea')}
            </label>
            <select
              id="life-area"
              value={lifeArea}
              onChange={(e) => setLifeArea(e.target.value)}
              onBlur={() => handleBlur('lifeArea')}
              className={cn(
                'w-full px-4 py-3 rounded-xl border-2 transition-colors text-white',
                'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent',
                touched.lifeArea && errors.lifeArea
                  ? 'border-red-500 bg-red-500/10'
                  : 'border-white/20 bg-white/5'
              )}
              aria-invalid={touched.lifeArea && !!errors.lifeArea}
              aria-describedby={touched.lifeArea && errors.lifeArea ? 'lifeArea-error' : undefined}
            >
              <option value="">{t('habitForm.selectLifeArea')}</option>
              {lifeAreas.map((area) => (
                <option key={area.id} value={area.id}>
                  {t(`lifeAreas.${String(area.area).toLowerCase()}`)} - {t('common.level')} {area.level}
                </option>
              ))}
            </select>
            {touched.lifeArea && errors.lifeArea && (
              <p id="lifeArea-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.lifeArea}
              </p>
            )}
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              {t('habitForm.icon')}
            </label>
            <div className="mb-4 flex items-center gap-3 p-4 bg-white/5 rounded-xl">
              <div className="flex items-center justify-center w-12 h-12 bg-teal-500 text-white rounded-xl">
                {SelectedIcon && <SelectedIcon className="w-7 h-7" />}
              </div>
              <div className="text-sm text-white">
                <div className="font-semibold">{t('habitForm.selectedIcon')}</div>
                <div className="text-white/70">{iconName}</div>
              </div>
            </div>
            <IconSelector
              selectedIcon={iconName}
              onSelectIcon={(icon) => {
                setIconName(icon);
                handleBlur('iconName');
              }}
            />
            {touched.iconName && errors.iconName && (
              <p id="iconName-error" className="mt-2 text-sm text-red-600" role="alert">
                {errors.iconName}
              </p>
            )}
          </div>

          {/* Measurable: unit + daily goal */}
          {habitType === 'measurable' && (
            <div className="space-y-4 p-4 rounded-2xl bg-blue-500/[0.07] border border-blue-400/20">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  {t('habitForm.unit')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {UNIT_OPTIONS.map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUnit(u)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm font-semibold border transition-all',
                        unit === u
                          ? 'bg-blue-500 border-blue-400 text-white'
                          : 'bg-white/5 border-white/15 text-white/70 hover:border-white/30'
                      )}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="daily-goal" className="block text-sm font-semibold text-white mb-2">
                  {t('habitForm.dailyGoalOptional')}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="daily-goal"
                    type="number"
                    min={0}
                    inputMode="decimal"
                    value={dailyGoal}
                    onChange={(e) => setDailyGoal(e.target.value)}
                    placeholder="0"
                    className="w-32 px-4 py-3 rounded-xl border-2 border-white/20 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-blue-300 font-semibold">{unit}</span>
                </div>
                <p className="mt-2 text-xs text-white/60">{t('habitForm.dailyGoalHint')}</p>
              </div>
            </div>
          )}

          {/* Time of day */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              {t('habitForm.timeOfDay')}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {([
                { key: 'anytime' as TimeOfDay, icon: LayoutGrid, label: t('habitForm.timeAnytime') },
                { key: 'morning' as TimeOfDay, icon: Sun, label: t('habitForm.timeMorning') },
                { key: 'afternoon' as TimeOfDay, icon: CloudSun, label: t('habitForm.timeAfternoon') },
                { key: 'evening' as TimeOfDay, icon: Moon, label: t('habitForm.timeEvening') },
              ]).map(({ key, icon: Icon, label }) => {
                const active = timeOfDay === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTimeOfDay(key)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border-2 transition-all duration-200',
                      active
                        ? 'border-teal-400 bg-teal-500/15 text-white'
                        : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                    )}
                    aria-pressed={active}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[11px] font-semibold leading-tight">{label}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-white/60">{t('habitForm.timeOfDayHint')}</p>
          </div>

          {/* Accent color */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              {t('habitForm.color')}
            </label>
            <div className="flex flex-wrap items-center gap-3">
              {COLOR_OPTIONS.map((c) => {
                const active = color === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(active ? '' : c)}
                    className={cn(
                      'w-9 h-9 rounded-full border-2 transition-transform duration-150 grid place-items-center',
                      active ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                    )}
                    style={{ backgroundColor: c }}
                    aria-pressed={active}
                    aria-label={c}
                  >
                    {active && <Check className="w-4 h-4 text-charcoal-500" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* XP Value */}
          <div>
            <label htmlFor="habit-xp" className="block text-sm font-semibold text-white mb-2">
              {t('habitForm.xpValue')}
            </label>
            <div className="flex items-center gap-4">
              <input
                id="habit-xp"
                type="range"
                min={XP_CONFIG.minHabitXP}
                max={XP_CONFIG.maxHabitXP}
                step={5}
                value={xp}
                onChange={(e) => setXp(Number(e.target.value))}
                onBlur={() => handleBlur('xp')}
                className="flex-1"
                aria-describedby="xp-value"
              />
              <div
                id="xp-value"
                className="text-2xl font-bold text-[rgb(242,156,6)] min-w-[60px] text-center"
                aria-live="polite"
              >
                {xp}
              </div>
            </div>
            <p className="mt-2 text-sm text-white/70">
              {t('habitForm.xpDescription', {
                min: XP_CONFIG.minHabitXP,
                max: XP_CONFIG.maxHabitXP,
              })}
            </p>
            {touched.xp && errors.xp && (
              <p id="xp-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.xp}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 rounded-xl font-semibold text-white bg-white/10 hover:bg-white/20 transition-colors"
            >
              {t('actions.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 rounded-xl font-semibold text-white bg-teal-500 hover:bg-teal-600 transition-colors shadow-lg"
            >
              {isEditing ? t('actions.saveChanges') : t('actions.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
