import React from 'react';
import { Coins, Candy, ShoppingCart, Moon, Coffee, Gift } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/utils';

// Icon mapper for shop items
const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Candy,
  ShoppingCart,
  Moon,
  Coffee,
  Gift,
};

interface ShopItemProps {
  id: string;
  name: string;
  iconName: string;
  cost: number;
  description: string;
  category?: 'food' | 'leisure' | 'shopping' | 'other';
  /** Current Esencia balance — drives the affordable / missing-points state */
  userPoints: number;
  onPurchase: (id: string) => void;
}

export function ShopItem({
  id,
  name,
  iconName,
  cost,
  description,
  userPoints,
  onPurchase,
}: ShopItemProps) {
  const { t } = useLocale();
  const IconComponent = iconMap[iconName] || Gift;
  const canAfford = userPoints >= cost;
  const missing = cost - userPoints;

  return (
    <div
      className={cn(
        'glass-card rounded-2xl p-4 relative overflow-hidden group flex flex-col',
        'border border-white/[0.07] transition-all duration-300',
        canAfford ? 'hover:border-gold-400/30 hover:shadow-glow-gold' : 'opacity-90'
      )}
    >
      <div className="relative flex flex-col items-center text-center gap-2.5 flex-1">
        {/* Icon tile */}
        <div
          className={cn(
            'grid place-items-center w-14 h-14 rounded-2xl transition-transform duration-300 group-hover:scale-105',
            canAfford
              ? 'bg-gradient-to-br from-gold-400/25 to-gold-600/15 border border-gold-400/25'
              : 'bg-white/[0.06] border border-white/10'
          )}
        >
          <IconComponent size={26} className={canAfford ? 'text-gold-300' : 'text-white/50'} />
        </div>

        {/* Item Name */}
        <h3 className="font-bold text-[15px] leading-snug text-white">
          {name}
        </h3>

        {/* Description */}
        <p className="text-xs text-white/55 leading-relaxed flex-1">
          {description}
        </p>

        {/* Cost chip */}
        <div
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold',
            canAfford
              ? 'bg-gold-500/15 text-gold-300 border border-gold-500/25'
              : 'bg-white/[0.06] text-white/45 border border-white/10'
          )}
        >
          <Coins size={14} aria-hidden="true" />
          <span>{cost.toLocaleString()}</span>
        </div>

        {/* Purchase Button */}
        <button
          type="button"
          onClick={() => onPurchase(id)}
          disabled={!canAfford}
          aria-label={
            canAfford
              ? t('shop.buyAria', { name, cost })
              : t('shop.notEnough', { count: missing })
          }
          className={cn(
            'w-full min-h-[40px] rounded-xl text-sm font-bold transition-all duration-200',
            canAfford
              ? 'pressable bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-glow-teal hover:brightness-110'
              : 'bg-white/[0.05] text-white/40 border border-white/10 cursor-not-allowed'
          )}
        >
          {canAfford ? t('shop.buyNow') : t('shop.notEnough', { count: missing })}
        </button>
      </div>
    </div>
  );
}
