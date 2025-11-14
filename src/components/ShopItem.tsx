import React from 'react';
import { Coins } from 'lucide-react';
import { Button } from './Button';
interface ShopItemProps {
  id: string;
  name: string;
  icon: React.ReactNode;
  cost: number;
  description: string;
  onPurchase: (id: string) => void;
}
export function ShopItem({
  id,
  name,
  icon,
  cost,
  description,
  onPurchase
}: ShopItemProps) {
  return <div className="glass-card rounded-2xl p-5 hover:scale-105 transition-transform duration-200">
      <div className="flex flex-col items-center text-center gap-3">
        <div className="text-quest-purple bg-white/50 p-4 rounded-2xl">
          {icon}
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