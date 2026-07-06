/**
 * HabitHeatmap — GitHub-style contribution grid for a habit's history.
 * Columns are weeks (Mon..Sun rows). Intensity scales with completion / value.
 * React Native port: the CSS grid becomes rows/columns of fixed-size Views
 * inside a horizontal ScrollView.
 */

import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocale } from '@/hooks/useLocale';
import type { HabitDayLog } from '@/types';

interface HabitHeatmapProps {
  history: HabitDayLog[];
  /** how many weeks back to show */
  weeks?: number;
  /** base accent color (hsl hue-based). Defaults to teal */
  accent?: 'teal' | 'gold' | 'cyan';
}

const ACCENTS: Record<string, string[]> = {
  // index 0 = empty, 1..4 increasing intensity
  teal: ['rgba(255,255,255,0.05)', 'hsla(167,78%,42%,0.35)', 'hsla(167,78%,45%,0.6)', 'hsla(167,78%,48%,0.8)', 'hsl(167,80%,52%)'],
  cyan: ['rgba(255,255,255,0.05)', 'hsla(186,70%,50%,0.35)', 'hsla(186,72%,52%,0.6)', 'hsla(186,74%,55%,0.8)', 'hsl(186,76%,58%)'],
  gold: ['rgba(255,255,255,0.05)', 'hsla(40,95%,55%,0.35)', 'hsla(40,95%,55%,0.6)', 'hsla(40,95%,55%,0.8)', 'hsl(40,95%,58%)'],
};

// cell 10px + 3px gap → 13px column pitch (keeps month labels aligned)
const CELL = 10;
const GAP = 3;

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function HabitHeatmap({ history, weeks = 26, accent = 'teal' }: HabitHeatmapProps) {
  const { language } = useLocale();
  const colors = ACCENTS[accent] || ACCENTS.teal;

  const monthNames = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(language === 'en' ? 'en' : 'es', { month: 'short' });
    return Array.from({ length: 12 }, (_, m) => {
      const label = formatter.format(new Date(2024, m, 1)).replace('.', '');
      return label.charAt(0).toUpperCase() + label.slice(1);
    });
  }, [language]);

  const { columns, monthLabels } = useMemo(() => {
    const map = new Map(history.map((h) => [h.date, h]));
    const maxVal = history.reduce((m, h) => Math.max(m, h.value || h.count), 0) || 1;

    // Build grid ending today, aligned so each column is a Mon-Sun week
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // find Monday of current week
    const dayOfWeek = (today.getDay() + 6) % 7; // 0 = Monday
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - dayOfWeek);

    const cols: { date: Date; key: string; level: number; inFuture: boolean }[][] = [];
    const labels: { col: number; text: string }[] = [];
    let lastMonth = -1;

    for (let w = weeks - 1; w >= 0; w--) {
      const colIndex = weeks - 1 - w;
      const col: { date: Date; key: string; level: number; inFuture: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const cur = new Date(lastMonday);
        cur.setDate(lastMonday.getDate() - w * 7 + d);
        const key = dateKey(cur);
        const entry = map.get(key);
        const metric = entry ? entry.value || entry.count : 0;
        let level = 0;
        if (metric > 0) {
          const ratio = metric / maxVal;
          level = ratio >= 0.75 ? 4 : ratio >= 0.5 ? 3 : ratio >= 0.25 ? 2 : 1;
        }
        col.push({ date: cur, key, level, inFuture: cur > today });
        // month label on first row when month changes
        if (d === 0 && cur.getMonth() !== lastMonth) {
          labels.push({ col: colIndex, text: monthNames[cur.getMonth()] });
          lastMonth = cur.getMonth();
        }
      }
      cols.push(col);
    }
    return { columns: cols, monthLabels: labels };
  }, [history, weeks, monthNames]);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        {/* Month labels */}
        <View className="relative mb-1 h-3">
          {monthLabels.map((m, i) => (
            <Text
              key={i}
              className="absolute text-[10px] text-white/40"
              style={{ left: m.col * (CELL + GAP) }}
            >
              {m.text}
            </Text>
          ))}
        </View>
        {/* Grid */}
        <View className="flex-row" style={{ gap: GAP }}>
          {columns.map((col, ci) => (
            <View key={ci} className="flex-col" style={{ gap: GAP }}>
              {col.map((cell) => (
                <View
                  key={cell.key}
                  className="rounded-[3px]"
                  style={{
                    width: CELL,
                    height: CELL,
                    backgroundColor: cell.inFuture ? 'transparent' : colors[cell.level],
                  }}
                />
              ))}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

export default HabitHeatmap;
