import React from 'react';
import { Trophy, Coins, Star, ShoppingBag, Flame, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/utils';

interface OnboardingStep4Props {
  onFinish: () => void;
  onPrev: () => void;
  isSubmitting?: boolean;
}

/**
 * Onboarding Step 4: Tutorial / Mechanics Overview
 */
export function OnboardingStep4({ onFinish, onPrev, isSubmitting = false }: OnboardingStep4Props) {
  const { t } = useLocale();

  const features = [
    {
      icon: Trophy,
      color: 'text-teal-400',
      bgColor: 'bg-teal-500/20',
      title: t('onboarding.step4.xpTitle'),
      description: t('onboarding.step4.xpDescription'),
    },
    {
      icon: Coins,
      color: 'text-gold-400',
      bgColor: 'bg-gold-500/20',
      title: t('onboarding.step4.pointsTitle'),
      description: t('onboarding.step4.pointsDescription'),
    },
    {
      icon: Star,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      title: t('onboarding.step4.levelsTitle'),
      description: t('onboarding.step4.levelsDescription'),
    },
    {
      icon: ShoppingBag,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/20',
      title: t('onboarding.step4.shopTitle'),
      description: t('onboarding.step4.shopDescription'),
    },
    {
      icon: Flame,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
      title: t('onboarding.step4.streaksTitle'),
      description: t('onboarding.step4.streaksDescription'),
    },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-3">
          {t('onboarding.step4.title')}
        </h2>
        <p className="text-gray-300">{t('onboarding.step4.description')}</p>
      </div>

      {/* Features Grid */}
      <div className="grid gap-4 mb-8">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="flex items-start gap-4 p-4 bg-charcoal-700/50 rounded-xl border border-charcoal-600 hover:border-charcoal-500 transition-colors"
            >
              <div className={cn('p-3 rounded-lg', feature.bgColor)}>
                <Icon size={24} className={feature.color} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ready Message */}
      <div className="p-6 bg-gradient-to-br from-teal-500/20 to-gold-500/20 rounded-xl border border-teal-500/30 mb-8 text-center">
        <p className="text-lg font-semibold text-white mb-2">
          {t('onboarding.step4.readyTitle')}
        </p>
        <p className="text-gray-300">{t('onboarding.step4.readyDescription')}</p>
      </div>

      {/* Navigation */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={onPrev}
          disabled={isSubmitting}
          className="flex-1 py-3 px-6 rounded-xl font-semibold bg-charcoal-700 text-white border-2 border-charcoal-600 hover:bg-charcoal-600 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft size={20} />
          {t('onboarding.prevButton')}
        </button>

        <button
          type="button"
          onClick={onFinish}
          disabled={isSubmitting}
          className="flex-1 py-3 px-6 rounded-xl font-semibold bg-gradient-to-r from-teal-500 to-gold-600 text-white hover:from-teal-600 hover:to-gold-700 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              {t('common.saving') || 'Guardando...'}
            </>
          ) : (
            <>
              <Check size={20} />
              {t('onboarding.finishButton')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default OnboardingStep4;
