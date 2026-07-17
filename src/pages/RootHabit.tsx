import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { Sunrise, Check, Star, Quote } from 'lucide-react';
import { Button } from '@/components/ui';
import { ProgressBar } from '@/components/ui';
import { useRootHabit } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { PageContainer } from '@/components/layout';
import { cn } from '@/utils';

/** Milestone days highlighted on the 30-day journey */
const MILESTONES = [7, 14, 21, 30];

export function RootHabit() {
  const { t } = useLocale();
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
  // The day the guardian lights next (only actionable while the challenge runs)
  const nextDay = progress?.is_completed ? null : currentDay + 1;

  return (
    <div className="min-h-screen pb-24 pt-4">
      <PageContainer className="animate-page-in">
        {/* Header */}
        <header className="mb-6 flex items-start gap-4">
          <div
            className="grid place-items-center w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400/30 to-gold-600/15 border border-gold-400/30 shadow-glow-gold shrink-0"
            aria-hidden="true"
          >
            <Sunrise size={28} className="text-gold-300" />
          </div>
          <div>
            <h1 className="text-[26px] leading-tight font-extrabold text-white tracking-tight">
              {t('rootHabit.reviveTitle')}
            </h1>
            <p className="text-sm text-white/60 mt-1 leading-relaxed">
              {t('rootHabit.reviveSubtitle')}
            </p>
          </div>
        </header>

        {/* Challenge Card */}
        <section className="glass-card rounded-3xl p-5 mb-4 relative overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute -top-14 -right-10 w-44 h-44 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, hsl(40 95% 58% / 0.16) 0%, transparent 70%)' }}
          />
          <div className="relative">
            <div className="flex items-end justify-between mb-4">
              <div>
                <h2 className="section-label mb-1">{t('rootHabit.challengeTitle')}</h2>
                <p className="text-2xl font-extrabold text-white tabular-nums">
                  {t('rootHabit.dayCount', { current: currentDay, total: 30 })}
                </p>
              </div>
              <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-bold bg-gold-500/15 text-gold-300 border border-gold-500/25">
                {t('rootHabit.percentComplete', { percent: completionPercentage })}
              </span>
            </div>
            <ProgressBar current={currentDay} max={30} variant="gold" size="lg" showLabel={false} />

            {/* Milestones */}
            <div className="flex justify-between mt-4">
              {MILESTONES.map((day) => {
                const reached = currentDay >= day;
                return (
                  <div key={day} className="flex flex-col items-center gap-1">
                    <span
                      className={cn(
                        'grid place-items-center w-8 h-8 rounded-full border transition-all duration-300',
                        reached
                          ? 'bg-gradient-to-br from-gold-400 to-gold-600 border-gold-300/60 shadow-glow-gold'
                          : 'bg-white/[0.05] border-white/10'
                      )}
                    >
                      <Star
                        size={14}
                        className={reached ? 'text-white fill-white' : 'text-white/30'}
                        aria-hidden="true"
                      />
                    </span>
                    <span className={cn('text-[10px] font-bold', reached ? 'text-gold-300' : 'text-white/35')}>
                      {day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Daily Check-ins */}
        <section className="glass-card rounded-3xl p-5 mb-4">
          <h3 className="section-label mb-4">{t('rootHabit.dailyProgress')}</h3>
          <div className="grid grid-cols-6 gap-2">
            {checkIns.map(({ day, completed }) => {
              const isNext = day === nextDay;
              return (
                <div
                  key={day}
                  className={cn(
                    'aspect-square rounded-xl grid place-items-center text-[13px] font-bold transition-all duration-300',
                    completed &&
                      'bg-gradient-to-br from-gold-400 to-gold-600 text-white shadow-glow-gold',
                    isNext &&
                      'bg-teal-500/15 text-teal-200 ring-2 ring-teal-400/70 animate-glow-pulse',
                    !completed && !isNext && 'bg-white/[0.05] text-white/35'
                  )}
                >
                  {completed ? <Check size={15} strokeWidth={3} aria-label={t('rootHabit.dayDone', { day })} /> : day}
                </div>
              );
            })}
          </div>
        </section>

        {/* Motivation */}
        <figure className="glass-card rounded-2xl p-5 mb-6 border-l-2 border-l-gold-400/60 flex gap-3.5">
          <Quote className="w-5 h-5 text-gold-400/70 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <blockquote className="text-white font-semibold text-[15px] leading-relaxed">
              {t('rootHabit.quote')}
            </blockquote>
            <figcaption className="text-white/50 text-xs mt-1.5">
              {t('rootHabit.quoteSub')}
            </figcaption>
          </div>
        </figure>

        {/* CTA */}
        <Button
          variant="primary"
          size="lg"
          className="w-full bg-gradient-to-r from-gold-400 to-gold-600 shadow-glow-gold pressable disabled:opacity-50 disabled:shadow-none"
          onClick={handleCheckIn}
          disabled={!canCheckIn || isLoading || progress?.is_completed}
        >
          {isLoading ? t('rootHabit.loading') :
           progress?.is_completed ? t('rootHabit.completed') :
           canCheckIn ? t('rootHabit.checkInToday') :
           t('rootHabit.alreadyCheckedIn')}
        </Button>
      </PageContainer>
    </div>
  );
}
