import { LifeAreaType } from './habit';

export interface LifeArea {
  area: LifeAreaType;
  level: number;
  currentXP: number;
  maxXP: number;
}

export interface LifeAreaProgress {
  area: LifeAreaType;
  totalXP: number;
  level: number;
  progress: number; // Percentage 0-100
}
