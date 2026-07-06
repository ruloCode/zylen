/**
 * RealmDetailSheet — bottom sheet with the detail of a focus realm (life
 * area): gem illustration, level, total light (XP), progress to the next
 * level, and the habits that feed this realm with today's completion state.
 *
 * React Native port: a transparent Modal anchored to the bottom edge
 * (simple bottom-sheet) instead of the web's fixed overlay.
 */

import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { X, CheckCircle2, Circle } from 'lucide-react-native';
import { useHabits } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { getLifeAreaMeta } from '@/constants';
import { getIcon, HABIT_ICONS } from '@/components/atoms/icons/iconMaps';
import { LevelBadge } from '@/components/ui';
import { getAreaLevelProgress } from '@/utils/xp';
import { img } from '@/assets/registry';
import type { LifeArea } from '@/types';

interface RealmDetailSheetProps {
  area: LifeArea;
  onClose: () => void;
}

export function RealmDetailSheet({ area, onClose }: RealmDetailSheetProps) {
  const { t } = useLocale();
  const { habits } = useHabits();

  const meta = getLifeAreaMeta(area);
  const AreaIcon = getIcon(meta.iconName);
  const name = t(meta.i18nKey, { defaultValue: String(area.area) });

  const areaHabits = habits.filter((h) => h.lifeArea === area.id);
  const completedCount = areaHabits.filter((h) => h.completedToday).length;

  const prog = getAreaLevelProgress(area.totalXP, area.level);
  const pct = prog.max > 0 ? Math.min(Math.max((prog.current / prog.max) * 100, 0), 100) : 0;
  const xpToNext = Math.max(prog.max - prog.current, 0);

  // Fall back to the colored lucide icon if the gem illustration is missing
  // (unregistered path) or fails to load.
  const gemSource = img(meta.image);
  const [gemFailed, setGemFailed] = useState(false);
  const showGem = !!gemSource && !gemFailed;

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        {/* Backdrop press closes the sheet */}
        <Pressable
          onPress={onClose}
          style={StyleSheet.absoluteFill}
          accessibilityLabel={t('lifeAreaModal.close')}
        />

        <View
          className="rounded-t-3xl border border-white/10 bg-charcoal-500"
          style={{ maxHeight: '92%' }}
          accessibilityViewIsModal
          accessibilityLabel={t('lifeAreaModal.title')}
        >
          {/* Header */}
          <View className="flex-row items-center gap-3 border-b border-white/10 px-5 py-4">
            <View className="h-11 w-11 shrink-0 items-center justify-center">
              {showGem ? (
                <Image
                  source={gemSource}
                  contentFit="contain"
                  style={{ width: 44, height: 44 }}
                  onError={() => setGemFailed(true)}
                  accessibilityElementsHidden
                />
              ) : (
                <View
                  className="h-11 w-11 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `${meta.color}26` }}
                >
                  <AreaIcon size={24} color={meta.color} />
                </View>
              )}
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-lg font-bold text-white" numberOfLines={1}>
                {name}
              </Text>
              <Text className="text-xs text-white/50">{t('lifeAreaModal.title')}</Text>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('lifeAreaModal.close')}
              className="h-9 w-9 items-center justify-center rounded-xl bg-white/10 active:bg-white/15"
            >
              <X size={20} color="rgba(255,255,255,0.7)" />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
            {/* Hero: big gem over an ambient glow, plus the realm level */}
            <View className="items-center pt-2">
              {/* Ambient glow behind the gem (web: radial-gradient) */}
              <View
                pointerEvents="none"
                className="absolute top-0 h-36 w-36 self-center rounded-full"
                style={{ backgroundColor: `${meta.color}38` }}
              />
              <View className="h-36 w-36 items-center justify-center">
                {showGem ? (
                  <Image
                    source={gemSource}
                    contentFit="contain"
                    style={{ width: 144, height: 144 }}
                    onError={() => setGemFailed(true)}
                    accessibilityElementsHidden
                  />
                ) : (
                  <View
                    className="h-24 w-24 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${meta.color}26` }}
                  >
                    <AreaIcon size={48} color={meta.color} />
                  </View>
                )}
              </View>
              <LevelBadge level={area.level} size="md" className="-mt-1" />
            </View>

            {/* Light (XP) stats and progress to the next level */}
            <View className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <View className="mb-4 flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-xs font-medium text-white/50">
                    {t('lifeAreaModal.totalXP')}
                  </Text>
                  <Text className="mt-0.5 text-xl font-bold text-gold-400">{area.totalXP}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-medium text-white/50">
                    {t('lifeAreaModal.xpToNextLevel', { level: area.level + 1 })}
                  </Text>
                  <Text className="mt-0.5 text-xl font-bold text-white">{xpToNext}</Text>
                </View>
              </View>
              <View className="h-2 overflow-hidden rounded-full bg-white/10">
                <View
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: meta.color }}
                />
              </View>
              <View className="mt-1.5 flex-row items-center justify-between">
                <Text className="text-[11px] font-medium text-white/50">
                  {prog.current} / {prog.max} {t('progress.xp')}
                </Text>
                <Text className="text-[11px] font-medium text-white/50">{Math.round(pct)}%</Text>
              </View>
            </View>

            {/* Habits feeding this realm */}
            <View>
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-white">
                  {t('lifeAreaModal.habitsInArea')}
                </Text>
                {areaHabits.length > 0 && (
                  <Text className="text-xs font-medium text-white/50">
                    {completedCount}/{areaHabits.length} · {t('lifeAreaModal.completedToday')}
                  </Text>
                )}
              </View>
              {areaHabits.length === 0 ? (
                <Text className="py-6 text-center text-sm text-white/50">
                  {t('lifeAreaModal.noHabits')}
                </Text>
              ) : (
                <View className="gap-2">
                  {areaHabits.map((habit) => {
                    const HabitIcon = HABIT_ICONS[habit.iconName];
                    const accent = habit.color || meta.color;
                    return (
                      <View
                        key={habit.id}
                        className="flex-row items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"
                      >
                        <View
                          className="h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                          style={{ backgroundColor: `${accent}26` }}
                        >
                          {HabitIcon && <HabitIcon size={20} color={accent} />}
                        </View>
                        <View className="min-w-0 flex-1">
                          <Text className="text-sm font-semibold text-white" numberOfLines={1}>
                            {habit.name}
                          </Text>
                          <Text className="text-xs font-medium text-gold-400/90">
                            +{habit.xp} {t('progress.xp')}
                          </Text>
                        </View>
                        {habit.completedToday ? (
                          <CheckCircle2 size={20} color="#34D399" />
                        ) : (
                          <Circle size={20} color="rgba(255,255,255,0.3)" />
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default RealmDetailSheet;
