/**
 * RootHabit — React Native port of ../src/pages/RootHabit.tsx.
 *
 * 30-day challenge tracker: epic header, gold progress card, 6-per-row
 * check-in grid (flex-wrap — no CSS grid on native), motivational quote and
 * the daily check-in CTA. Stack screen: normal bottom padding.
 */

import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sunrise, CheckCircle2 } from 'lucide-react-native';
import toast from '@/lib/toast';
import { ProgressBar } from '@/components/ui';
import { useRootHabit, useTheme } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { Header } from '@/components/layout';
import { themeHsl } from '@/theme/themeVars';
import { cn } from '@/utils';

// Literal gold stops (tailwind gold-400/500/600) for LinearGradient.
const GOLD_400 = 'hsl(40, 95%, 58%)';
const GOLD_600 = 'hsl(34, 92%, 46%)';

export function RootHabit() {
  const { t } = useLocale();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    progress,
    isLoading,
    canCheckIn,
    loadProgress,
    checkIn,
  } = useRootHabit();

  // Load progress on mount
  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const handleCheckIn = async () => {
    try {
      await checkIn();
      // Show success message or notification
      toast.success(t('rootHabit.checkInSuccess'));
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message === 'Day already checked in') {
        toast.error(t('rootHabit.alreadyCheckedIn'));
      } else if (message === 'Challenge already completed') {
        toast.error(t('rootHabit.completed'));
      } else {
        toast.error(t('rootHabit.checkInError'));
      }
    }
  };

  // Create array of 30 days with completion status
  const checkIns = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    completed: progress?.completed_days?.includes(i + 1) || false,
  }));

  const currentDay = progress?.current_day || 0;
  const completionPercentage = Math.round(progress?.completion_percentage || 0);

  // Themed surface stops (web: charcoal-500/600/700 gradients)
  const surface500 = themeHsl(theme, '--surface-500');
  const surface600 = themeHsl(theme, '--surface-600');
  const surface700 = themeHsl(theme, '--surface-700');

  const ctaDisabled = !canCheckIn || isLoading || progress?.is_completed;

  return (
    <View className="flex-1 bg-background">
      {/* Page background: bg-gradient-to-b from-charcoal-600 to-charcoal-700 */}
      <LinearGradient
        colors={[surface600, surface700]}
        style={StyleSheet.absoluteFill}
      />
      <Header />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 8,
          paddingTop: 16,
          paddingBottom: insets.bottom + 32,
        }}
      >
        <View style={{ width: '100%', maxWidth: 448, alignSelf: 'center' }}>
          {/* Epic Header */}
          <View className="mb-8 items-center">
            <View className="mb-6 h-24 w-24 overflow-hidden rounded-full">
              <LinearGradient
                colors={[GOLD_400, GOLD_600]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}
              >
                <Sunrise size={48} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text className="mb-4 text-center text-[28px] font-extrabold leading-tight tracking-tight text-white">
              {t('rootHabit.reviveTitle')}
            </Text>
            <Text className="text-center text-lg leading-relaxed text-white">
              {t('rootHabit.reviveSubtitle')}
            </Text>
          </View>

          {/* Challenge Card */}
          <View className="mb-6 overflow-hidden rounded-3xl border border-gold-400/30">
            <LinearGradient
              colors={[surface500, surface600]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 24 }}
            >
              <Text className="mb-4 text-2xl font-bold text-white">
                {t('rootHabit.challengeTitle')}
              </Text>
              <View className="mb-6">
                <ProgressBar
                  current={currentDay}
                  max={30}
                  variant="gold"
                  size="lg"
                  showLabel={false}
                />
              </View>
              <View className="mb-4 flex-row justify-between">
                <Text className="text-white">
                  {t('rootHabit.dayCount', { current: currentDay, total: 30 })}
                </Text>
                <Text className="font-bold text-[rgb(242,156,6)]">
                  {t('rootHabit.percentComplete', { percent: completionPercentage })}
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Daily Check-ins */}
          <View className="mb-6 overflow-hidden rounded-3xl border border-white/20">
            <LinearGradient
              colors={[surface500, surface600]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 24 }}
            >
              <Text className="mb-4 text-xl font-bold text-white">
                {t('rootHabit.dailyProgress')}
              </Text>
              {/* 6-per-row grid (30 items = 5 full rows, so grow keeps cells equal) */}
              <View className="flex-row flex-wrap gap-2">
                {checkIns.map((day) => (
                  <View
                    key={day.day}
                    accessibilityLabel={
                      day.completed ? t('rootHabit.dayDone', { day: day.day }) : undefined
                    }
                    className={cn(
                      'aspect-square grow basis-[13%] items-center justify-center overflow-hidden rounded-xl',
                      !day.completed && 'bg-white/10'
                    )}
                  >
                    {day.completed ? (
                      <>
                        <LinearGradient
                          colors={[GOLD_400, GOLD_600]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={StyleSheet.absoluteFill}
                        />
                        <CheckCircle2 size={16} color="#FFFFFF" />
                      </>
                    ) : (
                      <Text className="text-sm font-semibold text-white/50">{day.day}</Text>
                    )}
                  </View>
                ))}
              </View>
            </LinearGradient>
          </View>

          {/* Motivation */}
          <View className="mb-6 rounded-3xl border border-gold-400/30 bg-gold-500/20 p-6">
            <Text className="text-center text-lg font-semibold leading-relaxed text-white">
              {t('rootHabit.quote')}
            </Text>
            <Text className="mt-2 text-center text-sm text-white/70">
              {t('rootHabit.quoteSub')}
            </Text>
          </View>

          {/* CTA */}
          <Pressable
            onPress={handleCheckIn}
            disabled={ctaDisabled}
            accessibilityRole="button"
            accessibilityState={{ disabled: !!ctaDisabled, busy: isLoading }}
            className={cn(
              'w-full overflow-hidden rounded-xl active:scale-95',
              ctaDisabled && 'opacity-50'
            )}
          >
            <LinearGradient
              colors={[GOLD_400, GOLD_600]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{
                minHeight: 52,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 32,
                paddingVertical: 14,
              }}
            >
              <Text className="text-lg font-semibold text-white">
                {isLoading
                  ? t('rootHabit.loading')
                  : progress?.is_completed
                    ? t('rootHabit.completed')
                    : canCheckIn
                      ? t('rootHabit.checkInToday')
                      : t('rootHabit.alreadyCheckedIn')}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

export default RootHabit;
