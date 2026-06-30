/**
 * Onboarding Step - About You
 *
 * Collects personalization data right after identity: primary motivation,
 * experience level with habits, and age range. Persisted to the profile so
 * the game can tailor tone and content.
 */

import { useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useOnboarding } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils';
import {
  MOTIVATION_OPTIONS,
  EXPERIENCE_OPTIONS,
  AGE_RANGE_OPTIONS,
} from '@/constants';
import type { ExperienceLevel } from '@/types/user';

interface OnboardingStepAboutYouProps {
  onNext: () => void;
  onPrev: () => void;
}

export function OnboardingStepAboutYou({ onNext, onPrev }: OnboardingStepAboutYouProps) {
  const { t } = useLocale();
  const { temporaryData, saveStepData, completeStep } = useOnboarding();

  const [motivation, setMotivation] = useState<string | undefined>(temporaryData.motivation);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | undefined>(
    temporaryData.experienceLevel
  );
  const [ageRange, setAgeRange] = useState<string | undefined>(temporaryData.ageRange);

  const isValid = Boolean(motivation && experienceLevel && ageRange);

  const handleSubmit = () => {
    if (!isValid) return;
    saveStepData({ motivation, experienceLevel, ageRange });
    completeStep(1);
    onNext();
  };

  const chip = (selected: boolean) =>
    cn(
      'rounded-2xl px-4 py-3 text-sm font-semibold transition-all text-left',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60',
      selected
        ? 'bg-teal-500/15 ring-2 ring-teal-400/70 text-teal-100'
        : 'bg-white/[0.04] ring-1 ring-white/10 text-white/70 hover:bg-white/[0.07]'
    );

  return (
    <div className="glass-card p-6 sm:p-8 rounded-3xl max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 flex items-center justify-center gap-2 uppercase tracking-wide">
          <Sparkles className="text-[hsl(var(--primary))]" size={28} />
          {t('onboarding.aboutYou.title')}
        </h1>
        <p className="text-white/75 font-medium">{t('onboarding.aboutYou.description')}</p>
      </div>

      <div className="space-y-8">
        {/* Motivation */}
        <fieldset>
          <legend className="block text-sm font-bold text-white/90 mb-3 uppercase tracking-wide">
            {t('onboarding.aboutYou.motivationLabel')}
          </legend>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {MOTIVATION_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={motivation === option.value}
                onClick={() => setMotivation(option.value)}
                className={chip(motivation === option.value)}
              >
                <span className="mr-1.5" aria-hidden="true">{option.emoji}</span>
                {t(option.labelKey)}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Experience level */}
        <fieldset>
          <legend className="block text-sm font-bold text-white/90 mb-3 uppercase tracking-wide">
            {t('onboarding.aboutYou.experienceLabel')}
          </legend>
          <div className="grid grid-cols-3 gap-2.5">
            {EXPERIENCE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={experienceLevel === option.value}
                onClick={() => setExperienceLevel(option.value)}
                className={chip(experienceLevel === option.value)}
              >
                {t(option.labelKey)}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Age range */}
        <fieldset>
          <legend className="block text-sm font-bold text-white/90 mb-3 uppercase tracking-wide">
            {t('onboarding.aboutYou.ageLabel')}
          </legend>
          <div className="grid grid-cols-3 gap-2.5">
            {AGE_RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={ageRange === option.value}
                onClick={() => setAgeRange(option.value)}
                className={chip(ageRange === option.value)}
              >
                {t(option.labelKey)}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="secondary" onClick={onPrev} className="px-6">
            {t('onboarding.prevButton')}
          </Button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid}
            className={cn(
              'py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all',
              'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--background))]',
              !isValid
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary-hover))] shadow-lg hover:shadow-[0_10px_30px_-8px_hsl(var(--primary)/0.6)]'
            )}
          >
            {t('onboarding.nextButton')}
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default OnboardingStepAboutYou;
