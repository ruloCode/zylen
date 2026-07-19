/**
 * MissionCard
 *
 * Real shared-mission card: lucide icon tile, i18n title (by mission code,
 * falling back to the DB title), overlapping participant avatar stack,
 * personal progress bar (my check-ins / duration) and a join / daily
 * check-in action. All state comes from the get_shared_missions RPC.
 * RN port: gradient CTAs → LinearGradient inside a Pressable.
 */

import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Check,
  Droplets,
  Dumbbell,
  Sparkles,
  Sprout,
  Sunrise,
  Target,
  type LucideIcon,
} from 'lucide-react-native';
import { useLocale } from '@/hooks/useLocale';
import { img } from '@/assets/registry';
import type { SharedMission } from '@/types/community';

interface MissionCardProps {
  mission: SharedMission;
  onJoin: (missionId: string) => Promise<void>;
  onCheckin: (missionId: string) => Promise<void>;
}

// Seed catalog uses these lucide names; unknown codes fall back to Target.
const MISSION_ICONS: Record<string, LucideIcon> = {
  Droplets,
  Sunrise,
  Dumbbell,
  Sprout,
};

const ICON_TINTS: Record<string, string> = {
  Droplets: '#5eead4', // teal-300
  Sunrise: 'hsl(40, 95%, 58%)', // gold-400
  Dumbbell: '#fb923c', // orange-400
  Sprout: '#6ee7b7', // emerald-300
};

const TEAL_GRADIENT = ['#2dd4bf', '#0d9488'] as const; // from-teal-400 to-teal-600
const GOLD_GRADIENT = ['hsl(40, 95%, 58%)', 'hsl(34, 92%, 46%)'] as const; // from-gold-400 to-gold-600

const avatarSource = (url?: string) =>
  url ? (url.startsWith('/') ? img(url) : { uri: url }) : undefined;

export function MissionCard({ mission, onJoin, onCheckin }: MissionCardProps) {
  const { t } = useLocale();
  const [busy, setBusy] = useState(false);

  const Icon = (mission.iconName && MISSION_ICONS[mission.iconName]) || Target;
  const tint = (mission.iconName && ICON_TINTS[mission.iconName]) || '#5eead4';
  const title = t(`community.missions.catalog.${mission.code}.title`, {
    defaultValue: mission.title,
  });
  const pct = Math.min(
    (mission.myDaysCompleted / mission.durationDays) * 100,
    100
  );

  const handleAction = async (action: (id: string) => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await action(mission.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
      {/* Title row: icon tile + title + action */}
      <View className="mb-2.5 flex-row items-center gap-2.5">
        <View className="h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]">
          <Icon size={17} color={tint} />
        </View>
        <Text
          numberOfLines={2}
          className="min-w-0 flex-1 text-sm font-semibold leading-tight text-white"
        >
          {title}
        </Text>
        {/* Action */}
        {mission.isCompleted ? (
          <View className="flex-row items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1.5">
            <Check size={12} strokeWidth={3} color="#6ee7b7" />
            <Text className="text-[11px] font-bold text-emerald-300">
              {t('community.missions.completed')}
            </Text>
          </View>
        ) : !mission.isJoined ? (
          <Pressable
            disabled={busy}
            onPress={() => handleAction(onJoin)}
            hitSlop={10}
            accessibilityRole="button"
            className={`overflow-hidden rounded-full active:scale-95 ${busy ? 'opacity-50' : ''}`}
          >
            <LinearGradient
              colors={TEAL_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ paddingHorizontal: 12, paddingVertical: 6 }}
            >
              <Text className="text-[11px] font-bold text-white">
                {t('community.missions.join')}
              </Text>
            </LinearGradient>
          </Pressable>
        ) : mission.checkedInToday ? (
          <View className="flex-row items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1.5">
            <Check size={12} strokeWidth={3} color="rgba(255,255,255,0.5)" />
            <Text className="text-[11px] font-bold text-white/50">
              {t('community.missions.checkedIn')}
            </Text>
          </View>
        ) : (
          <Pressable
            disabled={busy}
            onPress={() => handleAction(onCheckin)}
            hitSlop={10}
            accessibilityRole="button"
            className={`overflow-hidden rounded-full active:scale-95 ${busy ? 'opacity-50' : ''}`}
          >
            <LinearGradient
              colors={GOLD_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ paddingHorizontal: 12, paddingVertical: 6 }}
            >
              <Text className="text-[11px] font-bold text-charcoal-900">
                {t('community.missions.checkIn')}
              </Text>
            </LinearGradient>
          </Pressable>
        )}
      </View>

      {/* Personal progress */}
      <View className="mb-2 flex-row items-center gap-2">
        <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <LinearGradient
            colors={TEAL_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              height: '100%',
              borderRadius: 999,
              width: `${mission.isJoined ? pct : 0}%`,
            }}
          />
        </View>
        <Text className="text-[11px] font-bold tabular-nums text-white/60">
          {mission.isJoined ? mission.myDaysCompleted : 0}/{mission.durationDays}
        </Text>
      </View>

      {/* Reward + participants */}
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-row items-center gap-1">
          <Text className="text-[11px] font-bold text-gold-400">
            {t('community.missions.reward', { xp: mission.rewardXP })}
          </Text>
          <Sparkles size={10} color="hsl(40, 95%, 58%)" />
        </View>

        {mission.participantAvatars.length > 0 && (
          <View className="min-w-0 flex-row items-center">
            <View className="flex-row">
              {mission.participantAvatars.map((p, index) => (
                <View
                  key={p.userId}
                  className="h-6 w-6 items-center justify-center overflow-hidden rounded-full border-2 border-background bg-teal-700/20"
                  style={index > 0 ? { marginLeft: -8 } : undefined}
                >
                  {p.avatarUrl ? (
                    <Image
                      source={avatarSource(p.avatarUrl)}
                      accessibilityLabel={p.username}
                      contentFit="cover"
                      contentPosition="top"
                      style={{ width: '100%', height: '100%' }}
                    />
                  ) : (
                    <Text className="text-[9px] font-bold text-white">
                      {p.username.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
              ))}
              {mission.participantCount > mission.participantAvatars.length && (
                <View
                  className="h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-white/10"
                  style={{ marginLeft: -8 }}
                >
                  <Text className="text-[9px] font-bold text-white/70">
                    +{mission.participantCount - mission.participantAvatars.length}
                  </Text>
                </View>
              )}
            </View>
            <Text
              numberOfLines={1}
              className="ml-1.5 text-[10px] font-medium text-white/45"
            >
              {t('community.missions.participants', { count: mission.participantCount })}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default MissionCard;
