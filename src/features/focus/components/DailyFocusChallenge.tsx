/**
 * DailyFocusChallenge — the home banner reimagined as a daily focus challenge.
 *
 * Reach `FOCUS_CONFIG.dailyChallenge.minutesGoal` minutes of focus today to
 * unlock a once-per-day claimable reward (Esencia + Luz) that visibly
 * strengthens the hero. Three states drive the whole UI:
 *   pending  → progress toward the minutes goal, taps through to Focus
 *   ready    → goal met, not yet claimed → a prominent "Reclamar" button
 *   claimed  → reward taken, "vuelve mañana" (still taps through to Focus)
 *
 * Today's minutes and the claimed flag come from `focusStats` (loaded by the
 * Dashboard); the claim itself is idempotent per local day on the server.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Target, Gift, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { useFocus } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { ProgressBar } from '@/components/ui';
import { FOCUS_CONFIG } from '@/constants/config';
import { ROUTES } from '@/constants/routes';

interface DailyFocusChallengeProps {
  /** Bubble a level-up so the Dashboard can show its LevelUpNotification. */
  onLevelUp?: (level: number) => void;
  className?: string;
}

export function DailyFocusChallenge({
  onLevelUp,
  className = '',
}: DailyFocusChallengeProps) {
  const navigate = useNavigate();
  const { t } = useLocale();
  const { focusStats, claimDailyFocusReward } = useFocus();
  const [isClaiming, setIsClaiming] = useState(false);

  const { minutesGoal, rewardPoints, rewardXP } = FOCUS_CONFIG.dailyChallenge;
  const minutesToday = focusStats?.today.minutes ?? 0;
  const met = minutesToday >= minutesGoal;
  const claimed = focusStats?.todayRewardClaimed ?? false;

  const goFocus = () => navigate(ROUTES.FOCUS);

  const handleClaim = async () => {
    if (isClaiming) return;
    setIsClaiming(true);
    try {
      const result = await claimDailyFocusReward();
      if (!result.ok) {
        // Goal slipped or the reward was already taken elsewhere.
        toast(t('focus.dailyChallenge.claimFailed'), { icon: '⚠️' });
        return;
      }
      toast.success(
        t('focus.dailyChallenge.claimedToast', {
          points: result.pointsAwarded,
          xp: result.xpAwarded,
        }),
        { icon: '💎' }
      );
      if (result.leveledUp && result.newLevel) {
        onLevelUp?.(result.newLevel);
      }
    } catch (error) {
      console.error('Error claiming daily focus reward:', error);
      toast.error(t('focus.dailyChallenge.claimFailed'));
    } finally {
      setIsClaiming(false);
    }
  };

  // ── Ready: goal met, reward unclaimed — the celebratory, action-forward state.
  if (met && !claimed) {
    return (
      <div
        className={`glass-card relative overflow-hidden p-4 mb-7 ring-1 ring-inset ring-gold-400/30 ${className}`}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 -right-10 w-44 h-44 rounded-full bg-gold-500/20 blur-3xl"
        />
        <div className="relative flex items-center gap-3">
          <span className="shrink-0 w-11 h-11 rounded-full bg-gold-500/20 flex items-center justify-center ring-1 ring-inset ring-gold-400/40">
            <Gift size={22} className="text-gold-300" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-white text-sm font-bold leading-snug">
              {t('focus.dailyChallenge.readyTitle')}
            </span>
            <span className="block text-white/70 text-xs mt-0.5">
              {t('focus.dailyChallenge.readyBody')}
            </span>
          </span>
        </div>
        <button
          type="button"
          onClick={handleClaim}
          disabled={isClaiming}
          className="relative mt-3 w-full h-11 rounded-xl grid place-items-center bg-gradient-to-r from-gold-400 to-orange-500 text-charcoal-900 text-sm font-extrabold ring-1 ring-inset ring-white/25 shadow-[0_0_16px_hsl(38_92%_55%/0.45)] active:scale-[0.98] transition-transform disabled:opacity-70"
        >
          {isClaiming ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            t('focus.dailyChallenge.claim', {
              points: rewardPoints,
              xp: rewardXP,
            })
          )}
        </button>
      </div>
    );
  }

  // ── Claimed: reward taken — muted, still a shortcut into Focus.
  if (claimed) {
    return (
      <button
        type="button"
        onClick={goFocus}
        className={`w-full glass-card p-4 flex items-center gap-3 text-left mb-7 opacity-90 ${className}`}
      >
        <span className="shrink-0 w-11 h-11 rounded-full bg-success-500/15 flex items-center justify-center">
          <CheckCircle2 size={22} className="text-success-400" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-white text-sm font-bold leading-snug">
            {t('focus.dailyChallenge.claimedTitle')}
          </span>
          <span className="block text-white/70 text-xs mt-0.5">
            {t('focus.dailyChallenge.claimedBody')}
          </span>
        </span>
        <ChevronRight size={20} className="text-white/40 shrink-0" />
      </button>
    );
  }

  // ── Pending: still working toward the goal — progress + tap into Focus.
  return (
    <button
      type="button"
      onClick={goFocus}
      className={`w-full glass-card p-4 flex items-center gap-3 text-left mb-7 ${className}`}
    >
      <span className="shrink-0 w-11 h-11 rounded-full bg-teal-500/15 flex items-center justify-center">
        <Target size={22} className="text-teal-300" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gold-300">
            {t('focus.dailyChallenge.badge')}
          </span>
          <span className="text-white/50 text-[11px] font-semibold">
            {t('focus.dailyChallenge.progress', {
              minutes: minutesToday,
              goal: minutesGoal,
            })}
          </span>
        </span>
        <span className="block text-white text-sm font-bold leading-snug mt-0.5">
          {t('focus.dailyChallenge.pendingBody', { goal: minutesGoal })}
        </span>
        <ProgressBar
          current={minutesToday}
          max={minutesGoal}
          variant="teal"
          size="sm"
          showLabel={false}
          className="mt-2"
        />
      </span>
      <ChevronRight size={20} className="text-white/40 shrink-0" />
    </button>
  );
}
