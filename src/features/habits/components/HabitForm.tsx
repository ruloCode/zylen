import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { IconSelector, HABIT_ICONS } from './IconSelector';
import { useLifeAreas } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import type { Habit, HabitFormData } from '@/types';
import { cn } from '@/utils/cn';
import { XP_CONFIG } from '@/constants/config';

interface HabitFormProps {
  /** Habit to edit (if editing), undefined for new habit */
  habit?: Habit;
  /** Called when form is submitted with valid data */
  onSubmit: (data: HabitFormData) => void;
  /** Called when user cancels the form */
  onCancel: () => void;
}

export function HabitForm({ habit, onSubmit, onCancel }: HabitFormProps) {
  const { t } = useLocale();
  const { lifeAreas } = useLifeAreas();

  // Form state
  const [name, setName] = useState(habit?.name || '');
  const [lifeArea, setLifeArea] = useState(habit?.lifeArea || '');
  const [iconName, setIconName] = useState(habit?.iconName || 'Target');
  const [xp, setXp] = useState(habit?.xp || 30);

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Reset form when habit prop changes
  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setLifeArea(habit.lifeArea);
      setIconName(habit.iconName);
      setXp(habit.xp);
    }
  }, [habit]);

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
  const isValid = Object.keys(errors).length === 0 && name.trim() && lifeArea && iconName;

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={isEditing ? t('habitForm.editHabit') : t('habitForm.createHabit')}
      description={t('habitForm.description')}
      maxWidth="lg"
      showCloseButton={true}
      footer={
        <div className="flex gap-3 w-full">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-4 px-6 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors touch-manipulation min-h-[44px]"
          >
            {t('actions.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid}
            className={cn(
              'flex-1 py-4 px-6 rounded-xl font-bold text-white transition-colors touch-manipulation min-h-[44px]',
              isValid
                ? 'bg-teal-500 hover:bg-teal-600 active:bg-teal-700 shadow-lg'
                : 'bg-white/10 cursor-not-allowed opacity-50'
            )}
          >
            {isEditing ? t('actions.saveChanges') : t('actions.create')}
          </button>
        </div>
      }
    >
      {/* Form Fields */}
      <div className="space-y-6">
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
      </div>
    </Modal>
  );
}
