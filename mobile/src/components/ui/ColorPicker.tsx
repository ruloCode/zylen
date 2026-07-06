/**
 * ColorPicker — React Native port.
 * Web CSS grid becomes a wrapping flex row; the selected swatch scales up and
 * gets a white border (rings do not exist on native).
 */

import React from 'react';
import { Pressable, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { cn } from '@/utils/cn';

interface ColorPickerProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
}

// Predefined colors from the design system
const COLORS = [
  { value: '#EF4444', name: 'Red' },
  { value: '#F97316', name: 'Orange' },
  { value: '#F59E0B', name: 'Amber' },
  { value: '#EAB308', name: 'Yellow' },
  { value: '#84CC16', name: 'Lime' },
  { value: '#22C55E', name: 'Green' },
  { value: '#10B981', name: 'Emerald' },
  { value: '#14B8A6', name: 'Teal' },
  { value: '#06B6D4', name: 'Cyan' },
  { value: '#0EA5E9', name: 'Sky' },
  { value: '#3B82F6', name: 'Blue' },
  { value: '#6366F1', name: 'Indigo' },
  { value: '#8B5CF6', name: 'Violet' },
  { value: '#A855F7', name: 'Purple' },
  { value: '#D946EF', name: 'Fuchsia' },
  { value: '#EC4899', name: 'Pink' },
  { value: '#F43F5E', name: 'Rose' },
  { value: '#64748B', name: 'Slate' },
];

export function ColorPicker({ selectedColor, onSelectColor }: ColorPickerProps) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {COLORS.map((color) => {
        const isSelected = selectedColor === color.value;
        return (
          <Pressable
            key={color.value}
            onPress={() => onSelectColor(color.value)}
            accessibilityRole="button"
            accessibilityLabel={`Select ${color.name} color`}
            accessibilityState={{ selected: isSelected }}
            className={cn(
              'h-10 w-10 items-center justify-center rounded-lg',
              isSelected && 'border-2 border-white'
            )}
            style={{
              backgroundColor: color.value,
              transform: [{ scale: isSelected ? 1.1 : 1 }],
            }}
          >
            {isSelected && <Check size={24} color="#FFFFFF" strokeWidth={3} />}
          </Pressable>
        );
      })}
    </View>
  );
}
