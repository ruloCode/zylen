/**
 * Language Switcher Component — React Native port.
 *
 * Allows users to toggle between Spanish and English.
 * Persists language preference via i18n (device storage on native).
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Languages } from 'lucide-react-native';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/utils';

interface LanguageSwitcherProps {
  /**
   * Display variant
   * - 'compact': Icon button with language badge
   * - 'expanded': Full buttons with labels
   */
  variant?: 'compact' | 'expanded';

  /**
   * Additional CSS classes
   */
  className?: string;
}

export function LanguageSwitcher({ variant = 'compact', className }: LanguageSwitcherProps) {
  const { language, changeLanguage } = useLocale();

  if (variant === 'compact') {
    return (
      <Pressable
        onPress={() => void changeLanguage(language === 'es' ? 'en' : 'es')}
        accessibilityRole="button"
        accessibilityLabel={`Switch to ${language === 'es' ? 'English' : 'Spanish'}`}
        className={cn(
          'flex-row items-center gap-2 rounded-lg px-3 py-2',
          'border border-gray-200 bg-white/80 active:bg-gray-50',
          className
        )}
      >
        <Languages size={18} color="#4B5563" />
        <Text className="text-sm font-semibold uppercase text-gray-700">{language}</Text>
      </Pressable>
    );
  }

  // Expanded variant
  return (
    <View className={cn('flex-row gap-2', className)}>
      <Pressable
        onPress={() => void changeLanguage('es')}
        accessibilityRole="button"
        accessibilityLabel="Switch to Spanish"
        accessibilityState={{ selected: language === 'es' }}
        className={cn(
          'flex-1 items-center rounded-xl px-4 py-2.5',
          language === 'es' ? 'bg-gold-500' : 'border border-gray-200 bg-white/80'
        )}
      >
        <Text
          className={cn('text-sm font-semibold', language === 'es' ? 'text-white' : 'text-gray-600')}
        >
          🇪🇸 Español
        </Text>
      </Pressable>
      <Pressable
        onPress={() => void changeLanguage('en')}
        accessibilityRole="button"
        accessibilityLabel="Switch to English"
        accessibilityState={{ selected: language === 'en' }}
        className={cn(
          'flex-1 items-center rounded-xl px-4 py-2.5',
          language === 'en' ? 'bg-gold-500' : 'border border-gray-200 bg-white/80'
        )}
      >
        <Text
          className={cn('text-sm font-semibold', language === 'en' ? 'text-white' : 'text-gray-600')}
        >
          🇺🇸 English
        </Text>
      </Pressable>
    </View>
  );
}

export default LanguageSwitcher;
