import React, { useMemo } from 'react';
import { Candy, ShoppingCart, Moon, Coffee } from 'lucide-react';
import { ShopItem } from '@/features/shop/components';
import { useAppStore } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import type { ShopItem as ShopItemType } from '@/types';

export function Shop() {
  const user = useAppStore((state) => state.user);
  const updatePoints = useAppStore((state) => state.updatePoints);
  const purchaseItem = useAppStore((state) => state.purchaseItem);
  const { t } = useLocale();

  const items = useMemo<ShopItemType[]>(() => [{
    id: '1',
    name: t('shop.items.sweetTreat.name'),
    iconName: 'Candy',
    cost: 50,
    description: t('shop.items.sweetTreat.description')
  }, {
    id: '2',
    name: t('shop.items.impulseBuy.name'),
    iconName: 'ShoppingCart',
    cost: 100,
    description: t('shop.items.impulseBuy.description')
  }, {
    id: '3',
    name: t('shop.items.stayUpLate.name'),
    iconName: 'Moon',
    cost: 75,
    description: t('shop.items.stayUpLate.description')
  }, {
    id: '4',
    name: t('shop.items.extraCoffee.name'),
    iconName: 'Coffee',
    cost: 30,
    description: t('shop.items.extraCoffee.description')
  }], [t]);

  const handlePurchase = (id: string) => {
    const item = items.find(i => i.id === id);
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
  return <div className="min-h-screen pb-24 px-4 pt-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
            {t('shop.title')}
          </h1>
          <p className="text-base text-gray-700 font-semibold">{t('shop.subtitle')}</p>
        </header>

        {/* Points Balance */}
        <section aria-labelledby="balance-heading" className="glass-card rounded-3xl p-6 mb-8 text-center bg-gradient-to-br from-gold-50/80 to-gold-100/60">
          <h2 className="text-base text-gray-700 font-semibold mb-2" id="balance-heading">{t('common.points')}</h2>
          <div className="text-5xl font-bold text-gray-900" aria-live="polite">
            {user?.points?.toLocaleString() || 0}
          </div>
          <p className="text-base text-gray-700 font-semibold mt-3">{t('shop.spendWisely')}</p>
        </section>

        {/* Shop Items */}
        <section aria-labelledby="items-heading" className="mb-8">
          <h2 className="sr-only" id="items-heading">Available Rewards</h2>
          <div className="grid grid-cols-2 gap-4">
            {items.map(item => <ShopItem key={item.id} {...item} onPurchase={handlePurchase} />)}
          </div>
        </section>

        {/* Warning */}
        <aside className="glass-card rounded-3xl p-6 text-center bg-gradient-to-br from-warning-50/80 to-danger-50/60" role="note" aria-label="Important reminder">
          <p className="text-gray-900 font-bold text-lg mb-3">
            {t('shop.rememberGoals')}
          </p>
          <p className="text-base text-gray-800 font-medium leading-relaxed">
            {t('shop.indulgenceWarning')}
          </p>
        </aside>
      </div>
    </div>;
}