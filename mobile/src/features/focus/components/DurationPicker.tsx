/**
 * DurationPicker — preset chips + a custom stepper (10-120 min, step 5).
 * RN port of ../../../../src/features/focus/components/DurationPicker.tsx.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { cn } from '@/utils/cn';
import { useLocale } from '@/hooks/useLocale';
import { FOCUS_CONFIG } from '@/constants/config';

interface DurationPickerProps {
  minutes: number;
  onChange: (minutes: number) => void;
}

export function DurationPicker({ minutes, onChange }: DurationPickerProps) {
  const { t } = useLocale();

  const step = (delta: number) => {
    const next = Math.min(
      FOCUS_CONFIG.maxMinutes,
      Math.max(FOCUS_CONFIG.minMinutes, minutes + delta)
    );
    onChange(next);
  };

  const atMin = minutes <= FOCUS_CONFIG.minMinutes;
  const atMax = minutes >= FOCUS_CONFIG.maxMinutes;

  return (
    <View>
      {/* Preset chips (web: grid-cols-4) */}
      <View className="flex-row gap-2">
        {FOCUS_CONFIG.presets.map((p) => {
          const active = minutes === p;
          return (
            <Pressable
              key={p}
              onPress={() => onChange(p)}
              className={cn(
                'flex-1 items-center rounded-xl border py-2.5',
                active
                  ? 'border-teal-400 bg-teal-500'
                  : 'border-white/10 bg-white/5'
              )}
              style={
                active
                  ? {
                      shadowColor: '#2dd4bf',
                      shadowOpacity: 0.6,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 0 },
                      elevation: 4,
                    }
                  : undefined
              }
            >
              <Text
                className={cn(
                  'text-sm font-bold',
                  active ? 'text-white' : 'text-teal-300'
                )}
              >
                {p}m
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Custom stepper */}
      <View className="mt-3 flex-row items-center justify-center gap-4">
        <Pressable
          onPress={() => step(-5)}
          accessibilityLabel="-5"
          disabled={atMin}
          className={cn(
            'h-10 w-10 items-center justify-center rounded-full bg-white/10 active:bg-white/15',
            atMin && 'opacity-30'
          )}
        >
          <Minus size={18} color="#ffffff" />
        </Pressable>
        <View className="min-w-[90px] flex-row items-baseline justify-center">
          <Text className="text-3xl font-extrabold tabular-nums text-white">
            {minutes}
          </Text>
          <Text className="ml-1 text-sm font-semibold text-white/60">
            {t('home.minutes')}
          </Text>
        </View>
        <Pressable
          onPress={() => step(5)}
          accessibilityLabel="+5"
          disabled={atMax}
          className={cn(
            'h-10 w-10 items-center justify-center rounded-full bg-white/10 active:bg-white/15',
            atMax && 'opacity-30'
          )}
        >
          <Plus size={18} color="#ffffff" />
        </Pressable>
      </View>
    </View>
  );
}
