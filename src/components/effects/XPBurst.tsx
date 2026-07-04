/**
 * XPBurst — one-shot celebration when a habit is completed.
 * Renders a floating "+XP" chip plus a few golden particles that fly outward,
 * then unmounts itself. Position it inside a `relative` container.
 */

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';

interface XPBurstProps {
  xp: number;
  /** extra text under the XP (e.g. streak bonus) */
  hint?: string;
  onDone?: () => void;
}

const PARTICLES = [
  { x: '-26px', y: '-30px', delay: '0ms', size: 10 },
  { x: '24px', y: '-34px', delay: '60ms', size: 8 },
  { x: '-12px', y: '-44px', delay: '120ms', size: 7 },
  { x: '16px', y: '-20px', delay: '40ms', size: 9 },
  { x: '0px', y: '-40px', delay: '90ms', size: 11 },
];

export function XPBurst({ xp, hint, onDone }: XPBurstProps) {
  const { t } = useLocale();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 1200);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 grid place-items-center motion-reduce:hidden"
      aria-hidden="true"
    >
      <div className="relative">
        {/* Floating +XP chip */}
        <div className="animate-xp-float flex flex-col items-center">
          <span className="px-2.5 py-1 rounded-full bg-gold-500/90 text-charcoal-900 text-sm font-extrabold shadow-lg whitespace-nowrap">
            +{xp} {t('common.xp')}
          </span>
          {hint && (
            <span className="mt-0.5 text-[10px] font-bold text-gold-300 drop-shadow whitespace-nowrap">
              {hint}
            </span>
          )}
        </div>

        {/* Golden particles */}
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 animate-burst-particle text-gold-300"
            style={
              {
                '--burst-x': p.x,
                '--burst-y': p.y,
                animationDelay: p.delay,
              } as React.CSSProperties
            }
          >
            <Sparkles size={p.size} />
          </span>
        ))}
      </div>
    </div>
  );
}

export default XPBurst;
