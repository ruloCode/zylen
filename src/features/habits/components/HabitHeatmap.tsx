/**
 * HabitHeatmap — GitHub-style contribution grid for a habit's history.
 * Columns are weeks (Mon..Sun rows). Intensity scales with completion / value.
 */

import React, { useMemo } from 'react';
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

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function HabitHeatmap({ history, weeks = 26, accent = 'teal' }: HabitHeatmapProps) {
  const colors = ACCENTS[accent] || ACCENTS.teal;

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
          labels.push({ col: colIndex, text: MONTHS_ES[cur.getMonth()] });
          lastMonth = cur.getMonth();
        }
      }
      cols.push(col);
    }
    return { columns: cols, monthLabels: labels };
  }, [history, weeks]);

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        {/* Month labels */}
        <div className="flex gap-[3px] mb-1 ml-0 text-[10px] text-white/40 relative h-3">
          {monthLabels.map((m, i) => (
            <span
              key={i}
              className="absolute"
              style={{ left: `${m.col * 13}px` }}
            >
              {m.text}
            </span>
          ))}
        </div>
        {/* Grid */}
        <div className="flex gap-[3px]">
          {columns.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-[3px]">
              {col.map((cell) => (
                <div
                  key={cell.key}
                  title={`${cell.key}`}
                  className="w-[10px] h-[10px] rounded-[3px]"
                  style={{
                    backgroundColor: cell.inFuture ? 'transparent' : colors[cell.level],
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HabitHeatmap;
