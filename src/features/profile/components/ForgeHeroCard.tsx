/**
 * ForgeHeroCard — "Forja de Héroe 3D"
 *
 * Turns the user's AI avatar into THEIR rigged 3D arena hero (Meshy
 * pipeline behind the forge-hero Edge Function). States:
 *
 *   noAvatar  → create a custom avatar first (CTA lives elsewhere in Profile)
 *   idle      → big "Forjar héroe 3D" CTA
 *   forging   → per-stage progress (sheet → model → skeleton → anims →
 *               download → merge); safe to close the app, it resumes
 *   ready     → auto-rotating 3D preview + re-forge (7-day cooldown)
 *   failed    → i18n error + retry
 */

import { useEffect } from 'react';
import { Hammer, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { cn } from '@/utils';
import { useLocale } from '@/hooks/useLocale';
import { useForge, useUser } from '@/store';
import { FEATURES, FORGE_BETA_EMAILS, isCustomAvatar } from '@/constants';
import { useAuth } from '@/features/auth/context/AuthContext';
import { HeroModelPreview } from './HeroModelPreview';

const STAGE_ORDER = ['sheet', 'model', 'skeleton', 'anims', 'download', 'merge'] as const;

export function ForgeHeroCard({ className }: { className?: string }) {
  const { t } = useLocale();
  const { user } = useUser();
  const { user: authUser } = useAuth();
  const {
    forge,
    forging,
    forgeProgress,
    forgeError,
    forgeRetryAt,
    refreshForge,
    startForge,
  } = useForge();

  const betaAllowed =
    FORGE_BETA_EMAILS.length === 0 ||
    FORGE_BETA_EMAILS.includes(authUser?.email ?? '');
  const enabled = FEATURES.enableHeroForge && betaAllowed;

  // Load the latest forge on mount; resumes an in-flight one automatically.
  useEffect(() => {
    if (enabled) void refreshForge();
  }, [enabled, refreshForge]);

  if (!enabled || !user) return null;

  const hasCustomAvatar = isCustomAvatar(user.avatarUrl) && !!user.avatarBodyUrl;
  const heroUrl = user.heroModelUrl ?? (forge?.status === 'done' ? forge.modelUrl : undefined);
  const cooldownDays = forgeRetryAt
    ? Math.max(1, Math.ceil((new Date(forgeRetryAt).getTime() - Date.now()) / 86400_000))
    : 0;

  return (
    <div className={cn('glass-card rounded-2xl p-4', className)}>
      <div className="mb-2 flex items-center gap-2">
        <Hammer className="h-4 w-4 text-gold-400" aria-hidden="true" />
        <h3 className="text-sm font-bold text-pale-100">{t('profile.forge.title')}</h3>
      </div>

      {heroUrl && !forging && (
        <div className="mb-3">
          <HeroModelPreview url={heroUrl} className="mx-auto h-48 w-48" />
          <p className="text-center text-xs text-steel-400">{t('profile.forge.ready')}</p>
        </div>
      )}

      {forging && (
        <div className="mb-3 rounded-xl bg-charcoal-800/60 p-3">
          <div className="mb-2 flex items-center gap-2 text-sm text-teal-300">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>
              {t(`profile.forge.stages.${forgeProgress?.stage ?? 'sheet'}`)}
              {forgeProgress && forgeProgress.pct > 0 ? ` · ${forgeProgress.pct}%` : ''}
            </span>
          </div>
          <div className="mb-2 flex gap-1" aria-hidden="true">
            {STAGE_ORDER.map((stage) => {
              const idx = STAGE_ORDER.indexOf(forgeProgress?.stage ?? 'sheet');
              const mine = STAGE_ORDER.indexOf(stage);
              return (
                <span
                  key={stage}
                  className={cn(
                    'h-1 flex-1 rounded-full',
                    mine < idx ? 'bg-teal-400' : mine === idx ? 'bg-gold-400' : 'bg-charcoal-700'
                  )}
                />
              );
            })}
          </div>
          <p className="text-xs text-steel-400">{t('profile.forge.forgingHint')}</p>
        </div>
      )}

      {forgeError && !forging && (
        <p className="mb-3 text-xs text-danger-400" role="alert">
          {forgeError === 'forge_cooldown'
            ? t('profile.forge.reforgeIn', { days: cooldownDays })
            : t(`profile.forge.errors.${forgeError}`)}
        </p>
      )}

      {!hasCustomAvatar && !heroUrl && (
        <p className="mb-3 text-xs text-steel-400">{t('profile.forge.noAvatar')}</p>
      )}

      {!forging && (
        <button
          type="button"
          onClick={() => void startForge()}
          disabled={!hasCustomAvatar}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5',
            'text-sm font-bold transition-colors',
            hasCustomAvatar
              ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-charcoal-900 hover:from-gold-400'
              : 'cursor-not-allowed bg-charcoal-800 text-steel-500'
          )}
        >
          {heroUrl ? (
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          )}
          {heroUrl ? t('profile.forge.reforgeCta') : t('profile.forge.cta')}
        </button>
      )}
    </div>
  );
}
