import React, { useMemo } from 'react';
import { Candy, ShoppingCart, Moon, Coffee } from 'lucide-react';
import { ShopItem } from '@/features/shop/components';
import { useAppStore } from '@/store';
import type { ShopItem as ShopItemType } from '@/types';

export function Shop() {
  const user = useAppStore((state) => state.user);
  const updatePoints = useAppStore((state) => state.updatePoints);
  const purchaseItem = useAppStore((state) => state.purchaseItem);

  const items = useMemo<ShopItemType[]>(() => [{
    id: '1',
    name: 'Sweet Treat',
    iconName: 'Candy',
    cost: 50,
    description: 'Enjoy a small dessert'
  }, {
    id: '2',
    name: 'Impulse Buy',
    iconName: 'ShoppingCart',
    cost: 100,
    description: 'Small purchase under $20'
  }, {
    id: '3',
    name: 'Stay Up Late',
    iconName: 'Moon',
    cost: 75,
    description: 'Sleep after midnight'
  }, {
    id: '4',
    name: 'Extra Coffee',
    iconName: 'Coffee',
    cost: 30,
    description: 'Third cup of the day'
  }], []);

  const handlePurchase = (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    // Check if user has enough points
    if (!user || user.points < item.cost) {
      alert('Not enough points! Complete more habits to earn points.');
      return;
    }

    // Deduct points and record purchase
    updatePoints(-item.cost);
    purchaseItem(item);
    alert('Purchase confirmed! Enjoy responsibly 😊');
  };
  return <div className="min-h-screen pb-24 px-4 pt-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
            Indulgence Shop
          </h1>
          <p className="text-base text-gray-700 font-semibold">Treat yourself (occasionally)</p>
        </header>

        {/* Points Balance */}
        <section aria-labelledby="balance-heading" className="glass-card rounded-3xl p-6 mb-8 text-center bg-gradient-to-br from-gold-50/80 to-gold-100/60">
          <h2 className="text-base text-gray-700 font-semibold mb-2" id="balance-heading">Available Points</h2>
          <div className="text-5xl font-bold text-gray-900" aria-live="polite">
            {user?.points?.toLocaleString() || 0}
          </div>
          <p className="text-base text-gray-700 font-semibold mt-3">Spend wisely, hero ⚖️</p>
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
            ⚠️ Remember Your Goals
          </p>
          <p className="text-base text-gray-800 font-medium leading-relaxed">
            These indulgences are rewards, not habits. Use them mindfully to
            maintain your progress.
          </p>
        </aside>
      </div>
    </div>;
}