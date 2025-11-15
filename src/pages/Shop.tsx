import React, { useState, useMemo } from 'react';
import { Settings } from 'lucide-react';
import { ShopItem, ShopItemManager } from '@/features/shop/components';
import { useAppStore, useShop } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import type { ShopItem as ShopItemType } from '@/types';
import { ShopItemsService } from '@/services';

export function Shop() {
  const user = useAppStore((state) => state.user);
  const updatePoints = useAppStore((state) => state.updatePoints);
  const { shopItems, purchaseItem } = useShop();
  const { t } = useLocale();

  const [isManaging, setIsManaging] = useState(false);

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

  const handlePurchase = (id: string) => {
    const item = shopItems.find((i) => i.id === id);
    if (!item) return;

    // Check if user has enough points
    if (!user || user.points < item.cost) {
      alert(t('shop.notEnoughPoints'));
      return;
    }

    // Deduct points and record purchase
    updatePoints(-item.cost);
    purchaseItem(item);
    alert(t('shop.purchaseConfirmed'));
  };
  return (
    <div className="min-h-screen pb-24 px-4 pt-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              {t('shop.title')}
            </h1>
            <button
              onClick={() => setIsManaging(!isManaging)}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              title={t('shopManager.manageItems')}
            >
              <Settings className="w-6 h-6 text-gray-600" />
            </button>
          </div>
          <p className="text-base text-gray-700 font-semibold">
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
              className="glass-card rounded-3xl p-6 mb-8 text-center bg-gradient-to-br from-gold-50/80 to-gold-100/60"
            >
              <h2 className="text-base text-gray-700 font-semibold mb-2" id="balance-heading">
                {t('common.points')}
              </h2>
              <div className="text-5xl font-bold text-gray-900" aria-live="polite">
                {user?.points?.toLocaleString() || 0}
              </div>
              <p className="text-base text-gray-700 font-semibold mt-3">{t('shop.spendWisely')}</p>
            </section>

            {/* Shop Items */}
            <section aria-labelledby="items-heading" className="mb-8">
              <h2 className="sr-only" id="items-heading">
                Available Rewards
              </h2>
              {displayItems.length === 0 ? (
                <div className="glass-card rounded-2xl p-8 text-center">
                  <p className="text-gray-500">{t('shopManager.noItems')}</p>
                  <button
                    onClick={() => setIsManaging(true)}
                    className="mt-4 px-6 py-2 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors"
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
              className="glass-card rounded-3xl p-6 text-center bg-gradient-to-br from-warning-50/80 to-danger-50/60"
              role="note"
              aria-label="Important reminder"
            >
              <p className="text-gray-900 font-bold text-lg mb-3">{t('shop.rememberGoals')}</p>
              <p className="text-base text-gray-800 font-medium leading-relaxed">
                {t('shop.indulgenceWarning')}
              </p>
            </aside>
          </>
        )}
      </div>
    </div>
  );
}