/**
 * CompletionTimesChart — hour-of-day distribution of habit completions over
 * the last 30 days. Buckets `habit_completions.completed_at` timestamps into
 * 24 bars, computed in the user's stored timezone (matches the backend's day
 * math). Custom Tailwind bars, same visual language as the daily XP chart.
 */

import { useMemo } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { getHourInTimeZone, getProfileTimezone } from '@/services/supabase/timezone';

interface CompletionTimesChartProps {
  timestamps: Date[];
  className?: string;
}

export function CompletionTimesChart({
  timestamps,
  className = '',
}: CompletionTimesChartProps): JSX.Element {
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
    <section className={className}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-white font-bold text-base">{t('progress.completionTimes')}</h2>
        <span className="rounded-full bg-white/10 border border-white/10 px-3 py-1 text-white/80 text-xs font-semibold">
          {t('progress.last30Days')}
        </span>
      </div>

      {timestamps.length === 0 ? (
        <p className="text-white/50 text-sm text-center py-4">
          {t('progress.completionTimesHint')}
        </p>
      ) : (
        <>
          <div className="flex items-end gap-[3px] h-28">
            {buckets.map((count, hour) => (
              <div
                key={hour}
                className={`flex-1 rounded-sm bg-gradient-to-t from-purple-600 to-purple-400 ${
                  hour === peakHour ? 'ring-1 ring-inset ring-purple-300/60' : ''
                } ${count === 0 ? 'opacity-30' : ''}`}
                style={{ height: `${Math.max((count / max) * 100, 4)}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            {[0, 6, 12, 18].map((hour) => (
              <span key={hour} className="text-[9px] font-medium text-white/50">
                {String(hour).padStart(2, '0')}:00
              </span>
            ))}
          </div>
          {peakHour !== null && (
            <p className="text-white/60 text-xs font-medium mt-3">
              {t('progress.peakHour', {
                hour: `${String(peakHour).padStart(2, '0')}:00`,
              })}
            </p>
          )}
        </>
      )}
    </section>
  );
}
