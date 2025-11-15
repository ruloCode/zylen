import React from 'react';
import { Check } from 'lucide-react';
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
    <div className="grid grid-cols-6 gap-2">
      {COLORS.map((color) => (
        <button
          key={color.value}
          type="button"
          onClick={() => onSelectColor(color.value)}
          className={cn(
            'relative w-10 h-10 rounded-lg transition-all',
            'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2',
            selectedColor === color.value && 'ring-2 ring-gray-900 ring-offset-2 scale-110'
          )}
          style={{ backgroundColor: color.value }}
          aria-label={`Select ${color.name} color`}
          title={color.name}
        >
          {selectedColor === color.value && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Check className="w-6 h-6 text-white drop-shadow-lg" strokeWidth={3} />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
