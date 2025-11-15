import { LifeAreaType } from './habit';

export interface LifeArea {
  area: LifeAreaType;
  level: number; // Current level for this life area
  totalXP: number; // Total XP accumulated in this area
}

export interface LifeAreaProgress {
  area: LifeAreaType;
  totalXP: number;
  level: number;
  progress: number; // Percentage 0-100
}
