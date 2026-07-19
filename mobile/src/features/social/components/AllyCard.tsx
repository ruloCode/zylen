/**
 * AllyCard
 *
 * Compact ally tile for the "Tus aliados" rail: avatar wrapped in a level
 * progress ring + streak-status dot, name, level and current streak.
 * All data is real (FriendProfile) — the ring is progress to next level.
 * RN port of web src/features/social/components/AllyCard.tsx.
 */

import React from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame } from 'lucide-react-native';
import { cn } from '@/utils';
import { formatRelativeShort } from '@/utils/date';
import { useLocale } from '@/hooks/useLocale';
import { getLevelProgress } from '@/utils/xp';
import { img } from '@/assets/registry';
import type { FriendProfile } from '@/types/social';
import { ProgressRing } from './ProgressRing';

interface AllyCardProps {
  ally: FriendProfile;
  className?: string;
}

const ACTIVE_NOW_MS = 10 * 60 * 1000;

/** Web `from-teal-500/20 to-teal-700/10` avatar backdrop */
const AVATAR_GRADIENT = ['rgba(20,184,166,0.2)', 'rgba(15,118,110,0.1)'] as const;

const avatarSource = (url?: string) =>
  url ? (url.startsWith('/') ? img(url) : { uri: url }) : undefined;

export function AllyCard({ ally, className }: AllyCardProps) {
  const { t, language } = useLocale();
  const progress = getLevelProgress(ally.totalXPEarned, ally.level);
  const flameAlive = ally.currentStreak > 0;
  const activeNow =
    !!ally.lastActiveAt && Date.now() - ally.lastActiveAt.getTime() < ACTIVE_NOW_MS;

  return (
    <View
      className={cn(
        'w-[132px] items-center rounded-2xl border border-white/10 bg-white/[0.04] p-3',
        className
      )}
    >
      <View className="relative">
        <ProgressRing percentage={progress.percentage} size={72}>
          <LinearGradient
            colors={AVATAR_GRADIENT}
            style={{
              width: 58,
              height: 58,
              borderRadius: 29,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {ally.avatarUrl ? (
              <Image
                source={avatarSource(ally.avatarUrl)}
                accessibilityLabel={ally.username}
                contentFit="cover"
                contentPosition="top"
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <Text className="text-lg font-bold text-white">
                {ally.username.charAt(0).toUpperCase()}
              </Text>
            )}
          </LinearGradient>
        </ProgressRing>
        {/* Presence dot: green while the ally is active right now */}
        <View
          className={cn(
            'absolute left-0.5 top-0.5 h-3 w-3 rounded-full border-2 border-background',
            activeNow ? 'bg-emerald-400' : 'bg-white/25'
          )}
        />
        {/* Level progress % */}
        <View className="absolute -bottom-1 -right-1 rounded-full border border-teal-400/40 bg-background px-1.5 py-0.5">
          <Text className="text-[10px] font-bold text-teal-300">
            {progress.percentage}%
          </Text>
        </View>
      </View>

      <Text numberOfLines={1} className="mt-2 w-full text-center text-sm font-bold text-white">
        {ally.username}
      </Text>
      <Text className="text-center text-[11px] font-medium text-white/55">
        {t('common.level')} {ally.level}
      </Text>

      <View className="mt-1 flex-row items-center gap-1">
        <Flame
          size={12}
          color={flameAlive ? '#fb923c' : 'rgba(255,255,255,0.35)'}
          fill={flameAlive ? 'rgba(249,115,22,0.3)' : 'none'}
        />
        <Text
          className={cn(
            'text-[11px] font-semibold',
            flameAlive ? 'text-orange-400' : 'text-white/35'
          )}
        >
          {t('social.streakDays', { count: ally.currentStreak })}
        </Text>
      </View>
      {/* Presence line when known; flame status otherwise */}
      {activeNow ? (
        <Text className="text-[10px] font-semibold text-emerald-400">
          ● {t('community.allies.activeNow')}
        </Text>
      ) : ally.lastActiveAt ? (
        <Text className="text-[10px] font-semibold text-white/35">
          {formatRelativeShort(ally.lastActiveAt, language) ||
            t('community.activity.justNow')}
        </Text>
      ) : (
        <Text
          className={cn(
            'text-[10px] font-semibold',
            flameAlive ? 'text-emerald-400' : 'text-white/35'
          )}
        >
          {flameAlive ? t('social.hub.flameAlive') : t('social.hub.flameOut')}
        </Text>
      )}
    </View>
  );
}

export default AllyCard;
