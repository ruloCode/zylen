/**
 * Mood — Daylio-inspired daily mood journal.
 * Today selector + month calendar + stats + distribution. localStorage-backed.
 */

import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Smile, Flame, CalendarDays, Check } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { MoodService, localDateKey } from '@/services/mood.service';
import { MOODS, moodByLevel, type MoodLevel, type MoodEntry } from '@/types/mood';
import { cn } from '@/utils/cn';

const WEEKDAYS_ES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export function Mood() {
  const { t } = useLocale();
  const [entries, setEntries] = useState<MoodEntry[]>(() => MoodService.getAll());
  const todayKey = localDateKey();
  const todayEntry = entries.find((e) => e.date === todayKey);

  const [selected, setSelected] = useState<MoodLevel | null>(
    todayEntry ? todayEntry.mood : null
  );
  const [note, setNote] = useState(todayEntry?.note || '');
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const entryMap = useMemo(() => new Map(entries.map((e) => [e.date, e])), [entries]);
  const streak = useMemo(() => MoodService.getStreak(), [entries]);
  const average = useMemo(() => MoodService.getAverage(entries), [entries]);

  const handleSave = () => {
    if (selected === null) return;
    const updated = MoodService.upsert(todayKey, selected, note.trim() || undefined);
    setEntries(updated);
    toast.success(t('mood.saved'));
  };

  // distribution (all-time)
  const distribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    entries.forEach((e) => (counts[e.mood] += 1));
    const max = Math.max(...counts, 1);
    return MOODS.map((m) => ({ ...m, count: counts[m.level], pct: (counts[m.level] / max) * 100 }));
  }, [entries]);

  // calendar grid for current month
  const calendar = useMemo(() => {
    const year = month.getFullYear();
    const m = month.getMonth();
    const first = new Date(year, m, 1);
    const startOffset = (first.getDay() + 6) % 7; // Mon=0
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const cells: ({ day: number; key: string; entry?: MoodEntry } | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, key, entry: entryMap.get(key) });
    }
    return cells;
  }, [month, entryMap]);

  const monthLabel = month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const avgMood = average !== null ? moodByLevel(Math.round(average) as MoodLevel) : null;

  return (
    <div className="min-h-screen pb-24 px-3 pt-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <header className="mb-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <Smile className="w-7 h-7 text-gold-400" /> {t('mood.title')}
              </h1>
              <p className="text-sm text-white/60 mt-1">{t('mood.subtitle')}</p>
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-orange-500/15 border border-orange-400/25">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-white font-bold">{streak}</span>
              </div>
            )}
          </div>
        </header>

        {/* Today's mood selector */}
        <section className="glass-card p-5 mb-5">
          <h2 className="text-base font-bold text-white mb-4 text-center">{t('mood.howAreYou')}</h2>
          <div className="flex justify-between gap-1.5 mb-4">
            {MOODS.map((m) => {
              const active = selected === m.level;
              return (
                <button
                  key={m.level}
                  onClick={() => setSelected(m.level)}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-all duration-200',
                    active ? 'scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                  )}
                  style={active ? { borderColor: m.color, backgroundColor: `${m.color}1f` } : undefined}
                  aria-pressed={active}
                  aria-label={t(`mood.${m.labelKey}`)}
                >
                  <span className="text-3xl">{m.emoji}</span>
                  <span className="text-[10px] font-semibold text-white/80">{t(`mood.${m.labelKey}`)}</span>
                </button>
              );
            })}
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('mood.notePlaceholder')}
            rows={2}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent placeholder:text-white/40"
          />

          <button
            onClick={handleSave}
            disabled={selected === null}
            className="btn-primary w-full mt-3 disabled:opacity-40"
          >
            <Check className="w-5 h-5" />
            {todayEntry ? t('mood.edit') : t('mood.save')}
          </button>
        </section>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="glass-card p-3 text-center">
            <CalendarDays className="w-5 h-5 mx-auto text-teal-400 mb-1" />
            <div className="text-2xl font-bold text-white">{entries.length}</div>
            <div className="text-[11px] text-white/55">{t('mood.entries')}</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="text-2xl mb-0.5 h-7 grid place-items-center">{avgMood ? avgMood.emoji : '—'}</div>
            <div className="text-[11px] text-white/55 mt-1">{t('mood.averageMood')}</div>
          </div>
          <div className="glass-card p-3 text-center">
            <Flame className="w-5 h-5 mx-auto text-orange-400 mb-1" />
            <div className="text-2xl font-bold text-white">{streak}</div>
            <div className="text-[11px] text-white/55">{t('mood.moodStreak')}</div>
          </div>
        </div>

        {/* Calendar */}
        <section className="glass-card p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              className="w-8 h-8 rounded-lg grid place-items-center bg-white/5 text-white/70 hover:bg-white/10"
              aria-label="prev month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-white capitalize">{monthLabel}</span>
            <button
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              className="w-8 h-8 rounded-lg grid place-items-center bg-white/5 text-white/70 hover:bg-white/10"
              aria-label="next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1.5 mb-1.5">
            {WEEKDAYS_ES.map((d, i) => (
              <div key={i} className="text-center text-[10px] font-semibold text-white/40">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {calendar.map((cell, i) =>
              cell === null ? (
                <div key={`e${i}`} />
              ) : (
                <div
                  key={cell.key}
                  title={cell.key}
                  className={cn(
                    'aspect-square rounded-xl grid place-items-center text-xs relative',
                    cell.key === todayKey ? 'ring-2 ring-gold-400/60' : ''
                  )}
                  style={
                    cell.entry
                      ? { backgroundColor: `${moodByLevel(cell.entry.mood).color}33` }
                      : { backgroundColor: 'rgba(255,255,255,0.04)' }
                  }
                >
                  {cell.entry ? (
                    <span className="text-base leading-none">{moodByLevel(cell.entry.mood).emoji}</span>
                  ) : (
                    <span className="text-white/30">{cell.day}</span>
                  )}
                </div>
              )
            )}
          </div>
        </section>

        {/* Distribution */}
        {entries.length > 0 ? (
          <section className="glass-card p-4">
            <h3 className="text-sm font-bold text-white mb-3">{t('mood.distribution')}</h3>
            <div className="space-y-2">
              {distribution.map((m) => (
                <div key={m.level} className="flex items-center gap-2">
                  <span className="text-lg w-6 text-center">{m.emoji}</span>
                  <div className="flex-1 h-3 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${m.pct}%`, backgroundColor: m.color }}
                    />
                  </div>
                  <span className="text-xs text-white/60 w-6 text-right">{m.count}</span>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <p className="text-center text-sm text-white/40 py-6">{t('mood.noEntries')}</p>
        )}
      </div>
    </div>
  );
}

export default Mood;
