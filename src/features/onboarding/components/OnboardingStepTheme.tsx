import React from 'react';
import { ArrowLeft, ArrowRight, Palette } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { ThemeSelector } from '@/features/settings/components';

interface OnboardingStepThemeProps {
  onNext: () => void;
  onPrev: () => void;
}

/**
 * Onboarding Step: Theme selection.
 * Picking a theme applies & persists instantly (via the themeSlice), so there's
 * no need to thread the choice through onboarding temporaryData/finalize.
 */
export function OnboardingStepTheme({ onNext, onPrev }: OnboardingStepThemeProps) {
  const { t } = useLocale();

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Title */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-500/20 mb-4">
          <Palette size={26} className="text-teal-400" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">
          {t('themes.onboardingPrompt')}
        </h2>
        <p className="text-gray-300">{t('themes.onboardingHint')}</p>
      </div>

      {/* Theme grid */}
      <div className="mb-8">
        <ThemeSelector variant="grid" />
      </div>

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
          onClick={onNext}
          className="flex-1 py-3 px-6 rounded-xl font-semibold bg-gradient-to-r from-teal-500 to-gold-600 text-white hover:from-teal-600 hover:to-gold-700 shadow-lg flex items-center justify-center gap-2"
        >
          {t('onboarding.nextButton')}
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}

export default OnboardingStepTheme;
