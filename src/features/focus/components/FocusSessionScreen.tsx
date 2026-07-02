/**
 * FocusSessionScreen — the immersive running-session view. A gem grows
 * through 4 stages inside a progress ring over the shrine scene; pausing
 * shows the remaining pause budget; abandoning (confirmed) breaks the gem.
 *
 * Owns the timer + settlement: completion/pause-overrun call the store and
 * report the outcome upward; the parent only switches views.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, Square } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useLocale } from '@/hooks/useLocale';
import { useFocus } from '@/store';
import { CircularProgress } from '@/components/ui/ProgressBar';
import { NotificationsService } from '@/services/notifications.service';
import type {
  CompleteFocusSessionResult,
  FocusBreakReason,
} from '@/types/focus';
import { useFocusTimer, formatCountdown } from '../hooks/useFocusTimer';
import { gemStageImage, speciesMeta, stageForProgress } from '../utils/gemAssets';

interface FocusSessionScreenProps {
  onCompleted: (result: CompleteFocusSessionResult) => void;
  onBroken: (reason: FocusBreakReason) => void;
}

export function FocusSessionScreen({
  onCompleted,
  onBroken,
}: FocusSessionScreenProps) {
  const { t } = useLocale();
  const {
    activeFocusSession,
    completeFocusSession,
    breakFocusSession,
    updateFocusPause,
  } = useFocus();

  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const settledRef = useRef(false);

  const meta = activeFocusSession
    ? speciesMeta(activeFocusSession.species)
    : null;

  const handleComplete = async () => {
    if (settledRef.current) return;
    settledRef.current = true;
    try {
      const result = await completeFocusSession();
      if (document.hidden) {
        void NotificationsService.show(
          t('focus.notificationTitle'),
          t('focus.notificationBody'),
          'focus-complete'
        );
      }
      if (result.broken) {
        onBroken(result.reason ?? 'expired');
      } else {
        onCompleted(result);
      }
    } catch {
      // Already settled elsewhere (double tab): fall back to the vault state.
      onBroken('expired');
    }
  };

  const handlePauseBudgetExceeded = async () => {
    if (settledRef.current) return;
    settledRef.current = true;
    await breakFocusSession('paused_too_long');
    onBroken('paused_too_long');
  };

  const timer = useFocusTimer({
    session: activeFocusSession,
    onComplete: handleComplete,
    onPauseBudgetExceeded: handlePauseBudgetExceeded,
    onPauseChange: updateFocusPause,
  });

  const stage = stageForProgress(timer.elapsedFraction);

  // Preload every growth stage once so stage swaps never flash.
  const stageSources = useMemo(
    () =>
      activeFocusSession
        ? [1, 2, 3, 4].map((s) =>
            gemStageImage(activeFocusSession.species, s as 1 | 2 | 3 | 4)
          )
        : [],
    [activeFocusSession?.species] // eslint-disable-line react-hooks/exhaustive-deps
  );
  useEffect(() => {
    stageSources.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [stageSources]);

  const handleAbandon = async () => {
    if (settledRef.current) return;
    settledRef.current = true;
    await breakFocusSession('abandoned');
    onBroken('abandoned');
  };

  if (!activeFocusSession || !meta) return null;

  const paused = timer.isPaused;

  return (
    <div className="flex flex-col items-center justify-between flex-1 py-6">
      {/* Gem + ring */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="relative">
          {/* Species-colored ambient glow behind the ring */}
          <div
            className={cn(
              'absolute inset-6 rounded-full blur-3xl opacity-40',
              !paused && 'animate-glow-pulse'
            )}
            style={{ backgroundColor: meta.color }}
          />
          <CircularProgress
            current={Math.round(timer.elapsedFraction * 1000)}
            max={1000}
            size={264}
            strokeWidth={7}
            variant="teal"
            className="relative"
          >
            <div className="relative w-40 h-40 grid place-items-center">
              {/* Rising sparkles while growing */}
              {!paused && (
                <>
                  <span className="absolute -top-1 left-8 w-1.5 h-1.5 rounded-full bg-white/80 animate-sparkle-rise" />
                  <span className="absolute top-6 right-4 w-1 h-1 rounded-full bg-white/60 animate-sparkle-rise [animation-delay:0.5s]" />
                  <span className="absolute bottom-4 left-4 w-1 h-1 rounded-full bg-white/70 animate-sparkle-rise [animation-delay:1s]" />
                </>
              )}
              <img
                key={stage}
                src={gemStageImage(activeFocusSession.species, stage)}
                alt=""
                aria-hidden="true"
                className={cn(
                  'w-36 h-36 object-contain animate-pop-in motion-reduce:animate-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.55)]',
                  paused && 'opacity-60 saturate-50'
                )}
                onError={(e) => {
                  if (e.currentTarget.dataset.fallback) return;
                  e.currentTarget.dataset.fallback = '1';
                  e.currentTarget.src = meta.image;
                }}
              />
            </div>
          </CircularProgress>
        </div>

        {/* Gem name + stage label */}
        <div className="text-center">
          <p className="text-white font-bold text-lg">
            {activeFocusSession.gemName}
          </p>
          <p className="text-sm font-semibold mt-0.5" style={{ color: meta.color }}>
            {t(`focus.stage${stage}`)}
          </p>
        </div>

        {/* Countdown */}
        <div className="text-center">
          <div className="text-6xl font-extrabold text-white tabular-nums tracking-tight">
            {formatCountdown(timer.remainingMs)}
          </div>
          {paused ? (
            <p className="mt-2 text-danger-400 text-sm font-bold animate-glow-pulse">
              {t('focus.pauseBudget', {
                time: formatCountdown(timer.pauseBudgetLeftMs),
              })}
            </p>
          ) : (
            <p className="mt-2 text-white/50 text-sm font-medium">
              {t('focus.keepGrowing')}
            </p>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mt-6">
        <button
          type="button"
          onClick={() => setConfirmAbandon(true)}
          aria-label={t('focus.abandon')}
          className="w-14 h-14 rounded-full glass-card grid place-items-center text-white/80 hover:text-danger-400"
        >
          <Square size={22} />
        </button>
        <button
          type="button"
          onClick={paused ? timer.resume : timer.pause}
          aria-label={paused ? t('timer.resume') : t('timer.pause')}
          className="w-16 h-16 rounded-full bg-teal-500 shadow-glow-teal grid place-items-center text-white"
        >
          {paused ? <Play size={26} /> : <Pause size={26} />}
        </button>
      </div>

      {/* Abandon confirm */}
      {confirmAbandon && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in px-6">
          <div className="w-full max-w-sm bg-charcoal-500 rounded-3xl border border-white/10 p-6 animate-pop-in motion-reduce:animate-none text-center">
            <p className="text-3xl mb-2">💔</p>
            <h3 className="text-white font-bold text-lg mb-1.5">
              {t('focus.abandonTitle')}
            </h3>
            <p className="text-white/65 text-sm mb-5">{t('focus.abandonBody')}</p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setConfirmAbandon(false)}
                className="btn-primary w-full"
              >
                {t('focus.keepGrowingCta')}
              </button>
              <button
                type="button"
                onClick={handleAbandon}
                className="w-full py-3 rounded-2xl bg-danger-500/20 border border-danger-500/40 text-danger-300 font-bold text-sm"
              >
                {t('focus.abandonConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
