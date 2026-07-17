import React, { useState, useMemo } from 'react';
import { Settings, Coins, Sparkles, AlertTriangle, ShoppingBag, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { ShopItem, ShopItemManager } from '@/features/shop/components';
import { useUser, useShop } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import type { ShopItem as ShopItemType } from '@/types';
import { ShopItemsService } from '@/services/supabase/shopItems.service';
import { PageContainer } from '@/components/layout';

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
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-white font-semibold">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 pt-4">
      <PageContainer className="animate-page-in">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-[28px] leading-tight font-extrabold text-white tracking-tight">
                {t('shop.title')}
              </h1>
              <p className="text-sm text-white/60 mt-1">
                {isManaging ? t('shopManager.subtitle') : t('shop.subtitle')}
              </p>
            </div>
            <button
              onClick={() => setIsManaging(!isManaging)}
              className={`p-2.5 mt-1 rounded-xl transition-all duration-200 pressable focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isManaging
                  ? 'bg-gold-500/20 text-gold-300 border border-gold-500/30'
                  : 'hover:bg-white/10 text-white/70 border border-transparent'
              }`}
              title={t('shopManager.manageItems')}
              aria-label={t('shopManager.manageItems')}
              aria-pressed={isManaging}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
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
              className="glass-card rounded-3xl px-6 py-5 mb-6 relative overflow-hidden border border-gold-400/20"
            >
              {/* Ambient gold aura */}
              <div
                aria-hidden="true"
                className="absolute -top-16 -right-10 w-48 h-48 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, hsl(40 95% 58% / 0.22) 0%, transparent 70%)' }}
              />
              <div
                aria-hidden="true"
                className="absolute -bottom-20 -left-12 w-44 h-44 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, hsl(172 66% 50% / 0.12) 0%, transparent 70%)' }}
              />

              <div className="relative z-10 flex items-center justify-between gap-4">
                <div>
                  <h2 className="section-label mb-1.5" id="balance-heading">
                    {t('common.points')}
                  </h2>
                  <div
                    className={`text-5xl font-extrabold text-white tabular-nums tracking-tight transition-transform duration-300 ${
                      isPurchasing ? 'scale-110' : ''
                    }`}
                    aria-live="polite"
                  >
                    {user?.points?.toLocaleString() || 0}
                  </div>
                  <p className="text-xs text-white/50 font-medium mt-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-gold-400" aria-hidden="true" />
                    {t('shop.spendWisely')}
                  </p>
                </div>
                <div
                  aria-hidden="true"
                  className="grid place-items-center w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400/25 to-gold-600/10 border border-gold-400/30 shadow-glow-gold"
                >
                  <Coins className="w-8 h-8 text-gold-300" />
                </div>
              </div>
            </section>

            {/* Shop Items */}
            <section aria-labelledby="items-heading" className="mb-8">
              <h2 className="sr-only" id="items-heading">
                {t('shop.availableRewards')}
              </h2>
              {displayItems.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center border-2 border-gold-200/30">
                  <ShoppingBag className="w-16 h-16 text-white/50 mx-auto mb-4" />
                  <p className="text-white text-lg mb-2">{t('shopManager.noItems')}</p>
                  <p className="text-white/80 text-sm mb-6">{t('shopManager.emptyStateHint')}</p>
                  <button
                    onClick={() => setIsManaging(true)}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-semibold shadow-glow-gold transition-all duration-200 hover:scale-105"
                  >
                    {t('shopManager.addFirstItem')}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {displayItems.map((item) => (
                    <ShopItem
                      key={item.id}
                      {...item}
                      userPoints={user?.points ?? 0}
                      onPurchase={handlePurchase}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Warning */}
            <aside
              className="glass-card rounded-2xl p-5 border border-warning/20 flex items-start gap-3.5"
              role="note"
              aria-label={t('shop.reminderAria')}
            >
              <div className="grid place-items-center w-10 h-10 rounded-xl bg-warning/15 border border-warning/25 shrink-0">
                <AlertTriangle className="w-5 h-5 text-warning" aria-hidden="true" />
              </div>
              <div>
                <p className="text-white font-bold text-sm mb-1">{t('shop.rememberGoals')}</p>
                <p className="text-[13px] text-white/60 leading-relaxed">
                  {t('shop.indulgenceWarning')}
                </p>
              </div>
            </aside>
          </>
        )}
      </PageContainer>
    </div>
  );
}
