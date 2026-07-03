/**
 * GuardianCard — El Guardián's daily guidance card on the Dashboard.
 * Shows a behaviour-based message (celebrate / warn / neutral) plus the
 * light-vs-darkness indicator for the avatar.
 */

import { CloudFog, Shield, Sparkles } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { darknessTier } from '../darkness';
import type { GuardianMessage, GuardianTone } from '../types';

interface GuardianCardProps {
  message: GuardianMessage;
  darkness: number;
  className?: string;
}

const TONE_STYLES: Record<
  GuardianTone,
  { icon: typeof Shield; badge: string; border: string }
> = {
  celebrate: {
    icon: Sparkles,
    badge: 'bg-gold-500/15 text-gold-400',
    border: '',
  },
  warn: {
    icon: CloudFog,
    badge: 'bg-purple-500/15 text-purple-300',
    border: 'border-purple-500/30',
  },
  neutral: {
    icon: Shield,
    badge: 'bg-teal-500/15 text-teal-300',
    border: '',
  },
};

export function GuardianCard({ message, darkness, className = '' }: GuardianCardProps): JSX.Element {
  const { t } = useLocale();
  const tone = TONE_STYLES[message.tone];
  const Icon = tone.icon;
  const tier = darknessTier(darkness);

  // Each rule's copy is an i18n array of variants; i18next interpolates the
  // params ({{streak}}, {{name}}...) in every member when returnObjects is set.
  const variants = t(`guardian.rules.${message.ruleId}`, {
    returnObjects: true,
    ...message.params,
  }) as unknown as string[];
  const text = Array.isArray(variants) && variants.length > 0
    ? variants[message.variantIndex % variants.length]
    : '';

  return (
    <section
      aria-label={t('guardian.title')}
      className={`glass-card p-4 ${tone.border} ${className}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${tone.badge}`}
        >
          <Icon size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-white/55 text-xs font-semibold uppercase tracking-wide">
            {t('guardian.title')}
          </p>
          <p className="text-white text-sm font-bold leading-snug mt-0.5">
            {text}
          </p>
        </div>
      </div>

      {/* Light vs darkness indicator */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-white/55 text-[11px] font-medium">
            {t('guardian.darkness.label')}
          </span>
          <span
            className={`text-[11px] font-semibold ${
              tier === 'high' || tier === 'medium' ? 'text-purple-300' : 'text-gold-400'
            }`}
          >
            {t(`guardian.darkness.${tier}`)}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-purple-900/50 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-400 to-gold-400 transition-[width] duration-700"
            style={{ width: `${100 - darkness}%` }}
          />
        </div>
      </div>
    </section>
  );
}
