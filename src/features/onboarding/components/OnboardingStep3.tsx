import React, { useState } from 'react';
import { Plus, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import { useOnboarding, useLifeAreas } from '@/store';
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

  const selectedAreas = lifeAreas.filter((area) =>
    temporaryData.selectedLifeAreaIds?.includes(area.id)
  );

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
    completeStep(2);
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

      {/* Habits List */}
      <div className="space-y-3 mb-6">
        {habits.map((habit, index) => {
          const area = lifeAreas.find((a) => a.id === habit.lifeArea);
          return (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-charcoal-700/50 rounded-xl border border-charcoal-600"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-white">{habit.name}</h3>
                <p className="text-sm text-gray-400">
                  {habit.xp} XP • {area?.area || 'Sin área'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeHabit(index)}
                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          );
        })}

        {habits.length === 0 && !showForm && (
          <p className="text-center text-gray-400 py-8">
            {t('onboarding.step3.noHabits')}
          </p>
        )}
      </div>

      {/* Add Habit Form */}
      {showForm ? (
        <div className="p-4 bg-charcoal-700/50 rounded-xl border border-charcoal-600 space-y-4 mb-6">
          <input
            type="text"
            value={newHabit.name}
            onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
            placeholder={t('onboarding.step3.habitNamePlaceholder')}
            className="w-full px-4 py-2 rounded-lg bg-charcoal-800 border border-charcoal-600 text-white"
            autoFocus
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">XP</label>
              <input
                type="range"
                min="10"
                max="100"
                step="10"
                value={newHabit.xp}
                onChange={(e) =>
                  setNewHabit({ ...newHabit, xp: parseInt(e.target.value) })
                }
                className="w-full"
              />
              <p className="text-center text-white font-semibold mt-1">{newHabit.xp}</p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {t('onboarding.step3.lifeAreaLabel')}
              </label>
              <select
                value={newHabit.lifeArea}
                onChange={(e) => setNewHabit({ ...newHabit, lifeArea: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-charcoal-800 border border-charcoal-600 text-white"
              >
                {selectedAreas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.area}
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
          className="w-full py-3 px-4 bg-charcoal-700 border-2 border-dashed border-charcoal-600 text-gray-300 rounded-xl hover:border-gold-500 hover:text-gold-400 transition-all flex items-center justify-center gap-2 mb-6"
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
              : 'bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700'
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
