/**
 * HabitScienceSheet — educational bottom sheet for a catalog habit.
 * Shows what the science says, short/long-term benefits, how to start well
 * and the typical frustrations (with reframes), so the user understands the
 * habit they're about to integrate into their life. (React Native port)
 */

import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { X, FlaskConical, Zap, TrendingUp, Lightbulb, ShieldAlert, Plus } from 'lucide-react-native';
import * as LucideIcons from 'lucide-react-native';
import { useLocale } from '@/hooks/useLocale';
import type { HabitCatalogEntry } from '@/constants/habitCatalog';
import { img } from '@/assets/registry';
import { SheetShell } from './SheetShell';
import { cn } from '@/utils/cn';

const TEAL_300 = '#5EEAD4';
const GOLD_400 = '#F6AD37';
const SUCCESS_400 = '#66CB8F';
const BLUE_300 = '#66A3FF';
const ORANGE_300 = '#FDBA74';
const WHITE = '#FFFFFF';
const WHITE_80 = 'rgba(255,255,255,0.8)';

interface HabitScienceSheetProps {
  entry: HabitCatalogEntry;
  onClose: () => void;
  /** optional CTA shown at the bottom (e.g. create this habit from library) */
  onCreate?: () => void;
}

function BulletList({ items, tone }: { items: string[]; tone: string }) {
  return (
    <View className="gap-2">
      {items.map((item, i) => (
        <View key={i} className="flex-row items-start gap-2.5">
          <View className={cn('mt-[7px] h-1.5 w-1.5 rounded-full', tone)} />
          <Text className="flex-1 text-sm leading-relaxed text-white/80">{item}</Text>
        </View>
      ))}
    </View>
  );
}

export function HabitScienceSheet({ entry, onClose, onCreate }: HabitScienceSheetProps) {
  const { t } = useLocale();
  // Catalog keys are dynamic (habitCatalog.<slug>.*), outside i18next's typed
  // key union — cast so TS accepts the template-string lookups.
  const tk = t as (key: string, opts?: Record<string, unknown>) => string;
  const tl = t as unknown as (key: string, opts: { returnObjects: true }) => string[];

  const base = `habitCatalog.${entry.slug}`;
  const title = tk(`${base}.title`);
  const tagline = tk(`${base}.tagline`);
  const summary = tk(`${base}.summary`);
  const science = tk(`${base}.science`);
  const shortTerm = tl(`${base}.shortTerm`, { returnObjects: true });
  const longTerm = tl(`${base}.longTerm`, { returnObjects: true });
  const tips = tl(`${base}.tips`, { returnObjects: true });
  const frustrations = tl(`${base}.frustrations`, { returnObjects: true });

  const HeaderIcon =
    ((LucideIcons as Record<string, unknown>)[entry.iconName] as typeof FlaskConical) ||
    FlaskConical;

  // Hero illustration bundled from the web app's public/catalog folder.
  const heroSource = img(`/catalog/${entry.slug}.png`);

  const sectionCard = 'rounded-2xl p-4 bg-white/5 border border-white/10';
  const sectionTitle = 'flex-row items-center gap-2 mb-3';

  return (
    <SheetShell onClose={onClose} accessibilityLabel={title}>
      {/* Close button (floats over the hero illustration) */}
      <Pressable
        onPress={onClose}
        className="absolute right-4 top-4 z-20 h-9 w-9 items-center justify-center rounded-xl bg-black/40 active:bg-black/60"
        accessibilityRole="button"
        accessibilityLabel={t('actions.close')}
      >
        <X size={20} color={WHITE_80} />
      </Pressable>

      <ScrollView>
        {/* Hero illustration */}
        <View className="h-40 items-center justify-center bg-teal-500/10">
          {heroSource ? (
            <Image
              source={heroSource}
              contentFit="contain"
              style={{ width: 144, height: 144 }}
              accessibilityElementsHidden
            />
          ) : (
            <HeaderIcon size={72} color={TEAL_300} />
          )}
        </View>

        <View className="gap-4 px-5 pb-5">
          {/* Title */}
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-2xl bg-teal-500/15">
              <HeaderIcon size={20} color={TEAL_300} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-lg font-bold leading-tight text-white">{title}</Text>
              <Text className="text-xs font-semibold text-teal-300/90">{tagline}</Text>
            </View>
          </View>

          {/* Summary */}
          <Text className="text-sm leading-relaxed text-white/85">{summary}</Text>

          {/* Science */}
          <View className={cn(sectionCard, 'border-teal-400/20 bg-teal-500/10')}>
            <View className={sectionTitle}>
              <FlaskConical size={16} color={TEAL_300} />
              <Text className="text-sm font-bold text-white">{t('habitScience.whatScience')}</Text>
            </View>
            <Text className="text-sm leading-relaxed text-white/75">{science}</Text>
          </View>

          {/* Short term */}
          <View className={sectionCard}>
            <View className={sectionTitle}>
              <Zap size={16} color={GOLD_400} />
              <Text className="text-sm font-bold text-white">
                {t('habitScience.shortTermTitle')}
              </Text>
            </View>
            <BulletList items={shortTerm} tone="bg-gold-400" />
          </View>

          {/* Long term */}
          <View className={sectionCard}>
            <View className={sectionTitle}>
              <TrendingUp size={16} color={SUCCESS_400} />
              <Text className="text-sm font-bold text-white">
                {t('habitScience.longTermTitle')}
              </Text>
            </View>
            <BulletList items={longTerm} tone="bg-success-400" />
          </View>

          {/* Tips */}
          <View className={sectionCard}>
            <View className={sectionTitle}>
              <Lightbulb size={16} color={BLUE_300} />
              <Text className="text-sm font-bold text-white">{t('habitScience.tipsTitle')}</Text>
            </View>
            <BulletList items={tips} tone="bg-blue-300" />
          </View>

          {/* Frustrations */}
          <View className={cn(sectionCard, 'border-orange-400/20 bg-orange-500/10')}>
            <View className={sectionTitle}>
              <ShieldAlert size={16} color={ORANGE_300} />
              <Text className="text-sm font-bold text-white">
                {t('habitScience.frustrationsTitle')}
              </Text>
            </View>
            <BulletList items={frustrations} tone="bg-orange-300" />
          </View>

          {/* CTA */}
          {onCreate && (
            <Pressable
              onPress={onCreate}
              className="w-full flex-row items-center justify-center gap-2 rounded-2xl bg-teal-500 px-6 py-3.5 active:bg-teal-600"
              accessibilityRole="button"
            >
              <Plus size={18} color={WHITE} />
              <Text className="font-bold text-white">{t('habitScience.createCta')}</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SheetShell>
  );
}

export default HabitScienceSheet;
