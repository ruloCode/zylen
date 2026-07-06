/**
 * Profile Header Component — React Native port.
 * Shows user avatar, name, and key stats (level / total XP / points).
 */

import React from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Coins, Star, TrendingUp } from 'lucide-react-native';
import { User } from '@/types';
import { useLocale } from '@/hooks/useLocale';
import { useTheme } from '@/hooks/useTheme';
import { THEMES } from '@/constants/themes';
import { img } from '@/assets/registry';
import { GlassCard } from '@/components/ui';

// Literal icon colors (lucide-react-native needs concrete values)
const GOLD_400 = 'hsl(40, 95%, 58%)';
const XP_GREEN = 'rgb(155, 215, 50)';

/** 'hsl(240 30% 8%)' → 'hsl(240, 30%, 8%)' — RN color parser needs commas. */
function hslLiteral(value: string): string {
  const [h, s, l] = value.match(/[\d.]+%?/g) ?? ['0', '0%', '0%'];
  return `hsl(${h}, ${s}, ${l})`;
}

interface ProfileHeaderProps {
  user: User;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const { t } = useLocale();
  const { theme } = useTheme();

  const accent = hslLiteral(
    (THEMES.find((th) => th.id === theme) ?? THEMES[0]).swatch.accent
  );

  const avatarSource = user.avatarUrl
    ? user.avatarUrl.startsWith('/')
      ? img(user.avatarUrl)
      : { uri: user.avatarUrl }
    : undefined;

  return (
    <GlassCard className="p-6">
      {/* Avatar and Name - Always Centered */}
      <View className="mb-6 items-center">
        <View className="mb-4">
          {avatarSource ? (
            <Image
              source={avatarSource}
              accessibilityLabel={user.name}
              contentFit="cover"
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                borderWidth: 4,
                borderColor: GOLD_400,
              }}
            />
          ) : (
            <LinearGradient
              colors={[accent, GOLD_400]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                borderWidth: 4,
                borderColor: GOLD_400,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text className="text-3xl font-bold text-white">
                {user.name.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          )}
        </View>
        <Text className="text-2xl font-bold text-white">{user.name}</Text>
      </View>

      {/* Stats — 3-column row (web grid-cols-3) */}
      <View className="flex-row gap-3">
        {/* Level */}
        <View className="flex-1 flex-row items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2.5">
          <Star size={20} color={accent} />
          <View className="min-w-0 flex-1">
            <Text className="text-xs text-white/70" numberOfLines={1}>
              {t('common.level')}
            </Text>
            <Text className="font-bold text-white">{user.level}</Text>
          </View>
        </View>

        {/* Total XP */}
        <View className="flex-1 flex-row items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2.5">
          <TrendingUp size={20} color={XP_GREEN} />
          <View className="min-w-0 flex-1">
            <Text className="text-xs text-white/70" numberOfLines={1}>
              {t('common.totalXP')}
            </Text>
            <Text className="font-bold text-white">
              {user.totalXPEarned.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Points */}
        <View className="flex-1 flex-row items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2.5">
          <Coins size={20} color={GOLD_400} />
          <View className="min-w-0 flex-1">
            <Text className="text-xs text-white/70" numberOfLines={1}>
              {t('common.points')}
            </Text>
            <Text className="font-bold text-white">{user.points.toLocaleString()}</Text>
          </View>
        </View>
      </View>
    </GlassCard>
  );
}

export default ProfileHeader;
