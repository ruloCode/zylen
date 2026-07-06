/**
 * VaultCurrencyChips — the vault header's currency row: Luz (XP), Esencia
 * (points) and total gems grown, plus an (i) popover explaining the
 * platform. Values come straight from the store; no backend calls.
 *
 * RN note: the popover is an absolutely positioned View below the row; the
 * parent header should sit above the content stack (zIndex) so it isn't
 * covered.
 */

import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Coins, Gem, Info, Sparkles } from 'lucide-react-native';
import { cn } from '@/utils/cn';
import { useLocale } from '@/hooks/useLocale';
import { useUser } from '@/store';
import type { FocusStats } from '@/types/focus';
import { totalGems } from '../utils/gemAssets';

interface VaultCurrencyChipsProps {
  stats: FocusStats | null;
}

const glass = 'rounded-2xl border border-white/10 bg-[hsl(var(--glass-bg)/0.65)]';

export function VaultCurrencyChips({ stats }: VaultCurrencyChipsProps) {
  const { t } = useLocale();
  const { user } = useUser();
  const [infoOpen, setInfoOpen] = useState(false);

  const gems = stats ? totalGems(stats.speciesCounts) : 0;

  return (
    <View className="relative z-50 flex-row items-center gap-1.5">
      <Pressable
        onPress={() => setInfoOpen((o) => !o)}
        accessibilityLabel={t('focus.vaultInfo')}
        className={cn(glass, 'h-7 w-7 shrink-0 items-center justify-center rounded-full')}
      >
        <Info size={13} color="rgba(255,255,255,0.6)" />
      </Pressable>
      <View
        accessibilityLabel={t('focus.vaultChipLight')}
        className={cn(glass, 'flex-row items-center gap-1 px-2 py-1')}
      >
        <Sparkles size={11} color="#5eead4" />
        <Text className="text-[11px] font-bold text-teal-300">
          {user?.totalXPEarned ?? 0}
        </Text>
      </View>
      <View
        accessibilityLabel={t('focus.vaultChipEssence')}
        className={cn(glass, 'flex-row items-center gap-1 px-2 py-1')}
      >
        <Coins size={11} color="#FAB62E" />
        <Text className="text-[11px] font-bold text-gold-400">
          {user?.points ?? 0}
        </Text>
      </View>
      <View
        accessibilityLabel={t('focus.vaultChipGems')}
        className={cn(glass, 'flex-row items-center gap-1 px-2 py-1')}
      >
        <Gem size={11} color="#d8b4fe" />
        <Text className="text-[11px] font-bold text-purple-300">{gems}</Text>
      </View>

      {infoOpen && (
        <Pressable
          onPress={() => setInfoOpen(false)}
          className={cn(glass, 'absolute right-0 top-9 z-40 w-64 p-3')}
        >
          <Text className="text-xs leading-relaxed text-white/80">
            {t('focus.vaultInfo')}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
