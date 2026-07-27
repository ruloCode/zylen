import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { BellRing, BookOpen, Check, Flame } from 'lucide-react-native';
import { useAppStore, useOnboarding, useTheme } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { themeHsl } from '@/theme/themeVars';
import { NotificationsService } from '@/services/notifications.service';
import { setCoachPref, syncCoachReminders } from '@/services/coachReminders.service';
import { ONBOARDING_STEPS } from '@/types';
import { OnboardingScreen } from './OnboardingScreen';

interface OnboardingStepNotificationsProps {
  onFinish: () => Promise<void> | void;
  isSubmitting?: boolean;
}

/**
 * Onboarding final step: contextual pre-prompt for the notifications
 * permission (top-app pattern — explain the why BEFORE the system dialog).
 * Granting activates the coach reminders in the slot the player just chose;
 * denying or skipping finishes the onboarding all the same.
 */
export function OnboardingStepNotifications({
  onFinish,
  isSubmitting = false,
}: OnboardingStepNotificationsProps) {
  const { temporaryData } = useOnboarding();
  const { theme } = useTheme();
  const { t } = useLocale();
  const [requesting, setRequesting] = useState(false);

  const slotKey = temporaryData.preferredTimeOfDay ?? 'anytime';
  const slotLabel = t(`onboarding.timeOfDay.options.${slotKey}`);
  const busy = requesting || isSubmitting;

  const handleAllow = async () => {
    if (busy) return;
    setRequesting(true);
    try {
      const permission = await NotificationsService.requestPermission();
      if (permission === 'granted') {
        setCoachPref(true);
        // The first habit was created with reminderEnabled — schedule the
        // coach right away so tomorrow's reminder exists before first close.
        const { habits } = useAppStore.getState();
        await syncCoachReminders(habits, t, true);
      }
    } catch (error) {
      console.warn('Failed to set up reminders during onboarding:', error);
    } finally {
      setRequesting(false);
    }
    await onFinish();
  };

  const bullets = [
    { icon: BellRing, color: '#2dd4bf', text: t('onboarding.notifications.bullet1', { slot: slotLabel }) },
    { icon: BookOpen, color: '#c084fc', text: t('onboarding.notifications.bullet2') },
    { icon: Flame, color: '#fb923c', text: t('onboarding.notifications.bullet3') },
  ] as const;

  return (
    <OnboardingScreen
      step={ONBOARDING_STEPS.NOTIFICATIONS}
      centered
      cta={{
        label: t('onboarding.notifications.allowCta'),
        onPress: handleAllow,
        loading: busy,
        loadingLabel: t('common.saving'),
        icon: <Check size={20} color={themeHsl(theme, '--primary-foreground')} />,
      }}
      secondaryLink={{
        label: t('onboarding.notifications.laterCta'),
        onPress: () => void onFinish(),
        disabled: busy,
      }}
    >
      <View className="items-center gap-4">
        <View className="h-20 w-20 items-center justify-center rounded-full border-2 border-teal-400/50 bg-teal-500/15">
          <BellRing size={36} color="#2dd4bf" />
        </View>
        <Text className="text-center text-2xl font-extrabold tracking-tight text-white">
          {t('onboarding.notifications.title')}
        </Text>
        <Text className="text-center text-base text-white/70">
          {t('onboarding.notifications.subtitle')}
        </Text>

        <View className="mt-2 w-full gap-2.5">
          {bullets.map((bullet, index) => {
            const Icon = bullet.icon;
            return (
              <View
                key={index}
                className="w-full flex-row items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3"
              >
                <Icon size={18} color={bullet.color} />
                <Text className="flex-1 text-sm font-medium text-white/80">{bullet.text}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </OnboardingScreen>
  );
}

export default OnboardingStepNotifications;
