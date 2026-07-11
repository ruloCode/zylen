/**
 * DurationPicker — preset chips + a custom stepper (10-120 min, step 5).
 */

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useLocale } from '@/hooks/useLocale';
import { FOCUS_CONFIG } from '@/constants/config';

interface DurationPickerProps {
  minutes: number;
  onChange: (minutes: number) => void;
}

export function DurationPicker({ minutes, onChange }: DurationPickerProps) {
  const { t } = useLocale();

  const step = (delta: number) => {
    const next = Math.min(
      FOCUS_CONFIG.maxMinutes,
      Math.max(FOCUS_CONFIG.minMinutes, minutes + delta)
    );
    onChange(next);
  };

  return (
    <div>
      <div className="grid grid-cols-4 gap-2.5">
        {FOCUS_CONFIG.presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={cn(
              'py-3 rounded-xl text-sm font-bold border transition-all',
              minutes === p
                ? 'bg-teal-500 border-teal-400 text-white shadow-glow-teal'
                : 'bg-white/5 border-white/10 text-teal-300 hover:border-white/25'
            )}
          >
            {p}m
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-center gap-5 rounded-2xl bg-white/[0.04] border border-white/10 py-3">
        <button
          type="button"
          onClick={() => step(-5)}
          aria-label="-5"
          className="w-10 h-10 rounded-full bg-white/10 text-white grid place-items-center hover:bg-white/15 disabled:opacity-30"
          disabled={minutes <= FOCUS_CONFIG.minMinutes}
        >
          <Minus size={18} />
        </button>
        <div className="text-center min-w-[90px]">
          <span className="text-3xl font-extrabold text-white tabular-nums">
            {minutes}
          </span>
          <span className="text-white/60 text-sm font-semibold ml-1">
            {t('home.minutes')}
          </span>
        </div>
        <button
          type="button"
          onClick={() => step(5)}
          aria-label="+5"
          className="w-10 h-10 rounded-full bg-white/10 text-white grid place-items-center hover:bg-white/15 disabled:opacity-30"
          disabled={minutes >= FOCUS_CONFIG.maxMinutes}
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}
