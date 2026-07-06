/**
 * GemPicker — horizontal scroll of the user's gems + a "new gem" card.
 * The selected gem gets a species-colored ring and glow (native: colored
 * border + soft shadow instead of the CSS blur halo).
 */

import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Plus } from 'lucide-react-native';
import { cn } from '@/utils/cn';
import { useLocale } from '@/hooks/useLocale';
import { img } from '@/assets/registry';
import type { FocusGem } from '@/types/focus';
import { gemStageImageSource, speciesMeta } from '../utils/gemAssets';
import { displayGemName } from '../utils/displayGemName';

interface GemPickerProps {
  gems: FocusGem[];
  selectedGemId: string | null;
  onSelect: (gemId: string) => void;
  onCreateNew: () => void;
}

export function GemPicker({
  gems,
  selectedGemId,
  onSelect,
  onCreateNew,
}: GemPickerProps) {
  const { t } = useLocale();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="-mx-4"
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8, gap: 12 }}
    >
      {gems.map((gem) => {
        const meta = speciesMeta(gem.species);
        const selected = gem.id === selectedGemId;
        return (
          <Pressable
            key={gem.id}
            onPress={() => onSelect(gem.id)}
            className={cn(
              'w-28 shrink-0 items-center gap-1.5 rounded-2xl bg-[hsl(var(--glass-bg)/0.65)] p-3',
              selected ? 'border-2' : 'border border-white/10 opacity-80'
            )}
            style={
              selected
                ? {
                    borderColor: meta.color,
                    shadowColor: meta.color,
                    shadowOpacity: 0.55,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 0 },
                    elevation: 5,
                  }
                : undefined
            }
          >
            <View className="relative h-16 w-16 items-center justify-center">
              {selected && (
                <View
                  className="absolute inset-0 rounded-full opacity-40"
                  style={{ backgroundColor: meta.color }}
                />
              )}
              <Image
                source={gemStageImageSource(gem.species, 4) ?? img(meta.image)}
                contentFit="contain"
                style={{ width: 64, height: 64 }}
                accessibilityElementsHidden
              />
            </View>
            <Text
              numberOfLines={1}
              className="w-full text-center text-xs font-bold leading-tight text-white"
            >
              {displayGemName(gem.name, t)}
            </Text>
            <Text
              numberOfLines={1}
              className="w-full text-center text-[10px] font-semibold"
              style={{ color: meta.color }}
            >
              {t(meta.i18nKey)}
            </Text>
          </Pressable>
        );
      })}

      {/* New gem card */}
      <Pressable
        onPress={onCreateNew}
        className="min-h-[124px] w-28 shrink-0 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/20 p-3 active:border-white/40"
      >
        <View className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
          <Plus size={20} color="rgba(255,255,255,0.6)" />
        </View>
        <Text className="text-xs font-bold text-white/60">
          {t('focus.newGem')}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
