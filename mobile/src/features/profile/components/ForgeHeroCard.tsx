/**
 * ForgeHeroCard — "Forja de Héroe 3D" (React Native port).
 *
 * Turns the user's AI avatar into THEIR rigged 3D arena hero (Meshy
 * pipeline behind the forge-hero Edge Function). States:
 *
 *   noAvatar  → create a custom avatar first (CTA lives elsewhere in Profile)
 *   idle      → big "Forjar héroe 3D" CTA
 *   forging   → per-stage progress (sheet → model → skeleton → anims →
 *               download → merge); safe to close the app, it resumes
 *   ready     → auto-rotating 3D preview (WebView) + re-forge (7-day cooldown)
 *   failed    → i18n error + retry
 *
 * Design system v2: Manrope via font-* weights (no uppercase/font-display),
 * gold gradient CTA for the reward moment, active:scale press feedback.
 */

import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Hammer, RefreshCw, Sparkles } from 'lucide-react-native';
import { cn } from '@/utils';
import { useLocale } from '@/hooks/useLocale';
import { useForge, useUser } from '@/store';
import { FEATURES, FORGE_BETA_EMAILS, isCustomAvatar } from '@/constants';
import { useAuth } from '@/features/auth/context/AuthContext';
import { GlassCard } from '@/components/ui';
import { HeroModelPreview } from './HeroModelPreview';

const STAGE_ORDER = ['sheet', 'model', 'skeleton', 'anims', 'download', 'merge'] as const;

const GOLD_400 = 'hsl(40, 95%, 58%)';
const TEAL_300 = '#5eead4';

// Tailwind gold-500 → gold-600 (matches the web CTA gradient).
const CTA_GRADIENT: [string, string] = ['hsl(38, 95%, 52%)', 'hsl(34, 92%, 46%)'];

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
    <GlassCard className={cn('p-4', className)}>
      <View className="mb-2 flex-row items-center gap-2">
        <Hammer size={16} color={GOLD_400} />
        <Text className="text-sm font-bold text-white">{t('profile.forge.title')}</Text>
      </View>

      {heroUrl && !forging && (
        <View className="mb-3">
          <View className="items-center">
            <HeroModelPreview url={heroUrl} className="h-48 w-48" />
          </View>
          <Text className="text-center text-xs text-white/60">{t('profile.forge.ready')}</Text>
        </View>
      )}

      {forging && (
        <View className="mb-3 rounded-xl bg-charcoal-800/60 p-3">
          <View className="mb-2 flex-row items-center gap-2">
            <ActivityIndicator size="small" color={TEAL_300} />
            <Text className="flex-1 text-sm font-semibold text-teal-300">
              {t(`profile.forge.stages.${forgeProgress?.stage ?? 'sheet'}`)}
              {forgeProgress && forgeProgress.pct > 0 ? ` · ${forgeProgress.pct}%` : ''}
            </Text>
          </View>
          <View className="mb-2 flex-row gap-1">
            {STAGE_ORDER.map((stage) => {
              const idx = STAGE_ORDER.indexOf(forgeProgress?.stage ?? 'sheet');
              const mine = STAGE_ORDER.indexOf(stage);
              return (
                <View
                  key={stage}
                  className={cn(
                    'h-1 flex-1 rounded-full',
                    mine < idx ? 'bg-teal-400' : mine === idx ? 'bg-gold-400' : 'bg-charcoal-700'
                  )}
                />
              );
            })}
          </View>
          <Text className="text-xs text-white/60">{t('profile.forge.forgingHint')}</Text>
        </View>
      )}

      {forgeError && !forging && (
        <Text className="mb-3 text-xs text-danger-400" accessibilityRole="alert">
          {forgeError === 'forge_cooldown'
            ? t('profile.forge.reforgeIn', { days: cooldownDays })
            : t(`profile.forge.errors.${forgeError}`)}
        </Text>
      )}

      {!hasCustomAvatar && !heroUrl && (
        <Text className="mb-3 text-xs text-white/60">{t('profile.forge.noAvatar')}</Text>
      )}

      {!forging && (
        <Pressable
          onPress={() => void startForge()}
          disabled={!hasCustomAvatar}
          className={cn(
            'w-full overflow-hidden rounded-xl active:scale-95',
            !hasCustomAvatar && 'bg-charcoal-800'
          )}
        >
          {hasCustomAvatar && (
            <LinearGradient
              colors={CTA_GRADIENT}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          )}
          <View className="flex-row items-center justify-center gap-2 px-4 py-2.5">
            {heroUrl ? (
              <RefreshCw size={16} color={hasCustomAvatar ? '#1a1a1a' : 'rgba(255,255,255,0.35)'} />
            ) : (
              <Sparkles size={16} color={hasCustomAvatar ? '#1a1a1a' : 'rgba(255,255,255,0.35)'} />
            )}
            <Text
              className={cn(
                'text-sm font-bold',
                hasCustomAvatar ? 'text-charcoal-900' : 'text-white/35'
              )}
              style={hasCustomAvatar ? { color: '#1a1a1a' } : undefined}
            >
              {heroUrl ? t('profile.forge.reforgeCta') : t('profile.forge.cta')}
            </Text>
          </View>
        </Pressable>
      )}
    </GlassCard>
  );
}
