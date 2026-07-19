/**
 * CompletionTimesChart — React Native port of the web hour-of-day chart
 * (../../../../src/features/streaks/components/CompletionTimesChart.tsx).
 * Buckets `habit_completions.completed_at` timestamps into 24 bars, computed
 * in the user's stored timezone (matches the backend's day math). Plain Views
 * with % heights — same visual language as the daily XP chart.
 */

import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useLocale } from '@/hooks/useLocale';
import { getHourInTimeZone, getProfileTimezone } from '@/services/supabase/timezone';
import { cn } from '@/utils';

interface CompletionTimesChartProps {
  timestamps: Date[];
  className?: string;
}

export function CompletionTimesChart({
  timestamps,
  className = '',
}: CompletionTimesChartProps): React.JSX.Element {
  const { t } = useLocale();

  const { buckets, peakHour, max } = useMemo(() => {
    const tz = getProfileTimezone();
    const counts = Array(24).fill(0) as number[];
    for (const ts of timestamps) {
      const hour = getHourInTimeZone(tz, ts);
      counts[hour] = (counts[hour] ?? 0) + 1;
    }
    const highest = Math.max(...counts);
    return {
      buckets: counts,
      peakHour: highest > 0 ? counts.indexOf(highest) : null,
      max: Math.max(highest, 1),
    };
  }, [timestamps]);

  return (
    <View className={className}>
      <View className="mb-5 flex-row items-center justify-between">
        <Text className="text-base font-bold text-white">
          {t('progress.completionTimes')}
        </Text>
        <View className="rounded-full border border-white/10 bg-white/10 px-3 py-1">
          <Text className="text-xs font-semibold text-white/80">
            {t('progress.last30Days')}
          </Text>
        </View>
      </View>

      {timestamps.length === 0 ? (
        <Text className="py-4 text-center text-sm text-white/50">
          {t('progress.completionTimesHint')}
        </Text>
      ) : (
        <>
          <View className="h-28 flex-row items-end gap-[3px]">
            {buckets.map((count, hour) => (
              <View
                key={hour}
                className={cn(
                  'flex-1 rounded-sm bg-purple-500',
                  hour === peakHour && 'border border-purple-300/60',
                  count === 0 && 'opacity-30'
                )}
                style={{ height: `${Math.max((count / max) * 100, 4)}%` }}
              />
            ))}
          </View>
          <View className="mt-1.5 flex-row justify-between">
            {[0, 6, 12, 18].map((hour) => (
              <Text key={hour} className="text-[9px] font-medium text-white/50">
                {String(hour).padStart(2, '0')}:00
              </Text>
            ))}
          </View>
          {peakHour !== null && (
            <Text className="mt-3 text-xs font-medium text-white/60">
              {t('progress.peakHour', {
                hour: `${String(peakHour).padStart(2, '0')}:00`,
              })}
            </Text>
          )}
        </>
      )}
    </View>
  );
}
