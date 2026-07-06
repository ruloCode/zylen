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
  onPurchase: (id: string) => void;
}

export function ShopItem({
  id,
  name,
  iconName,
  cost,
  description,
  onPurchase,
}: ShopItemProps) {
  const { t } = useLocale();
  const IconComponent = iconMap[iconName] || Gift;

  return (
    <GlassCard className="border-2 border-gold-200/30 p-5">
      <View className="items-center gap-3">
        {/* Icon with gradient background (web: .icon-gradient-gold + glow) */}
        <View
          className="overflow-hidden rounded-2xl"
          style={{
            shadowColor: '#F9A410',
            shadowOpacity: 0.45,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 6,
          }}
        >
          <LinearGradient
            colors={['#FAB62E', '#F9A410']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 16 }}
          >
            <IconComponent size={36} color="#FFFFFF" />
          </LinearGradient>
        </View>

        {/* Item Name */}
        <Text className="text-center text-lg font-bold text-white">{name}</Text>

        {/* Description */}
        <Text className="min-h-[40px] text-center text-sm leading-relaxed text-white">
          {description}
        </Text>

        {/* Cost Display */}
        <View className="my-1 flex-row items-center gap-2">
          <Coins size={22} color={ACCENT_GREEN} />
          <Text className="text-lg font-bold" style={{ color: ACCENT_GREEN }}>
            {cost}
          </Text>
        </View>

        {/* Purchase Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPurchase(id)}
          className="w-full border-0 bg-teal-500"
        >
          {t('shop.buyNow')}
        </Button>
      </View>
    </GlassCard>
  );
}
