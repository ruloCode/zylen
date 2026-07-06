/**
 * LevelUpNotification — React Native port.
 * Full-screen celebration rendered in a transparent native Modal. The web's
 * shimmer/sparkle keyframes are simplified to static sparkles; auto-close and
 * tap-to-dismiss behavior is identical.
 */

import React, { useEffect, useRef } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Coins, Sparkles, Trophy } from 'lucide-react-native';
import { useLocale } from '@/hooks/useLocale';

interface LevelUpNotificationProps {
  level: number;
  type: 'global' | 'area';
  areaName?: string;
  pointsReward: number;
  onClose?: () => void;
  autoCloseDelay?: number; // ms
}

const GOLD_LIGHT = '#FBC956'; // gold-300

/**
 * LevelUpNotification - Animated notification for level ups
 */
export function LevelUpNotification({
  level,
  type,
  areaName,
  pointsReward,
  onClose,
  autoCloseDelay = 4000,
}: LevelUpNotificationProps) {
  const { t } = useLocale();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const closeTimer = setTimeout(() => {
      onCloseRef.current?.();
    }, autoCloseDelay);
    return () => clearTimeout(closeTimer);
  }, [autoCloseDelay]);

  const handleClose = () => {
    onClose?.();
  };

  const title =
    type === 'global' ? t('levelUp.title') : t('levelUp.areaTitle', { area: areaName });

  return (
    <Modal transparent animationType="fade" visible onRequestClose={handleClose}>
      <Pressable
        onPress={handleClose}
        className="flex-1 items-center justify-center bg-black/70 p-6"
        accessibilityRole="alert"
        accessibilityLabel={title}
      >
        <Pressable
          onPress={() => undefined}
          className="w-full max-w-[340px] overflow-hidden rounded-2xl border-2 border-gold-400 bg-[hsl(var(--glass-bg)/0.92)] p-7"
        >
          {/* Golden wash (web: from-gold-500/25 to-gold-600/10 gradient) */}
          <LinearGradient
            colors={['rgba(249,164,16,0.25)', 'rgba(225,132,9,0.10)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* Static sparkles (web animates them rising) */}
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <View className="absolute right-5 top-4">
              <Sparkles size={20} color={GOLD_LIGHT} />
            </View>
            <View className="absolute bottom-8 left-5">
              <Sparkles size={14} color={GOLD_LIGHT} />
            </View>
            <View className="absolute left-8 top-1/3">
              <Sparkles size={16} color={GOLD_LIGHT} />
            </View>
            <View className="absolute bottom-5 right-10">
              <Sparkles size={12} color={GOLD_LIGHT} />
            </View>
          </View>

          {/* Content */}
          <View className="items-center gap-3">
            {/* Icon */}
            <View className="h-20 w-20 items-center justify-center rounded-full border-2 border-gold-400 bg-gold-400/20">
              <Trophy size={40} color={GOLD_LIGHT} />
            </View>

            {/* Title */}
            <Text className="text-center text-2xl font-bold text-gold-100">{title}</Text>

            {/* Level Badge */}
            <View className="overflow-hidden rounded-full">
              <LinearGradient
                colors={['#FAB62E', '#F9A410']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
              <Text className="px-7 py-2.5 text-2xl font-bold text-[#1C1917]">
                {t('levelUp.levelLabel', { level })}
              </Text>
            </View>

            {/* Reward */}
            {pointsReward > 0 && (
              <View className="flex-row items-center gap-2">
                <Coins size={20} color="#FDDF8C" />
                <Text className="text-lg font-semibold text-gold-200">
                  {t('levelUp.essenceReward', { points: pointsReward })}
                </Text>
              </View>
            )}

            {/* Close */}
            <Pressable
              onPress={handleClose}
              className="mt-2 rounded-xl bg-white/10 px-6 py-2 active:bg-white/20"
              accessibilityRole="button"
            >
              <Text className="text-sm font-semibold text-white">{t('levelUp.dismiss')}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
