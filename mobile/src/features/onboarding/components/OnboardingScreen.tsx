import React, { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/utils';
import { themeHsl } from '@/theme/themeVars';
import { OnboardingProgress } from './OnboardingProgress';

export interface OnboardingCta {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** label shown next to the spinner while loading (defaults to common.saving) */
  loadingLabel?: string;
  icon?: ReactNode;
}

interface OnboardingScreenProps {
  /** Current step index — drives the progress bar. */
  step: number;
  /** Back chevron in the header; hidden when omitted. */
  onBack?: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  /** Full-width primary CTA pinned to the footer; steps that auto-advance omit it. */
  cta?: OnboardingCta;
  /** Discreet text link under the CTA (e.g. "Lo haré después"). */
  secondaryLink?: { label: string; onPress: () => void; disabled?: boolean };
  /** Center the content vertically when it doesn't fill the screen. */
  centered?: boolean;
}

/**
 * Shared scaffold for every onboarding step: header (back chevron + linear
 * progress), scrollable content and a pinned footer with a single full-width
 * CTA. Navigation is never a 50/50 button row — "back" lives in the header.
 */
export function OnboardingScreen({
  step,
  onBack,
  title,
  subtitle,
  children,
  cta,
  secondaryLink,
  centered = false,
}: OnboardingScreenProps) {
  const { t } = useLocale();
  const { theme } = useTheme();
  const primaryForeground = themeHsl(theme, '--primary-foreground');

  const ctaDisabled = cta?.disabled || cta?.loading;

  return (
    <View className="flex-1">
      {/* Header: back + progress */}
      <View className="mb-6 flex-row items-center gap-3">
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.prevButton')}
            hitSlop={8}
            className="h-11 w-11 items-center justify-center rounded-full active:bg-white/10"
          >
            <ChevronLeft size={26} color="#FFFFFF" />
          </Pressable>
        ) : (
          <View className="h-11 w-2" />
        )}
        <View className="flex-1 pr-2">
          <OnboardingProgress currentStep={step} />
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: centered ? 'center' : 'flex-start',
          paddingBottom: 16,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {title ? (
          <Text className="mb-2 text-center text-2xl font-extrabold tracking-tight text-white">
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text className="mb-6 text-center text-base font-medium text-white/70">{subtitle}</Text>
        ) : null}
        {children}
      </ScrollView>

      {/* Footer: single full-width CTA + optional secondary link */}
      {(cta || secondaryLink) && (
        <View className="pt-3">
          {cta && (
            <Pressable
              onPress={cta.onPress}
              disabled={ctaDisabled}
              accessibilityRole="button"
              accessibilityState={{ disabled: !!ctaDisabled, busy: !!cta.loading }}
              className={cn(
                'w-full flex-row items-center justify-center gap-2 rounded-xl px-6 py-4',
                ctaDisabled && !cta.loading ? 'bg-gray-700' : 'bg-primary active:opacity-90',
                cta.loading && 'opacity-70'
              )}
            >
              {cta.loading ? (
                <>
                  <ActivityIndicator size="small" color={primaryForeground} />
                  <Text className="text-base font-bold text-primary-foreground">
                    {cta.loadingLabel ?? t('common.saving')}
                  </Text>
                </>
              ) : (
                <>
                  <Text
                    className={cn(
                      'text-base font-bold',
                      cta.disabled ? 'text-gray-400' : 'text-primary-foreground'
                    )}
                  >
                    {cta.label}
                  </Text>
                  {!cta.disabled && cta.icon}
                </>
              )}
            </Pressable>
          )}
          {secondaryLink && (
            <Pressable
              onPress={secondaryLink.onPress}
              disabled={secondaryLink.disabled}
              accessibilityRole="button"
              hitSlop={8}
              className="mt-2 min-h-[44px] items-center justify-center py-2"
            >
              <Text className="text-sm font-semibold text-white/50">{secondaryLink.label}</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

export default OnboardingScreen;
