/**
 * ShopItem — React Native port of the web reward card.
 * Gold-gradient icon tile, name, description, cost and buy CTA.
 * (The web's hover glow/sparkle effects are decorative and omitted.)
 */

import React from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Coins,
  Candy,
  ShoppingCart,
  Moon,
  Coffee,
  Gift,
  type LucideIcon,
} from 'lucide-react-native';
import { Button, GlassCard } from '@/components/ui';
import { useLocale } from '@/hooks/useLocale';

// Icon mapper for shop items (same set as the web)
const iconMap: Record<string, LucideIcon> = {
  Candy,
  ShoppingCart,
  Moon,
  Coffee,
  Gift,
};

const ACCENT_GREEN = 'rgb(155,215,50)';

interface ShopItemProps {
  id: string;
  name: string;
  iconName: string;
  cost: number;
  description: string;
  category?: 'food' | 'leisure' | 'shopping' | 'other';
  /** Current Esencia balance — drives the affordable / missing-points state */
  userPoints: number;
  onPurchase: (id: string) => void;
}

export function ShopItem({
  id,
  name,
  iconName,
  cost,
  description,
  userPoints,
  onPurchase,
}: ShopItemProps) {
  const { t } = useLocale();
  const IconComponent = iconMap[iconName] || Gift;
  const canAfford = userPoints >= cost;
  const missing = cost - userPoints;

  return (
    <GlassCard className={canAfford ? 'border-2 border-gold-200/30 p-5' : 'border-2 border-white/10 p-5 opacity-90'}>
      <View className="items-center gap-3">
        {/* Icon with gradient background (web: .icon-gradient-gold + glow) */}
        <View
          className="overflow-hidden rounded-2xl"
          style={
            canAfford
              ? {
                  shadowColor: '#F9A410',
                  shadowOpacity: 0.45,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 6,
                }
              : undefined
          }
        >
          {canAfford ? (
            <LinearGradient
              colors={['#FAB62E', '#F9A410']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 16 }}
            >
              <IconComponent size={36} color="#FFFFFF" />
            </LinearGradient>
          ) : (
            <View className="border border-white/10 bg-white/10 p-4">
              <IconComponent size={36} color="rgba(255,255,255,0.5)" />
            </View>
          )}
        </View>

        {/* Item Name */}
        <Text className="text-center text-lg font-bold text-white">{name}</Text>

        {/* Description */}
        <Text className="min-h-[40px] text-center text-sm leading-relaxed text-white">
          {description}
        </Text>

        {/* Cost Display */}
        <View className="my-1 flex-row items-center gap-2">
          <Coins size={22} color={canAfford ? ACCENT_GREEN : 'rgba(255,255,255,0.45)'} />
          <Text
            className="text-lg font-bold"
            style={{ color: canAfford ? ACCENT_GREEN : 'rgba(255,255,255,0.45)' }}
          >
            {cost}
          </Text>
        </View>

        {/* Purchase Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPurchase(id)}
          disabled={!canAfford}
          aria-label={
            canAfford
              ? t('shop.buyAria', { name, cost })
              : t('shop.notEnough', { count: missing })
          }
          className={
            canAfford
              ? 'w-full border-0 bg-teal-500'
              : 'w-full border border-white/10 bg-white/5'
          }
        >
          {canAfford ? t('shop.buyNow') : t('shop.notEnough', { count: missing })}
        </Button>
      </View>
    </GlassCard>
  );
}
