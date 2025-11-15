import React from 'react';
import { Coins, Candy, ShoppingCart, Moon, Coffee, Gift } from 'lucide-react';
import { Button } from '@/components/ui';

// Icon mapper for shop items
const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  Candy,
  ShoppingCart,
  Moon,
  Coffee,
  Gift,
};

interface ShopItemProps {
  id: string;
  name: string;
  iconName: string; // Changed from icon: React.ReactNode
  cost: number;
  description: string;
  onPurchase: (id: string) => void;
}
export function ShopItem({
  id,
  name,
  iconName,
  cost,
  description,
  onPurchase
}: ShopItemProps) {
  const IconComponent = iconMap[iconName] || Gift;

  return <div className="glass-card rounded-2xl p-5 hover:scale-105 transition-transform duration-200">
      <div className="flex flex-col items-center text-center gap-3">
        <div className="text-quest-purple bg-white/50 p-4 rounded-2xl">
          <IconComponent size={32} />
        </div>
        <h3 className="font-semibold text-gray-800">{name}</h3>
        <p className="text-sm text-gray-600">{description}</p>
        <div className="flex items-center gap-2 text-quest-gold font-bold">
          <Coins size={20} />
          <span>{cost}</span>
        </div>
        <Button variant="secondary" size="sm" onClick={() => onPurchase(id)} className="w-full">
          Purchase
        </Button>
      </div>
    </div>;
}