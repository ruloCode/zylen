/**
 * Realms — "Reinos de enfoque". Immersive gallery of the life areas as
 * fantasy realms: gem illustration, level, light (XP) progress and habit
 * count per realm. Tapping a realm opens its detail bottom-sheet.
 *
 * React Native port of ../src/pages/Realms.tsx. Stack screen: mounts
 * <Header /> on top. Deep-open uses expo-router search params
 * (`?areaId=...`) instead of the web's navigation state.
 */

import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { MoonStar } from 'lucide-react-native';
import { Header } from '@/components/layout';
import { useHabits, useLifeAreas } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { getAreaLevelProgress } from '@/utils/xp';
import { getLifeAreaMeta } from '@/constants';
import { getIcon } from '@/components/atoms/icons/iconMaps';
import { RealmDetailSheet } from '@/features/realms/components';
import { img } from '@/assets/registry';
import type { LifeArea } from '@/types';

/** glass-card recipe (PORTING.md) */
const glass = 'rounded-2xl border border-white/10 bg-[hsl(var(--glass-bg)/0.65)]';

export function Realms() {
  const { lifeAreas, lifeAreasLoading } = useLifeAreas();
  const { habits } = useHabits();
  const { t } = useLocale();
  const params = useLocalSearchParams<{ areaId?: string }>();
  const [selectedArea, setSelectedArea] = useState<LifeArea | null>(null);
  // Gem illustrations that failed to load fall back to the colored icon.
  const [failedGems, setFailedGems] = useState<Record<string, boolean>>({});
  const deepOpened = useRef(false);

  // Deep-open a realm when navigated with `?areaId=` (e.g. from the
  // focus-areas rows in Progress/Streaks).
  const areaId = typeof params.areaId === 'string' ? params.areaId : undefined;
  useEffect(() => {
    if (deepOpened.current) return;
    if (!areaId || lifeAreas.length === 0) return;
    const target = lifeAreas.find((a) => a.id === areaId);
    if (target) {
      setSelectedArea(target);
      deepOpened.current = true;
    }
  }, [lifeAreas, areaId]);

  if (lifeAreasLoading) {
    return (
      <View className="flex-1 bg-background">
        <Header />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2DD4BF" />
          <Text className="mt-4 font-semibold text-white">{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  // Awake (enabled) realms first; the strongest lead within each group.
  const sortedAreas = [...lifeAreas].sort(
    (a, b) =>
      Number(b.enabled) - Number(a.enabled) ||
      b.level - a.level ||
      b.totalXP - a.totalXP
  );

  return (
    <View className="flex-1 bg-background">
      <Header />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
      >
        {/* Atmospheric backdrop: faint teal light bleeding from the top
            (web: radial gradients — approximated with a vertical fade) */}
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(45,212,191,0.12)', 'rgba(224,169,59,0.04)', 'transparent']}
          style={{ position: 'absolute', top: -24, left: 0, right: 0, height: 280 }}
        />

        <View className="pb-5 pt-2">
          <Text className="text-[28px] font-extrabold leading-tight text-white">
            {t('realms.title')}
          </Text>
          <Text className="mt-1 text-sm leading-snug text-white/70">
            {t('realms.subtitle')}
          </Text>
        </View>

        {sortedAreas.length === 0 ? (
          <Text className="py-10 text-center text-sm text-white/50">{t('realms.empty')}</Text>
        ) : (
          /* web: grid grid-cols-2 gap-3 */
          <View className="flex-row flex-wrap justify-between">
            {sortedAreas.map((area) => {
              const meta = getLifeAreaMeta(area);
              const Icon = getIcon(meta.iconName);
              const label = t(meta.i18nKey, { defaultValue: String(area.area) });
              const prog = getAreaLevelProgress(area.totalXP, area.level);
              const pct =
                prog.max > 0 ? Math.min(Math.max((prog.current / prog.max) * 100, 0), 100) : 0;
              const habitCount = habits.filter((h) => h.lifeArea === area.id).length;
              const gemSource = img(meta.image);
              const showGem = !!gemSource && !failedGems[area.id];

              return (
                <Pressable
                  key={area.id}
                  onPress={() => setSelectedArea(area)}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  className={`${glass} relative mb-3 w-[48.5%] items-center overflow-hidden p-4 active:scale-[0.97] ${
                    area.enabled ? '' : 'opacity-55'
                  }`}
                >
                  {/* Ambient glow behind the gem (web: radial-gradient) */}
                  <View
                    pointerEvents="none"
                    className="absolute -top-4 h-32 w-32 self-center rounded-full"
                    style={{ backgroundColor: `${meta.color}30` }}
                  />

                  {!area.enabled && (
                    <View className="absolute right-2.5 top-2.5 z-10 flex-row items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2 py-0.5">
                      <MoonStar size={10} color="rgba(255,255,255,0.7)" />
                      <Text className="text-[10px] font-semibold text-white/70">
                        {t('realms.dormant')}
                      </Text>
                    </View>
                  )}

                  <View className="mb-2 h-24 w-24 items-center justify-center">
                    {showGem ? (
                      <Image
                        source={gemSource}
                        contentFit="contain"
                        style={{ width: 96, height: 96 }}
                        onError={() =>
                          setFailedGems((prev) => ({ ...prev, [area.id]: true }))
                        }
                        accessibilityElementsHidden
                      />
                    ) : (
                      // Fall back to the colored lucide icon if the gem is missing.
                      <View
                        className="h-16 w-16 items-center justify-center rounded-full"
                        style={{ backgroundColor: meta.color }}
                      >
                        <Icon size={34} color="#FFFFFF" />
                      </View>
                    )}
                  </View>

                  <View className="w-full">
                    <Text
                      className="text-center text-sm font-bold text-white"
                      numberOfLines={1}
                    >
                      {label}
                    </Text>
                    <Text className="mt-0.5 text-center text-[11px] font-medium text-white/55">
                      {t('realms.levelLabel', { level: area.level })} ·{' '}
                      {t('realms.habitsCount', { count: habitCount })}
                    </Text>
                    <View className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <View
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: meta.color }}
                      />
                    </View>
                    <Text className="mt-1 text-center text-[10px] font-medium text-white/45">
                      {prog.current} / {prog.max} {t('progress.xp')}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {selectedArea && (
        <RealmDetailSheet area={selectedArea} onClose={() => setSelectedArea(null)} />
      )}
    </View>
  );
}
