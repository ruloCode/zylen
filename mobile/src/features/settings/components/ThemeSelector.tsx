/**
 * ThemeSelector — React Native port.
 *
 * VS-Code-style theme palette picker. Each card previews a theme's
 * background / surface / text / accent and selecting one re-styles the
 * entire app instantly (themeSlice → ThemeProvider re-renders with the new
 * NativeWind vars). Swatch values from THEMES are literal HSL colors used
 * directly as backgroundColor so each card always shows its own palette.
 *
 * The web's roving-tabindex keyboard navigation does not apply on touch;
 * radios are exposed via accessibilityRole/State instead.
 */

import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { useLocale } from '@/hooks/useLocale';
import { useTheme } from '@/hooks/useTheme';
import { THEMES, ThemeMeta } from '@/constants/themes';
import { ThemeId } from '@/utils/theme';
import { cn } from '@/utils';

/** 'hsl(240 30% 8%)' → 'hsl(240, 30%, 8%)' — RN color parser needs commas. */
function hslLiteral(value: string): string {
  const [h, s, l] = value.match(/[\d.]+%?/g) ?? ['0', '0%', '0%'];
  return `hsl(${h}, ${s}, ${l})`;
}

interface ThemeSelectorProps {
  /**
   * Display variant
   * - 'grid': preview cards in a wrapping grid (default, used in Settings/Onboarding)
   * - 'compact': a horizontal row of small swatch chips (for tight spaces)
   */
  variant?: 'grid' | 'compact';
  className?: string;
}

export function ThemeSelector({ variant = 'grid', className }: ThemeSelectorProps) {
  const { t } = useLocale();
  const { theme, setTheme } = useTheme();

  const renderCompact = (th: ThemeMeta) => {
    const isSelected = th.id === theme;
    const name = t(th.nameKey);
    const bg = hslLiteral(th.swatch.bg);
    const accent = hslLiteral(th.swatch.accent);

    return (
      <Pressable
        key={th.id}
        onPress={() => setTheme(th.id)}
        accessibilityRole="radio"
        accessibilityState={{ checked: isSelected }}
        accessibilityLabel={name}
        className={cn(
          'relative h-10 w-10 shrink-0 items-center justify-center rounded-full border-2',
          isSelected ? 'border-primary' : 'border-transparent'
        )}
        style={{ backgroundColor: bg }}
      >
        <View className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: accent }} />
        {isSelected && (
          <View
            className="absolute h-4 w-4 items-center justify-center rounded-full"
            style={{ right: -4, top: -4, backgroundColor: accent }}
          >
            <Check size={10} strokeWidth={3} color={bg} />
          </View>
        )}
      </Pressable>
    );
  };

  const renderCard = (th: ThemeMeta) => {
    const isSelected = th.id === theme;
    const name = t(th.nameKey);
    const desc = t(th.descKey);
    const bg = hslLiteral(th.swatch.bg);
    const surface = hslLiteral(th.swatch.surface);
    const text = hslLiteral(th.swatch.text);
    const accent = hslLiteral(th.swatch.accent);

    return (
      <Pressable
        key={th.id}
        onPress={() => setTheme(th.id)}
        accessibilityRole="radio"
        accessibilityState={{ checked: isSelected }}
        accessibilityLabel={`${name} — ${desc}`}
        className={cn(
          'w-[47%] overflow-hidden rounded-2xl border-2',
          isSelected ? 'border-primary' : 'border-border active:border-primary/50'
        )}
      >
        {/* Mini mockup preview */}
        <View className="p-3" style={{ backgroundColor: bg }}>
          <View
            className="h-20 justify-between rounded-lg p-2.5"
            style={{ backgroundColor: surface }}
          >
            <View className="gap-1.5">
              <View className="h-2 w-3/5 rounded-full" style={{ backgroundColor: text }} />
              <View
                className="h-2 w-2/5 rounded-full opacity-60"
                style={{ backgroundColor: text }}
              />
            </View>
            <View className="items-end">
              <View className="h-4 w-12 rounded-md" style={{ backgroundColor: accent }} />
            </View>
          </View>
        </View>

        {/* Label */}
        <View className="flex-row items-start justify-between gap-2 bg-surface p-3">
          <View className="min-w-0 flex-1">
            <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
              {name}
            </Text>
            <Text className="text-xs text-[hsl(var(--text-tertiary))]" numberOfLines={1}>
              {desc}
            </Text>
          </View>
          {isSelected && (
            <View
              className="h-5 w-5 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: accent }}
            >
              <Check size={12} strokeWidth={3} color={bg} />
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  if (variant === 'compact') {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityRole="radiogroup"
        accessibilityLabel={t('themes.ariaLabel')}
        className={className}
        contentContainerStyle={{ gap: 8, paddingBottom: 4, paddingTop: 4, paddingRight: 4 }}
      >
        {THEMES.map((th) => renderCompact(th))}
      </ScrollView>
    );
  }

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={t('themes.ariaLabel')}
      className={cn('flex-row flex-wrap gap-3', className)}
    >
      {THEMES.map((th) => renderCard(th))}
    </View>
  );
}

export default ThemeSelector;

// re-export for convenience
export type { ThemeId };
