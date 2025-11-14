import React from 'react';
import { Candy, ShoppingCart, Moon, Coffee } from 'lucide-react';
import { ShopItem } from '../components/ShopItem';
export function Shop() {
  const items = [{
    id: '1',
    name: 'Sweet Treat',
    icon: <Candy size={32} />,
    cost: 50,
    description: 'Enjoy a small dessert'
  }, {
    id: '2',
    name: 'Impulse Buy',
    icon: <ShoppingCart size={32} />,
    cost: 100,
    description: 'Small purchase under $20'
  }, {
    id: '3',
    name: 'Stay Up Late',
    icon: <Moon size={32} />,
    cost: 75,
    description: 'Sleep after midnight'
  }, {
    id: '4',
    name: 'Extra Coffee',
    icon: <Coffee size={32} />,
    cost: 30,
    description: 'Third cup of the day'
  }];
  const handlePurchase = (id: string) => {
    alert('Purchase confirmed! Enjoy responsibly 😊');
  };
  return <div className="min-h-screen pb-24 px-4 pt-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Indulgence Shop
          </h1>
          <p className="text-gray-600">Treat yourself (occasionally)</p>
        </div>

        {/* Points Balance */}
        <div className="glass-card rounded-3xl p-6 mb-6 text-center bg-gradient-to-br from-quest-gold/10 to-orange-100/50">
          <div className="text-sm text-gray-600 mb-1">Available Points</div>
          <div className="text-4xl font-bold text-gray-800">2,450</div>
          <p className="text-sm text-gray-600 mt-2">Spend wisely, hero ⚖️</p>
        </div>

        {/* Shop Items */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {items.map(item => <ShopItem key={item.id} {...item} onPurchase={handlePurchase} />)}
        </div>

        {/* Warning */}
        <div className="glass-card rounded-3xl p-6 text-center bg-gradient-to-br from-orange-50/80 to-red-50/80">
          <p className="text-gray-800 font-semibold mb-2">
            ⚠️ Remember Your Goals
          </p>
          <p className="text-sm text-gray-600">
            These indulgences are rewards, not habits. Use them mindfully to
            maintain your progress.
          </p>
        </div>
      </div>
    </div>;
}