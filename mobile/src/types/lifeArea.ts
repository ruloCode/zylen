import { LifeAreaType } from './habit';

export interface LifeArea {
  id: string; // Unique identifier (UUID for custom areas, or slug for predefined)
  area: LifeAreaType | string; // Predefined type or custom name
  level: number; // Current level for this life area
  totalXP: number; // Total XP accumulated in this area
  isCustom: boolean; // false for predefined areas, true for custom
  enabled: boolean; // Whether the user has activated this area
  iconName?: string; // Icon name for custom areas (Lucide icons)
  color?: string; // Custom color for the area
}

export interface LifeAreaProgress {
  area: LifeAreaType;
  totalXP: number;
  level: number;
  progress: number; // Percentage 0-100
}
