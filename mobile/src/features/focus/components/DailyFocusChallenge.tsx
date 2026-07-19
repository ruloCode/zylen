/**
 * DailyFocusChallenge — the home banner reimagined as a daily focus challenge.
 * React Native port of the web component (same three states, same i18n keys).
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
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Target, Gift, CheckCircle2, ChevronRight } from 'lucide-react-native';
import toast from '@/lib/toast';
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

// glass-card recipe (PORTING.md)
const glass = 'rounded-2xl border border-white/10 bg-[hsl(var(--glass-bg)/0.65)]';

const GOLD_300 = 'hsl(42, 95%, 66%)';
const GOLD_400 = 'hsl(40, 95%, 58%)';
const ORANGE_500 = '#f97316';
const TEAL_300 = '#5eead4';
const SUCCESS_400 = '#66CB8F';
const WHITE_40 = 'rgba(255,255,255,0.4)';

export function DailyFocusChallenge({
  onLevelUp,
  className = '',
}: DailyFocusChallengeProps) {
  const router = useRouter();
  const { t } = useLocale();
  const { focusStats, claimDailyFocusReward } = useFocus();
  const [isClaiming, setIsClaiming] = useState(false);

  const { minutesGoal, rewardPoints, rewardXP } = FOCUS_CONFIG.dailyChallenge;
  const minutesToday = focusStats?.today.minutes ?? 0;
  const met = minutesToday >= minutesGoal;
  const claimed = focusStats?.todayRewardClaimed ?? false;

  const goFocus = () => router.push(ROUTES.FOCUS);

  const handleClaim = async () => {
    if (isClaiming) return;
    setIsClaiming(true);
    try {
      const result = await claimDailyFocusReward();
      if (!result.ok) {
        // Goal slipped or the reward was already taken elsewhere.
        toast(t('focus.dailyChallenge.claimFailed'));
        return;
      }
      toast.success(
        t('focus.dailyChallenge.claimedToast', {
          points: result.pointsAwarded,
          xp: result.xpAwarded,
        })
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
      <View
        className={`relative mb-7 overflow-hidden rounded-2xl border border-gold-400/30 bg-[hsl(var(--glass-bg)/0.65)] p-4 ${className}`}
      >
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold-400/40 bg-gold-500/20">
            <Gift size={22} color={GOLD_300} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-sm font-bold leading-snug text-white">
              {t('focus.dailyChallenge.readyTitle')}
            </Text>
            <Text className="mt-0.5 text-xs text-white/70">
              {t('focus.dailyChallenge.readyBody')}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={handleClaim}
          disabled={isClaiming}
          className={`relative mt-3 h-11 w-full items-center justify-center overflow-hidden rounded-xl border border-white/25 active:scale-[0.975] ${
            isClaiming ? 'opacity-70' : ''
          }`}
          style={{
            shadowColor: GOLD_400,
            shadowOpacity: 0.45,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 0 },
            elevation: 6,
          }}
        >
          <LinearGradient
            colors={[GOLD_400, ORANGE_500]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
          />
          {isClaiming ? (
            <ActivityIndicator size="small" color="#111827" />
          ) : (
            <Text className="text-sm font-extrabold text-charcoal-900">
              {t('focus.dailyChallenge.claim', {
                points: rewardPoints,
                xp: rewardXP,
              })}
            </Text>
          )}
        </Pressable>
      </View>
    );
  }

  // ── Claimed: reward taken — muted, still a shortcut into Focus.
  if (claimed) {
    return (
      <Pressable
        onPress={goFocus}
        className={`${glass} mb-7 w-full flex-row items-center gap-3 p-4 opacity-90 active:scale-[0.975] ${className}`}
      >
        <View className="h-11 w-11 shrink-0 items-center justify-center rounded-full bg-success-500/15">
          <CheckCircle2 size={22} color={SUCCESS_400} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-sm font-bold leading-snug text-white">
            {t('focus.dailyChallenge.claimedTitle')}
          </Text>
          <Text className="mt-0.5 text-xs text-white/70">
            {t('focus.dailyChallenge.claimedBody')}
          </Text>
        </View>
        <ChevronRight size={20} color={WHITE_40} />
      </Pressable>
    );
  }

  // ── Pending: still working toward the goal — progress + tap into Focus.
  return (
    <Pressable
      onPress={goFocus}
      className={`${glass} mb-7 w-full flex-row items-center gap-3 p-4 active:scale-[0.975] ${className}`}
    >
      <View className="h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-500/15">
        <Target size={22} color={TEAL_300} />
      </View>
      <View className="min-w-0 flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-[10px] font-bold tracking-wider text-gold-300">
            {t('focus.dailyChallenge.badge')}
          </Text>
          <Text className="text-[11px] font-semibold text-white/50">
            {t('focus.dailyChallenge.progress', {
              minutes: minutesToday,
              goal: minutesGoal,
            })}
          </Text>
        </View>
        <Text className="mt-0.5 text-sm font-bold leading-snug text-white">
          {t('focus.dailyChallenge.pendingBody', { goal: minutesGoal })}
        </Text>
        <ProgressBar
          current={minutesToday}
          max={minutesGoal}
          variant="teal"
          size="sm"
          showLabel={false}
          className="mt-2"
        />
      </View>
      <ChevronRight size={20} color={WHITE_40} />
    </Pressable>
  );
}
