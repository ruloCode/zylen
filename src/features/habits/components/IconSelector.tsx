import React from 'react';
import {
  Dumbbell, Book, Apple, Bed, Droplets, Brain,
  Heart, DollarSign, Coffee, Moon, Target, Flame,
  Trophy, Star, Users, Home, Briefcase, Palette,
  Sunrise, MessageCircle, Gift, ShoppingCart, Candy,
  Sparkles, CheckCircle2, Award, Zap, TrendingUp,
  Bike, Music, Camera, Pencil, Code, Utensils,
  type LucideIcon
} from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Available icons for habits
 */
export const HABIT_ICONS: Record<string, LucideIcon> = {
  // Health & Fitness
  Dumbbell,
  Bike,
  Heart,
  Apple,
  Droplets,
  Bed,
  Utensils,

  // Mental & Learning
  Brain,
  Book,
  Pencil,
  Code,
  Target,
  Sparkles,

  // Social & Relationships
  Users,
  MessageCircle,
  Home,
  Gift,

  // Career & Finance
  Briefcase,
  DollarSign,
  Trophy,
  Star,
  TrendingUp,

  // Creativity & Hobbies
  Palette,
  Music,
  Camera,
  Coffee,

  // Misc
  Flame,
  Zap,
  Moon,
  Sunrise,
  CheckCircle2,
  Award,
  ShoppingCart,
  Candy,
};

interface IconSelectorProps {
  selectedIcon: string;
  onSelectIcon: (iconName: string) => void;
}

export function IconSelector({ selectedIcon, onSelectIcon }: IconSelectorProps) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {Object.entries(HABIT_ICONS).map(([name, Icon]) => (
        <button
          key={name}
          type="button"
          onClick={() => onSelectIcon(name)}
          className={cn(
            'flex items-center justify-center p-3 rounded-xl transition-all',
            'hover:bg-teal-100 hover:scale-110',
            'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2',
            selectedIcon === name
              ? 'bg-teal-500 text-white scale-110 shadow-lg'
              : 'bg-gray-100 text-gray-700'
          )}
          aria-label={name}
          aria-pressed={selectedIcon === name}
        >
          <Icon className="w-6 h-6" />
        </button>
      ))}
    </div>
  );
}
