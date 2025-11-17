import React, { useEffect } from 'react';
import { Sunrise, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { ProgressBar } from '@/components/ui';
import { useRootHabit } from '@/store';
import { useLocale } from '@/hooks/useLocale';

export function RootHabit() {
  const { t } = useLocale();
  const {
    progress,
    isLoading,
    error,
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
      alert(t('rootHabit.checkInSuccess') || 'Check-in successful! +20 XP');
    } catch (err) {
      alert(error || 'Failed to check in. Please try again.');
    }
  };

  // Create array of 30 days with completion status
  const checkIns = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    completed: progress?.completed_days?.includes(i + 1) || false,
  }));

  const currentDay = progress?.current_day || 0;
  const completionPercentage = Math.round(progress?.completion_percentage || 0);
  return <div className="min-h-screen pb-24 px-4 pt-8 bg-gradient-to-b from-charcoal-600 to-charcoal-700">
      <div className="max-w-md mx-auto">
        {/* Epic Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-2xl">
            <Sunrise size={48} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Revive Mode</h1>
          <p className="text-white text-lg leading-relaxed">
            Your comeback story starts now. Commit to 30 days of your most
            important habit and rise stronger.
          </p>
        </div>

        {/* Challenge Card */}
        <div className="bg-gradient-to-br from-charcoal-500 to-charcoal-600 rounded-3xl p-6 mb-6 border border-gold-400/30 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-4">
            30-Day Challenge
          </h2>
          <div className="mb-6">
            <ProgressBar current={currentDay} max={30} variant="gold" size="lg" />
          </div>
          <div className="flex justify-between text-white mb-4">
            <span>Day {currentDay} of 30</span>
            <span className="text-[rgb(242,156,6)] font-bold">{completionPercentage}% Complete</span>
          </div>
        </div>

        {/* Daily Check-ins */}
        <div className="bg-gradient-to-br from-charcoal-500 to-charcoal-600 rounded-3xl p-6 mb-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4">Daily Progress</h3>
          <div className="grid grid-cols-6 gap-2">
            {checkIns.map(day => <div key={day.day} className={`aspect-square rounded-xl flex items-center justify-center text-sm font-semibold transition-all ${day.completed ? 'bg-gradient-to-br from-gold-400 to-gold-600 text-white shadow-lg' : 'bg-white/10 text-white/50'}`}>
                {day.completed ? <CheckCircle2 size={16} /> : day.day}
              </div>)}
          </div>
        </div>

        {/* Motivation */}
        <div className="bg-gradient-to-br from-gold-500/20 to-gold-600/20 rounded-3xl p-6 mb-6 border border-gold-400/30">
          <p className="text-white text-center font-semibold text-lg leading-relaxed">
            "The phoenix must burn to emerge."
          </p>
          <p className="text-white/70 text-center text-sm mt-2">
            Every day is a step toward your transformation
          </p>
        </div>

        {/* CTA */}
        <Button
          variant="primary"
          size="lg"
          className="w-full bg-gradient-to-r from-gold-400 to-gold-600"
          onClick={handleCheckIn}
          disabled={!canCheckIn || isLoading || progress?.is_completed}
        >
          {isLoading ? 'Loading...' :
           progress?.is_completed ? 'Challenge Completed! 🎉' :
           canCheckIn ? 'Check In Today' :
           'Already Checked In'}
        </Button>
      </div>
    </div>;
}