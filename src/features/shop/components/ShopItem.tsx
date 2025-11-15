import React from 'react';
import { Coins, Candy, ShoppingCart, Moon, Coffee, Gift, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';

// Icon mapper for shop items
const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Candy,
  ShoppingCart,
  Moon,
  Coffee,
  Gift,
};

// Category color mapping using brand palette
const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
  food: {
    bg: 'bg-gold-100',
    border: 'border-gold-300',
    text: 'text-gold-700',
  },
  leisure: {
    bg: 'bg-teal-100',
    border: 'border-teal-300',
    text: 'text-teal-700',
  },
  shopping: {
    bg: 'bg-parchment-200',
    border: 'border-parchment-300',
    text: 'text-charcoal-500',
  },
  other: {
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    text: 'text-gray-700',
  },
};

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
  category = 'other',
  onPurchase,
}: ShopItemProps) {
  const IconComponent = iconMap[iconName] || Gift;
  const categoryStyle = categoryColors[category] || categoryColors.other;

  return (
    <div className="glass-card rounded-2xl p-5 shop-item-hover border-2 border-gold-200/30 relative overflow-hidden group">
      {/* Subtle background glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-gold-100/30 to-teal-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

      <div className="relative flex flex-col items-center text-center gap-3">
        {/* Category Badge */}
        {category && (
          <div
            className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-semibold category-badge ${categoryStyle.bg} ${categoryStyle.border} ${categoryStyle.text} border`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </div>
        )}

        {/* Icon with gradient background */}
        <div className="relative">
          <div className="icon-gradient-gold p-4 rounded-2xl shadow-glow-gold group-hover:shadow-glow-gold group-hover:scale-110 transition-all duration-300">
            <IconComponent size={36} className="text-white drop-shadow-md" />
          </div>
          {/* Sparkle effect on hover */}
          <Sparkles
            size={16}
            className="absolute -top-1 -right-1 text-gold-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"
          />
        </div>

        {/* Item Name */}
        <h3 className="font-bold text-lg text-charcoal-500 group-hover:text-gradient-gold transition-all duration-200">
          {name}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 leading-relaxed min-h-[2.5rem]">
          {description}
        </p>

        {/* Cost Display */}
        <div className="flex items-center gap-2 text-gold-600 font-bold text-lg my-1">
          <Coins size={22} className="coin-spin" />
          <span className="text-gradient-gold">{cost}</span>
        </div>

        {/* Purchase Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPurchase(id)}
          className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold shadow-glow-teal hover:shadow-glow-teal transition-all duration-200 border-0"
        >
          Purchase
        </Button>
      </div>
    </div>
  );
}
