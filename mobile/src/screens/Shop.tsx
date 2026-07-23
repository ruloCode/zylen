/**
 * Shop — React Native port of ../src/pages/Shop.tsx.
 * Points balance, purchasable rewards grid, indulgence warning, and the
 * management view (ShopItemManager) behind the settings toggle.
 * Stack screen: mounts <Header /> on top.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Settings,
  Coins,
  Sparkles,
  AlertTriangle,
  ShoppingBag,
} from 'lucide-react-native';
import toast from '@/lib/toast';
import { Header } from '@/components/layout';
import { GlassCard } from '@/components/ui';
import { ShopItem, ShopItemManager } from '@/features/shop/components';
import { useUser, useShop } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import type { ShopItem as ShopItemType } from '@/types';
import { ShopItemsService } from '@/services/supabase/shopItems.service';

// v2: the shop reads in gold (the legacy lime is banned by the design system)
const ACCENT_GREEN = '#FBC956'; // gold-300, matches the web Shop

export function Shop() {
  const { user, initializeUser } = useUser();
  const { shopItems, purchaseItem, isLoading } = useShop();
  const { t } = useLocale();

  const [isManaging, setIsManaging] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // "points pop" feedback on purchase (web: CSS points-pop keyframes)
  const pointsScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!isPurchasing) return;
    Animated.sequence([
      Animated.timing(pointsScale, { toValue: 1.15, duration: 150, useNativeDriver: true }),
      Animated.spring(pointsScale, { toValue: 1, useNativeDriver: true }),
    ]).start();
  }, [isPurchasing, pointsScale]);

  /**
   * Get display name for item (translate if it's a translation key)
   */
  const getDisplayName = (item: ShopItemType): string => {
    return ShopItemsService.isTranslationKey(item.name) ? t(item.name) : item.name;
  };

  /**
   * Get display description for item (translate if it's a translation key)
   */
  const getDisplayDescription = (item: ShopItemType): string => {
    return ShopItemsService.isTranslationKey(item.description)
      ? t(item.description)
      : item.description;
  };

  /**
   * Get items for display with translated names
   */
  const displayItems = useMemo(() => {
    return shopItems
      .filter((item) => item.available !== false)
      .map((item) => ({
        ...item,
        name: getDisplayName(item),
        description: getDisplayDescription(item),
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopItems, t]);

  const handlePurchase = async (id: string): Promise<void> => {
    if (isPurchasing) return;
    const item = shopItems.find((i) => i.id === id);
    if (!item) return;

    const displayName = getDisplayName(item);

    // Check if user has enough points
    if (!user || user.points < item.cost) {
      const needed = item.cost - (user?.points || 0);
      toast.error(t('shop.toast.purchaseError', { needed }));
      return;
    }

    // Spending essence is irreversible — confirm before purchasing.
    Alert.alert(t('shop.confirmPurchase'), t('shop.buyAria', { name: displayName, cost: item.cost }), [
      { text: t('actions.cancel'), style: 'cancel' },
      { text: t('shop.buyNow'), onPress: () => void doPurchase(id, displayName) },
    ]);
  };

  const doPurchase = async (id: string, displayName: string): Promise<void> => {
    const item = shopItems.find((i) => i.id === id);
    if (!item) return;

    try {
      // Trigger purchase animation
      setIsPurchasing(true);

      // Purchase item (handles points deduction and purchase record)
      const success = await purchaseItem(id);

      if (success) {
        // Refresh user data to get updated points
        await initializeUser();

        // Show success toast
        toast.success(t('shop.toast.purchaseSuccess', { name: displayName, cost: item.cost }));
      } else {
        toast.error(t('errors.general'));
      }
    } catch (error) {
      console.error('Error purchasing item:', error);
      toast.error(t('errors.general'));
    } finally {
      setTimeout(() => setIsPurchasing(false), 500);
    }
  };

  // Loading state
  if (isLoading && shopItems.length === 0) {
    return (
      <View className="flex-1 bg-background">
        <Header />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={ACCENT_GREEN} />
          <Text className="mt-4 font-semibold text-white">{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Header />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
      >
        {/* Header */}
        <View className="mb-8">
          <View className="mb-3 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <ShoppingBag size={40} color={ACCENT_GREEN} />
              <Text className="text-[28px] font-extrabold leading-tight tracking-tight text-white">
                {t('shop.title')}
              </Text>
            </View>
            <Pressable
              onPress={() => setIsManaging(!isManaging)}
              accessibilityRole="button"
              accessibilityLabel={t('shopManager.manageItems')}
              className={`rounded-xl p-3 ${
                isManaging ? 'bg-gold-500/20' : 'active:bg-white/10'
              }`}
            >
              <Settings
                size={24}
                color={isManaging ? '#F9A410' : 'rgba(255,255,255,0.7)'}
              />
            </Pressable>
          </View>
          <Text className="text-base font-medium text-white">
            {isManaging ? t('shopManager.subtitle') : t('shop.subtitle')}
          </Text>
        </View>

        {isManaging ? (
          /* Management View */
          <ShopItemManager />
        ) : (
          /* Shop View */
          <>
            {/* Points Balance */}
            <GlassCard className="relative mb-8 overflow-hidden rounded-3xl border-2 border-gold-300/40 p-7">
              {/* Gold gradient wash (web: from-gold-100/60 to-gold-200/40) */}
              <LinearGradient
                colors={['rgba(250,182,46,0.28)', 'rgba(249,164,16,0.14)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              />

              <View className="items-center">
                <View className="mb-2 flex-row items-center justify-center gap-2">
                  <Coins size={24} color={ACCENT_GREEN} />
                  <Text className="text-base font-bold" style={{ color: ACCENT_GREEN }}>
                    {t('common.points')}
                  </Text>
                </View>
                <Animated.View style={{ transform: [{ scale: pointsScale }] }}>
                  <Text
                    className="mb-3 text-6xl font-extrabold text-white"
                    accessibilityLiveRegion="polite"
                  >
                    {user?.points?.toLocaleString() || 0}
                  </Text>
                </Animated.View>
                <View className="flex-row items-center justify-center gap-2">
                  <Sparkles size={16} color={ACCENT_GREEN} />
                  <Text className="text-sm font-semibold" style={{ color: ACCENT_GREEN }}>
                    {t('shop.spendWisely')}
                  </Text>
                </View>
              </View>
            </GlassCard>

            {/* Shop Items */}
            <View className="mb-8" accessibilityLabel={t('shop.availableRewards')}>
              {displayItems.length === 0 ? (
                <GlassCard className="items-center border-2 border-gold-200/30 p-12">
                  <ShoppingBag size={64} color="rgba(255,255,255,0.5)" />
                  <Text className="mb-2 mt-4 text-lg text-white">{t('shopManager.noItems')}</Text>
                  <Text className="mb-6 text-center text-sm text-white/80">
                    {t('shopManager.emptyStateHint')}
                  </Text>
                  <Pressable
                    onPress={() => setIsManaging(true)}
                    accessibilityRole="button"
                    className="overflow-hidden rounded-xl active:opacity-80"
                  >
                    <LinearGradient
                      colors={['#F9A410', '#EF8109']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ paddingHorizontal: 24, paddingVertical: 12 }}
                    >
                      <Text className="font-semibold text-white">
                        {t('shopManager.addFirstItem')}
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </GlassCard>
              ) : (
                /* web: grid grid-cols-2 gap-4 */
                <View className="flex-row flex-wrap justify-between">
                  {displayItems.map((item) => (
                    <View key={item.id} className="mb-4 w-[48.5%]">
                      <ShopItem
                        {...item}
                        userPoints={user?.points ?? 0}
                        onPurchase={handlePurchase}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Warning */}
            <GlassCard
              className="relative overflow-hidden rounded-3xl border-2 border-warning-500/30 p-6"
              accessibilityLabel={t('shop.reminderAria')}
            >
              {/* warning->danger wash (web: from-warning/10 to-danger/10) */}
              <LinearGradient
                colors={['rgba(240,180,41,0.10)', 'rgba(217,83,79,0.10)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              />

              {/* Big decorative warning icon */}
              <View className="absolute right-4 top-4 opacity-20" pointerEvents="none">
                <AlertTriangle size={48} color="#F0B429" />
              </View>

              <View>
                <View className="mb-3 flex-row items-center gap-2">
                  <AlertTriangle size={20} color="#F0B429" />
                  <Text className="text-lg font-bold text-white">
                    {t('shop.rememberGoals')}
                  </Text>
                </View>
                <Text className="text-base leading-relaxed text-white">
                  {t('shop.indulgenceWarning')}
                </Text>
              </View>
            </GlassCard>
          </>
        )}
      </ScrollView>
    </View>
  );
}
