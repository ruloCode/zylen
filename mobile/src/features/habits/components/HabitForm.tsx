/**
 * HabitForm — React Native port.
 * Rendered as a bottom sheet (SheetShell). The web's <input type="range">
 * for XP is replaced by a −/＋ stepper (same min/max/step semantics).
 */

import React, { useState, useEffect } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  X,
  Check,
  BarChart3,
  Ban,
  Sun,
  CloudSun,
  Moon,
  LayoutGrid,
  Minus,
  Plus,
} from 'lucide-react-native';
import { IconSelector, HABIT_ICONS } from './IconSelector';
import { SheetShell } from './SheetShell';
import { Input } from '@/components/atoms';
import { Select } from '@/components/atoms';
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

const WHITE = '#FFFFFF';
const WHITE_60 = 'rgba(255,255,255,0.6)';

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
  const handleSubmit = () => {
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

  const stepXp = (delta: number) => {
    setXp((current) =>
      Math.min(XP_CONFIG.maxHabitXP, Math.max(XP_CONFIG.minHabitXP, current + delta))
    );
    handleBlur('xp');
  };

  const isEditing = !!habit;
  const SelectedIcon = HABIT_ICONS[iconName];

  return (
    <SheetShell onClose={onCancel} height="92%">
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-white/10 px-6 py-4">
        <Text className="text-2xl font-bold text-white">
          {isEditing ? t('habitForm.editHabit') : t('habitForm.createHabit')}
        </Text>
        <Pressable
          onPress={onCancel}
          className="rounded-xl p-2 active:bg-white/10"
          accessibilityRole="button"
          accessibilityLabel={t('actions.cancel')}
        >
          <X size={24} color={WHITE} />
        </Pressable>
      </View>

      {/* Form */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, gap: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Habit Type */}
        <View>
          <Text className="mb-2 text-sm font-semibold text-white">
            {t('habitForm.whatType')}
          </Text>
          <View className="flex-row gap-2">
            {([
              { type: 'check' as HabitType, icon: Check, label: t('habitForm.typeCheck'), accent: 'teal' },
              { type: 'measurable' as HabitType, icon: BarChart3, label: t('habitForm.typeMeasurable'), accent: 'blue' },
              { type: 'quit' as HabitType, icon: Ban, label: t('habitForm.typeQuit'), accent: 'cyan' },
            ]).map(({ type, icon: Icon, label, accent }) => {
              const active = habitType === type;
              return (
                <Pressable
                  key={type}
                  onPress={() => setHabitType(type)}
                  className={cn(
                    'flex-1 items-center gap-2 rounded-2xl border-2 p-3',
                    active
                      ? accent === 'teal'
                        ? 'border-teal-400 bg-teal-500/15'
                        : accent === 'blue'
                        ? 'border-blue-400 bg-blue-500/15'
                        : 'border-cyan-400 bg-cyan-500/15'
                      : 'border-white/10 bg-white/5'
                  )}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <View
                    className={cn(
                      'h-9 w-9 items-center justify-center rounded-xl',
                      active
                        ? accent === 'teal'
                          ? 'bg-teal-500'
                          : accent === 'blue'
                          ? 'bg-blue-500'
                          : 'bg-cyan-500'
                        : 'bg-white/10'
                    )}
                  >
                    <Icon size={20} color={active ? WHITE : WHITE_60} />
                  </View>
                  <Text className="text-center text-xs font-semibold leading-tight text-white">
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text className="mt-2 text-xs text-white/60">
            {habitType === 'measurable'
              ? t('habitForm.typeMeasurableDesc')
              : habitType === 'quit'
              ? t('habitForm.typeQuitDesc')
              : t('habitForm.typeCheckDesc')}
          </Text>
        </View>

        {/* Habit Name */}
        <View>
          <Text className="mb-2 text-sm font-semibold text-white">
            {t('habitForm.habitName')}
          </Text>
          <Input
            value={name}
            onChangeText={setName}
            onBlur={() => handleBlur('name')}
            placeholder={t('habitForm.habitNamePlaceholder')}
            error={errors.name}
            touched={!!touched.name}
            aria-label={t('habitForm.habitName')}
          />
          {touched.name && errors.name && (
            <Text className="mt-1 text-sm text-red-500" accessibilityRole="alert">
              {errors.name}
            </Text>
          )}
        </View>

        {/* Life Area Selection */}
        <View>
          <Text className="mb-2 text-sm font-semibold text-white">
            {t('habitForm.lifeArea')}
          </Text>
          <Select
            value={lifeArea}
            onValueChange={(value) => {
              setLifeArea(value);
            }}
            onBlur={() => handleBlur('lifeArea')}
            placeholder={t('habitForm.selectLifeArea')}
            options={lifeAreas.map((area) => ({
              value: area.id,
              label: `${t(`lifeAreas.${String(area.area).toLowerCase()}`)} - ${t('common.level')} ${area.level}`,
            }))}
            error={errors.lifeArea}
            touched={!!touched.lifeArea}
            aria-label={t('habitForm.lifeArea')}
          />
          {touched.lifeArea && errors.lifeArea && (
            <Text className="mt-1 text-sm text-red-500" accessibilityRole="alert">
              {errors.lifeArea}
            </Text>
          )}
        </View>

        {/* Icon Selection */}
        <View>
          <Text className="mb-2 text-sm font-semibold text-white">
            {t('habitForm.icon')}
          </Text>
          <View className="mb-4 flex-row items-center gap-3 rounded-xl bg-white/5 p-4">
            <View className="h-12 w-12 items-center justify-center rounded-xl bg-teal-500">
              {SelectedIcon && <SelectedIcon size={28} color={WHITE} />}
            </View>
            <View>
              <Text className="text-sm font-semibold text-white">
                {t('habitForm.selectedIcon')}
              </Text>
              <Text className="text-sm text-white/70">{t(`icons.${iconName}`, iconName)}</Text>
            </View>
          </View>
          <IconSelector
            selectedIcon={iconName}
            onSelectIcon={(icon) => {
              setIconName(icon);
              handleBlur('iconName');
            }}
          />
          {touched.iconName && errors.iconName && (
            <Text className="mt-2 text-sm text-red-500" accessibilityRole="alert">
              {errors.iconName}
            </Text>
          )}
        </View>

        {/* Measurable: unit + daily goal */}
        {habitType === 'measurable' && (
          <View className="gap-4 rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4">
            <View>
              <Text className="mb-2 text-sm font-semibold text-white">
                {t('habitForm.unit')}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {UNIT_OPTIONS.map((u) => (
                  <Pressable
                    key={u}
                    onPress={() => setUnit(u)}
                    className={cn(
                      'rounded-full border px-3 py-1.5',
                      unit === u
                        ? 'border-blue-400 bg-blue-500'
                        : 'border-white/15 bg-white/5'
                    )}
                    accessibilityRole="button"
                    accessibilityState={{ selected: unit === u }}
                  >
                    <Text
                      className={cn(
                        'text-sm font-semibold',
                        unit === u ? 'text-white' : 'text-white/70'
                      )}
                    >
                      {t(`habits.units.${u}`, u)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View>
              <Text className="mb-2 text-sm font-semibold text-white">
                {t('habitForm.dailyGoalOptional')}
              </Text>
              <View className="flex-row items-center gap-3">
                <Input
                  value={dailyGoal}
                  onChangeText={setDailyGoal}
                  type="number"
                  placeholder="0"
                  className="w-32"
                  aria-label={t('habitForm.dailyGoalOptional')}
                />
                <Text className="font-semibold text-blue-300">
                  {t(`habits.units.${unit}`, unit)}
                </Text>
              </View>
              <Text className="mt-2 text-xs text-white/60">{t('habitForm.dailyGoalHint')}</Text>
            </View>
          </View>
        )}

        {/* Time of day */}
        <View>
          <Text className="mb-2 text-sm font-semibold text-white">
            {t('habitForm.timeOfDay')}
          </Text>
          <View className="flex-row gap-2">
            {([
              { key: 'anytime' as TimeOfDay, icon: LayoutGrid, label: t('habitForm.timeAnytime') },
              { key: 'morning' as TimeOfDay, icon: Sun, label: t('habitForm.timeMorning') },
              { key: 'afternoon' as TimeOfDay, icon: CloudSun, label: t('habitForm.timeAfternoon') },
              { key: 'evening' as TimeOfDay, icon: Moon, label: t('habitForm.timeEvening') },
            ]).map(({ key, icon: Icon, label }) => {
              const active = timeOfDay === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setTimeOfDay(key)}
                  className={cn(
                    'flex-1 items-center gap-1.5 rounded-2xl border-2 p-2.5',
                    active ? 'border-teal-400 bg-teal-500/15' : 'border-white/10 bg-white/5'
                  )}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Icon size={20} color={active ? WHITE : WHITE_60} />
                  <Text
                    className={cn(
                      'text-center text-[11px] font-semibold leading-tight',
                      active ? 'text-white' : 'text-white/60'
                    )}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text className="mt-2 text-xs text-white/60">{t('habitForm.timeOfDayHint')}</Text>
        </View>

        {/* Accent color */}
        <View>
          <Text className="mb-2 text-sm font-semibold text-white">
            {t('habitForm.color')}
          </Text>
          <View className="flex-row flex-wrap items-center gap-3">
            {COLOR_OPTIONS.map((c) => {
              const active = color === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setColor(active ? '' : c)}
                  className={cn(
                    'h-9 w-9 items-center justify-center rounded-full border-2',
                    active ? 'scale-110 border-white' : 'border-transparent'
                  )}
                  style={{ backgroundColor: c }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={c}
                >
                  {active && <Check size={16} color="#1F2430" />}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* XP Value (stepper replaces the web range slider) */}
        <View>
          <Text className="mb-2 text-sm font-semibold text-white">
            {t('habitForm.xpValue')}
          </Text>
          <View className="flex-row items-center gap-4">
            <Pressable
              onPress={() => stepXp(-5)}
              disabled={xp <= XP_CONFIG.minHabitXP}
              className={cn(
                'h-11 w-11 items-center justify-center rounded-xl bg-white/10 active:bg-white/20',
                xp <= XP_CONFIG.minHabitXP && 'opacity-40'
              )}
              accessibilityRole="button"
              accessibilityLabel="-5"
            >
              <Minus size={20} color={WHITE} />
            </Pressable>

            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-[rgb(242,156,6)]">{xp}</Text>
              {/* Position within min..max */}
              <View className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <View
                  className="h-full rounded-full bg-gold-500"
                  style={{
                    width: `${Math.round(
                      ((xp - XP_CONFIG.minHabitXP) /
                        (XP_CONFIG.maxHabitXP - XP_CONFIG.minHabitXP)) * 100
                    )}%`,
                  }}
                />
              </View>
            </View>

            <Pressable
              onPress={() => stepXp(5)}
              disabled={xp >= XP_CONFIG.maxHabitXP}
              className={cn(
                'h-11 w-11 items-center justify-center rounded-xl bg-white/10 active:bg-white/20',
                xp >= XP_CONFIG.maxHabitXP && 'opacity-40'
              )}
              accessibilityRole="button"
              accessibilityLabel="+5"
            >
              <Plus size={20} color={WHITE} />
            </Pressable>
          </View>
          <Text className="mt-2 text-sm text-white/70">
            {t('habitForm.xpDescription', {
              min: XP_CONFIG.minHabitXP,
              max: XP_CONFIG.maxHabitXP,
            })}
          </Text>
          {touched.xp && errors.xp && (
            <Text className="mt-1 text-sm text-red-500" accessibilityRole="alert">
              {errors.xp}
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3 pt-4">
          <Pressable
            onPress={onCancel}
            className="flex-1 items-center rounded-xl bg-white/10 px-6 py-3 active:bg-white/20"
            accessibilityRole="button"
          >
            <Text className="font-semibold text-white">{t('actions.cancel')}</Text>
          </Pressable>
          <Pressable
            onPress={handleSubmit}
            className="flex-1 items-center rounded-xl bg-teal-500 px-6 py-3 active:bg-teal-600"
            accessibilityRole="button"
          >
            <Text className="font-semibold text-white">
              {isEditing ? t('actions.saveChanges') : t('actions.create')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SheetShell>
  );
}
