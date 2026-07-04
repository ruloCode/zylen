import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useOnboarding, useLifeAreas, useHabitTemplates } from '@/store';
import { HABIT_ICONS } from '@/features/habits/components/IconSelector';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/utils';

interface OnboardingStep3Props {
  onNext: () => void;
  onPrev: () => void;
}

interface TempHabit {
  name: string;
  iconName: string;
  xp: number;
  lifeArea: string;
}

/**
 * Onboarding Step 3: Create First Habits
 */
export function OnboardingStep3({ onNext, onPrev }: OnboardingStep3Props) {
  const { temporaryData, saveStepData, completeStep } = useOnboarding();
  const { lifeAreas } = useLifeAreas();
  const { templates, templatesLoading, loadTemplates } = useHabitTemplates();
  const { t } = useLocale();

  const [habits, setHabits] = useState<TempHabit[]>(
    temporaryData.createdHabits || []
  );
  const [showForm, setShowForm] = useState(false);
  const [newHabit, setNewHabit] = useState<TempHabit>({
    name: '',
    iconName: 'CheckCircle',
    xp: 30,
    lifeArea: temporaryData.selectedLifeAreaIds?.[0] || '',
  });

  // Load global habit templates once (used to suggest common habits)
  useEffect(() => {
    if (templates.length === 0 && !templatesLoading) {
      loadTemplates();
    }
  }, [templates.length, templatesLoading, loadTemplates]);

  const selectedAreas = lifeAreas.filter((area) =>
    temporaryData.selectedLifeAreaIds?.includes(area.id)
  );

  // Build suggestions from templates that match the user's selected life areas
  const suggestions = useMemo(() => {
    return templates
      .map((tpl) => {
        const area = selectedAreas.find((a) => a.area === tpl.lifeAreaType);
        return area ? { tpl, areaId: area.id } : null;
      })
      .filter(
        (s): s is { tpl: (typeof templates)[number]; areaId: string } => s !== null
      );
  }, [templates, selectedAreas]);

  const templateDisplayName = (tpl: (typeof templates)[number]) =>
    tpl.nameKey ? t(tpl.nameKey, tpl.name) : tpl.name;

  const isHabitAdded = (name: string, areaId: string) =>
    habits.some((h) => h.name === name && h.lifeArea === areaId);

  const toggleTemplate = (
    tpl: (typeof templates)[number],
    areaId: string
  ) => {
    const name = templateDisplayName(tpl);
    if (isHabitAdded(name, areaId)) {
      setHabits(habits.filter((h) => !(h.name === name && h.lifeArea === areaId)));
      return;
    }
    setHabits([
      ...habits,
      { name, iconName: tpl.iconName, xp: tpl.suggestedXp, lifeArea: areaId },
    ]);
  };

  const addHabit = () => {
    if (!newHabit.name.trim() || !newHabit.lifeArea) return;

    setHabits([...habits, newHabit]);
    setNewHabit({
      name: '',
      iconName: 'CheckCircle',
      xp: 30,
      lifeArea: temporaryData.selectedLifeAreaIds?.[0] || '',
    });
    setShowForm(false);
  };

  const removeHabit = (index: number) => {
    setHabits(habits.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (habits.length === 0) return;

    saveStepData({ createdHabits: habits });
    completeStep(3);
    onNext();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-3">
          {t('onboarding.step3.title')}
        </h2>
        <p className="text-gray-300">{t('onboarding.step3.description')}</p>
      </div>

      {/* Common habit suggestions (from templates) */}
      {suggestions.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-300 mb-3">
            {t('onboarding.step3.suggestionsTitle', 'Hábitos comunes')}
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map(({ tpl, areaId }) => {
              const name = templateDisplayName(tpl);
              const added = isHabitAdded(name, areaId);
              const Icon = HABIT_ICONS[tpl.iconName] || HABIT_ICONS['Target'];
              return (
                <button
                  key={`${tpl.id}-${areaId}`}
                  type="button"
                  onClick={() => toggleTemplate(tpl, areaId)}
                  aria-pressed={added}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all',
                    added
                      ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                      : 'bg-charcoal-700/50 border-charcoal-600 text-gray-200 hover:border-teal-500/60 hover:text-white'
                  )}
                >
                  {added ? (
                    <Check size={16} className="text-teal-400" aria-hidden="true" />
                  ) : (
                    <Icon size={16} aria-hidden="true" />
                  )}
                  <span>{name}</span>
                  <span className="text-xs text-teal-300 font-semibold">
                    +{tpl.suggestedXp}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Habits List */}
      <ul className="space-y-3 mb-6" role="list">
        {habits.map((habit, index) => {
          const area = lifeAreas.find((a) => a.id === habit.lifeArea);
          return (
            <li
              key={index}
              className="flex items-center justify-between p-4 bg-charcoal-700/50 rounded-xl border border-charcoal-600"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-white">{habit.name}</h3>
                <p className="text-sm text-gray-400">
                  {habit.xp} {t('common.xp')} •{' '}
                  {area ? t(`lifeAreas.${area.area.toLowerCase()}`) : t('common.noArea')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeHabit(index)}
                aria-label={`${t('actions.delete')} ${habit.name}`}
                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <Trash2 size={18} aria-hidden="true" />
              </button>
            </li>
          );
        })}

        {habits.length === 0 && !showForm && (
          <p className="text-center text-gray-400 py-8">
            {t('onboarding.step3.noHabits')}
          </p>
        )}
      </ul>

      {/* Add Habit Form */}
      {showForm ? (
        <div className="p-4 bg-charcoal-700/50 rounded-xl border border-charcoal-600 space-y-4 mb-6">
          <input
            type="text"
            value={newHabit.name}
            onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
            placeholder={t('onboarding.step3.habitNamePlaceholder')}
            aria-label={t('onboarding.step3.habitNamePlaceholder')}
            className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-charcoal-800 border border-charcoal-600 text-white"
            autoFocus
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label id="xp-slider-label" className="block text-sm text-gray-400 mb-2">XP</label>
              <input
                type="range"
                min="10"
                max="100"
                step="10"
                value={newHabit.xp}
                onChange={(e) =>
                  setNewHabit({ ...newHabit, xp: parseInt(e.target.value) })
                }
                aria-labelledby="xp-slider-label"
                aria-valuemin={10}
                aria-valuemax={100}
                aria-valuenow={newHabit.xp}
                aria-valuetext={`${newHabit.xp} ${t('common.xp')}`}
                className="w-full h-2 accent-teal-500"
              />
              <p className="text-center text-white font-semibold mt-1" aria-live="polite">{newHabit.xp}</p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {t('onboarding.step3.lifeAreaLabel')}
              </label>
              <select
                value={newHabit.lifeArea}
                onChange={(e) => setNewHabit({ ...newHabit, lifeArea: e.target.value })}
                aria-label={t('onboarding.step3.lifeAreaLabel')}
                className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-charcoal-800 border border-charcoal-600 text-white"
              >
                {selectedAreas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {t(`lifeAreas.${area.area.toLowerCase()}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 px-4 py-2 bg-charcoal-600 text-white rounded-lg hover:bg-charcoal-500"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={addHabit}
              disabled={!newHabit.name.trim()}
              className={cn(
                'flex-1 px-4 py-2 rounded-lg font-semibold',
                newHabit.name.trim()
                  ? 'bg-teal-500 text-white hover:bg-teal-600'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              )}
            >
              {t('onboarding.step3.addButton')}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full py-3 px-4 bg-charcoal-700 border-2 border-dashed border-charcoal-600 text-gray-300 rounded-xl hover:border-[hsl(var(--primary))] hover:text-teal-300 transition-all flex items-center justify-center gap-2 mb-6"
        >
          <Plus size={20} />
          {t('onboarding.step3.addHabitButton')}
        </button>
      )}

      {/* Navigation */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={onPrev}
          className="flex-1 py-3 px-6 rounded-xl font-semibold bg-charcoal-700 text-white border-2 border-charcoal-600 hover:bg-charcoal-600 flex items-center justify-center gap-2"
        >
          <ArrowLeft size={20} />
          {t('onboarding.prevButton')}
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={habits.length === 0}
          className={cn(
            'flex-1 py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2',
            habits.length === 0
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary-hover))]'
          )}
        >
          {t('onboarding.nextButton')}
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}

export default OnboardingStep3;
