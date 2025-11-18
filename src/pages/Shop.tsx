import React, { useState, useMemo } from 'react';
import { Settings, Coins, Sparkles, AlertTriangle, ShoppingBag, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { ShopItem, ShopItemManager } from '@/features/shop/components';
import { useUser, useShop } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import type { ShopItem as ShopItemType } from '@/types';
import { ShopItemsService } from '@/services/supabase/shopItems.service';

export function Shop() {
  const { user, initializeUser } = useUser();
  const { shopItems, purchaseItem, isLoading } = useShop();
  const { t } = useLocale();

  const [isManaging, setIsManaging] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

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
    return ShopItemsService.isTranslationKey(item.description) ? t(item.description) : item.description;
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
  }, [shopItems, t]);

  const handlePurchase = async (id: string) => {
    const item = shopItems.find((i) => i.id === id);
    if (!item) return;

    const displayName = getDisplayName(item);

    // Check if user has enough points
    if (!user || user.points < item.cost) {
      const needed = item.cost - (user?.points || 0);
      toast.error(t('shop.toast.purchaseError', { needed }));
      return;
    }

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[rgb(155,215,50)] animate-spin mx-auto mb-4" />
          <p className="text-white font-semibold">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-2 pt-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-10 h-10 text-[rgb(155,215,50)]" />
              <h1 className="text-4xl font-extrabold text-white tracking-tight">
                {t('shop.title')}
              </h1>
            </div>
            <button
              onClick={() => setIsManaging(!isManaging)}
              className={`p-3 rounded-xl transition-all duration-200 ${
                isManaging
                  ? 'bg-gold-100 text-gold-600 shadow-glow-gold'
                  : 'hover:bg-white/10 text-white/70'
              }`}
              title={t('shopManager.manageItems')}
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>
          <p className="text-base text-white font-medium">
            {isManaging ? t('shopManager.subtitle') : t('shop.subtitle')}
          </p>
        </header>

        {isManaging ? (
          /* Management View */
          <ShopItemManager />
        ) : (
          /* Shop View */
          <>
            {/* Points Balance */}
            <section
              aria-labelledby="balance-heading"
              className={`glass-card rounded-3xl p-7 mb-8 text-center bg-gradient-to-br from-gold-100/60 to-gold-200/40 border-2 border-gold-300/40 shadow-glow-gold relative overflow-hidden ${
                isPurchasing ? 'purchase-success' : ''
              }`}
            >
              {/* Animated background glow */}
              <div className="absolute inset-0 shimmer opacity-30 pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Coins className="w-6 h-6 text-[rgb(155,215,50)] coin-spin" />
                  <h2 className="text-base text-[rgb(155,215,50)] font-bold" id="balance-heading">
                    {t('common.points')}
                  </h2>
                </div>
                <div
                  className={`text-6xl font-extrabold text-white mb-3 ${
                    isPurchasing ? 'points-pop' : ''
                  }`}
                  aria-live="polite"
                >
                  {user?.points?.toLocaleString() || 0}
                </div>
                <p className="text-sm text-[rgb(155,215,50)] font-semibold flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  {t('shop.spendWisely')}
                </p>
              </div>
            </section>

            {/* Shop Items */}
            <section aria-labelledby="items-heading" className="mb-8">
              <h2 className="sr-only" id="items-heading">
                Available Rewards
              </h2>
              {displayItems.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center border-2 border-gold-200/30">
                  <ShoppingBag className="w-16 h-16 text-white/50 mx-auto mb-4" />
                  <p className="text-white text-lg mb-2">{t('shopManager.noItems')}</p>
                  <p className="text-white/80 text-sm mb-6">Add your first reward to get started</p>
                  <button
                    onClick={() => setIsManaging(true)}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-semibold shadow-glow-gold transition-all duration-200 hover:scale-105"
                  >
                    {t('shopManager.addFirstItem')}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {displayItems.map((item) => (
                    <ShopItem key={item.id} {...item} onPurchase={handlePurchase} />
                  ))}
                </div>
              )}
            </section>

            {/* Warning */}
            <aside
              className="glass-card rounded-3xl p-6 bg-gradient-to-br from-warning/10 to-danger/10 border-2 border-warning/30 relative overflow-hidden group hover:border-warning/50 transition-all duration-200"
              role="note"
              aria-label="Important reminder"
            >
              {/* Warning icon with animation */}
              <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-30 transition-opacity">
                <AlertTriangle className="w-12 h-12 text-warning" />
              </div>

              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  <p className="text-white font-bold text-lg">{t('shop.rememberGoals')}</p>
                </div>
                <p className="text-base text-white leading-relaxed">
                  {t('shop.indulgenceWarning')}
                </p>
              </div>
            </aside>
          </>
        )}
      </div>
    </div>
  );
}
