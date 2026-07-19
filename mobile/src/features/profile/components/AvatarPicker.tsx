/**
 * AvatarPicker — React Native port.
 *
 * Reusable avatar selector showing the explorer avatars (AVATAR_OPTIONS).
 * Presentational: the parent owns the selected value and persistence.
 * Used in Profile (change avatar) and in onboarding.
 * Props are identical to the web version: { value, onChange, className }.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Check, Wand2 } from 'lucide-react-native';
import { cn } from '@/utils';
import { useLocale } from '@/hooks/useLocale';
import { useTheme } from '@/hooks/useTheme';
import { AVATAR_OPTIONS, THEMES, isCustomAvatar } from '@/constants';
import { img } from '@/assets/registry';

/** 'hsl(240 30% 8%)' → 'hsl(240, 30%, 8%)' — RN color parser needs commas. */
function hslLiteral(value: string): string {
  const [h, s, l] = value.match(/[\d.]+%?/g) ?? ['0', '0%', '0%'];
  return `hsl(${h}, ${s}, ${l})`;
}

interface AvatarPickerProps {
  /** Currently selected avatar url. */
  value: string;
  /** Called with the chosen avatar url. */
  onChange: (url: string) => void;
  /**
   * Custom AI avatar bust to offer as a tile (usually the user's saved
   * avatarUrl when it points at storage). Falls back to `value` when the
   * current selection itself is custom.
   */
  customAvatarUrl?: string;
  /** When provided, renders a "create with your photo" tile. */
  onCreateCustom?: () => void;
  className?: string;
}

export function AvatarPicker({
  value,
  onChange,
  customAvatarUrl,
  onCreateCustom,
  className,
}: AvatarPickerProps) {
  const { t } = useLocale();
  const { theme } = useTheme();

  // Contrast color for the check mark on the accent chip.
  const themeBg = hslLiteral((THEMES.find((th) => th.id === theme) ?? THEMES[0]).swatch.bg);

  const customUrl = customAvatarUrl ?? (isCustomAvatar(value) ? value : undefined);

  return (
    <View className={cn('flex-row flex-wrap gap-3', className)}>
      {customUrl ? (
        <Pressable
          onPress={() => onChange(customUrl)}
          accessibilityRole="button"
          accessibilityLabel={t('profile.avatars.custom')}
          accessibilityState={{ selected: value === customUrl }}
          className={cn(
            'w-[30%] items-center gap-2 rounded-2xl border p-2',
            value === customUrl
              ? 'border-teal-400/70 bg-teal-500/15'
              : 'border-white/10 bg-white/[0.04] active:bg-white/[0.07]'
          )}
        >
          <View className="relative aspect-square w-full overflow-hidden rounded-xl bg-teal-500/15">
            <Image
              source={{ uri: customUrl }}
              accessibilityLabel={t('profile.avatars.custom')}
              contentFit="cover"
              contentPosition="top"
              style={{ width: '100%', height: '100%' }}
            />
            {value === customUrl && (
              <View className="absolute right-1 top-1 h-5 w-5 items-center justify-center rounded-full bg-teal-400">
                <Check size={13} strokeWidth={3} color={themeBg} />
              </View>
            )}
          </View>
          <Text
            className={cn(
              'text-[11px] font-semibold leading-tight',
              value === customUrl ? 'text-teal-200' : 'text-white/60'
            )}
          >
            {t('profile.avatars.custom')}
          </Text>
        </Pressable>
      ) : null}

      {AVATAR_OPTIONS.map((option) => {
        const isSelected = value === option.url;
        const name = t(option.nameKey);
        return (
          <Pressable
            key={option.id}
            onPress={() => onChange(option.url)}
            accessibilityRole="button"
            accessibilityLabel={name}
            accessibilityState={{ selected: isSelected }}
            className={cn(
              'w-[30%] items-center gap-2 rounded-2xl border p-2',
              isSelected
                ? 'border-teal-400/70 bg-teal-500/15'
                : 'border-white/10 bg-white/[0.04] active:bg-white/[0.07]'
            )}
          >
            <View className="relative aspect-square w-full overflow-hidden rounded-xl bg-teal-500/15">
              <Image
                source={img(option.url)}
                accessibilityLabel={name}
                contentFit="cover"
                contentPosition="top"
                style={{ width: '100%', height: '100%' }}
              />
              {isSelected && (
                <View className="absolute right-1 top-1 h-5 w-5 items-center justify-center rounded-full bg-teal-400">
                  <Check size={13} strokeWidth={3} color={themeBg} />
                </View>
              )}
            </View>
            <Text
              className={cn(
                'text-[11px] font-semibold leading-tight',
                isSelected ? 'text-teal-200' : 'text-white/60'
              )}
            >
              {name}
            </Text>
          </Pressable>
        );
      })}

      {onCreateCustom ? (
        <Pressable
          onPress={onCreateCustom}
          accessibilityRole="button"
          accessibilityLabel={t('profile.avatars.createCustom')}
          className="w-[30%] items-center gap-2 rounded-2xl border border-dashed border-teal-400/40 bg-white/[0.04] p-2 active:bg-teal-500/10"
        >
          <View className="aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-teal-500/10">
            <Wand2 size={26} color="#5EEAD4" />
          </View>
          <Text className="text-center text-[11px] font-semibold leading-tight text-teal-200">
            {t('profile.avatars.createCustom')}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default AvatarPicker;
