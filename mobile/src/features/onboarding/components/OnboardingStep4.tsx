import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import {
  Trophy,
  Coins,
  Star,
  ShoppingBag,
  Flame,
  ArrowLeft,
  Check,
} from 'lucide-react-native';
import { useTheme } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/utils';
import { themeHsl } from '@/theme/themeVars';

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
  const { theme } = useTheme();
  const primaryForeground = themeHsl(theme, '--primary-foreground');

  const features = [
    {
      icon: Trophy,
      color: '#2dd4bf', // text-teal-400
      bgColor: 'bg-teal-500/20',
      title: t('onboarding.step4.xpTitle'),
      description: t('onboarding.step4.xpDescription'),
    },
    {
      icon: Coins,
      color: '#5eead4', // text-teal-300
      bgColor: 'bg-teal-500/20',
      title: t('onboarding.step4.pointsTitle'),
      description: t('onboarding.step4.pointsDescription'),
    },
    {
      icon: Star,
      color: '#c084fc', // text-purple-400
      bgColor: 'bg-purple-500/20',
      title: t('onboarding.step4.levelsTitle'),
      description: t('onboarding.step4.levelsDescription'),
    },
    {
      icon: ShoppingBag,
      color: '#f472b6', // text-pink-400
      bgColor: 'bg-pink-500/20',
      title: t('onboarding.step4.shopTitle'),
      description: t('onboarding.step4.shopDescription'),
    },
    {
      icon: Flame,
      color: '#fb923c', // text-orange-400
      bgColor: 'bg-orange-500/20',
      title: t('onboarding.step4.streaksTitle'),
      description: t('onboarding.step4.streaksDescription'),
    },
  ];

  return (
    <View className="mx-auto w-full max-w-2xl">
      {/* Title */}
      <View className="mb-8 items-center">
        <Text className="mb-3 text-center text-2xl font-bold text-white">
          {t('onboarding.step4.title')}
        </Text>
        <Text className="text-center text-gray-300">{t('onboarding.step4.description')}</Text>
      </View>

      {/* Features List */}
      <View className="mb-8 gap-4">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <View
              key={index}
              className="flex-row items-start gap-4 rounded-xl border border-charcoal-600 bg-charcoal-700/50 p-4"
            >
              <View className={cn('rounded-lg p-3', feature.bgColor)}>
                <Icon size={24} color={feature.color} />
              </View>
              <View className="flex-1">
                <Text className="mb-1 font-semibold text-white">{feature.title}</Text>
                <Text className="text-sm text-gray-400">{feature.description}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Ready Message */}
      <View className="mb-8 items-center rounded-xl border border-teal-500/30 bg-teal-500/20 p-6">
        <Text className="mb-2 text-center text-lg font-semibold text-white">
          {t('onboarding.step4.readyTitle')}
        </Text>
        <Text className="text-center text-gray-300">
          {t('onboarding.step4.readyDescription')}
        </Text>
      </View>

      {/* Navigation */}
      <View className="flex-row gap-4">
        <Pressable
          onPress={onPrev}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityState={{ disabled: isSubmitting }}
          className={cn(
            'flex-1 flex-row items-center justify-center gap-2 rounded-xl px-6 py-3',
            'border-2 border-charcoal-600 bg-charcoal-700 active:bg-charcoal-600',
            isSubmitting && 'opacity-50'
          )}
        >
          <ArrowLeft size={20} color="#FFFFFF" />
          <Text className="font-semibold text-white">{t('onboarding.prevButton')}</Text>
        </Pressable>

        <Pressable
          onPress={onFinish}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
          className={cn(
            'flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 active:opacity-90',
            isSubmitting && 'opacity-50'
          )}
        >
          {isSubmitting ? (
            <>
              <ActivityIndicator size="small" color={primaryForeground} />
              <Text className="font-semibold text-primary-foreground">
                {t('common.saving')}
              </Text>
            </>
          ) : (
            <>
              <Check size={20} color={primaryForeground} />
              <Text className="font-semibold text-primary-foreground">
                {t('onboarding.finishButton')}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

export default OnboardingStep4;
