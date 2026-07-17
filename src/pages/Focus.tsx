/**
 * Focus — "Enfoque del día". Immersive fullscreen Pomodoro: pick a gem and
 * a duration, grow the gem through the session, celebrate (or mourn) the
 * result, browse the vault.
 *
 * On mount a persisted session is classified (running / complete-pending /
 * broken) and the flow resumes accordingly, so reloads and backgrounded
 * tabs never lose or double-award a session.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gem, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useFocus } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { ROUTES } from '@/constants/routes';
import { NotificationsService } from '@/services/notifications.service';
import type {
  CompleteFocusSessionResult,
  FocusBreakReason,
  GemSpecies,
} from '@/types/focus';
import {
  GemPicker,
  GemCreatorSheet,
  DurationPicker,
  FocusSessionScreen,
  SessionCelebration,
  SessionBrokenScreen,
  GemVault,
  VaultCurrencyChips,
} from '@/features/focus/components';
import {
  evaluatePersisted,
  readPersistedFocusSession,
} from '@/features/focus/utils/focusStorage';
import { FOCUS_BG_IMAGE } from '@/features/focus/utils/gemAssets';

type View = 'home' | 'session' | 'celebration' | 'broken' | 'vault';

export function Focus() {
  const navigate = useNavigate();
  const { t } = useLocale();
  const {
    focusGems,
    focusStats,
    activeFocusSession,
    isLoading,
    loadFocusData,
    startFocusSession,
    completeFocusSession,
    breakFocusSession,
    setActiveFocusSession,
  } = useFocus();

  const [view, setView] = useState<View>('home');
  const [selectedGemId, setSelectedGemId] = useState<string | null>(null);
  const [minutes, setMinutes] = useState<number>(25);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [lastResult, setLastResult] = useState<CompleteFocusSessionResult | null>(null);
  const [lastSpecies, setLastSpecies] = useState<GemSpecies | null>(null);
  const [lastGemName, setLastGemName] = useState('');
  const [breakReason, setBreakReason] = useState<FocusBreakReason>('abandoned');

  // ---- restore-on-mount -------------------------------------------------
  const restoredRef = useRef(false);
  useEffect(() => {
    void loadFocusData();

    if (restoredRef.current) return;
    restoredRef.current = true;

    const persisted = readPersistedFocusSession();
    if (!persisted) return;

    setActiveFocusSession(persisted);
    setLastSpecies(persisted.species);
    setLastGemName(persisted.gemName);

    const verdict = evaluatePersisted(persisted, Date.now());
    if (verdict === 'running') {
      setView('session');
      return;
    }

    void (async () => {
      if (verdict === 'complete-pending') {
        try {
          const result = await completeFocusSession();
          if (result.broken) {
            setBreakReason(result.reason ?? 'expired');
            setView('broken');
          } else {
            setLastResult(result);
            setView('celebration');
          }
          return;
        } catch {
          setBreakReason('expired');
          setView('broken');
          return;
        }
      }
      const reason: FocusBreakReason =
        verdict === 'broken-pause' ? 'paused_too_long' : 'expired';
      await breakFocusSession(reason);
      setBreakReason(reason);
      setView('broken');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Default gem selection once data loads
  useEffect(() => {
    if (!selectedGemId && focusGems.length > 0) {
      setSelectedGemId(focusGems[0].id);
    }
  }, [focusGems, selectedGemId]);

  // ---- actions ----------------------------------------------------------
  const handleStart = async () => {
    if (!selectedGemId || starting) return;
    const gem = focusGems.find((g) => g.id === selectedGemId);
    if (!gem) return;

    setStarting(true);
    // First session is the moment to ask (never on load).
    void NotificationsService.requestPermission();
    try {
      await startFocusSession(selectedGemId, minutes);
      setLastSpecies(gem.species);
      setLastGemName(gem.name);
      setView('session');
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      toast.error(
        message.includes('session_already_running')
          ? t('focus.errors.alreadyRunning')
          : t('focus.errors.startFailed')
      );
    } finally {
      setStarting(false);
    }
  };

  const handleCompleted = useCallback((result: CompleteFocusSessionResult) => {
    setLastResult(result);
    setView('celebration');
  }, []);

  const handleBroken = useCallback((reason: FocusBreakReason) => {
    setBreakReason(reason);
    setView('broken');
  }, []);

  const inSession = view === 'session' && activeFocusSession !== null;

  // ---- render -----------------------------------------------------------
  return (
    <div className="relative min-h-dvh bg-[hsl(var(--background))] flex flex-col overflow-hidden">
      {/* Shrine scene under a charcoal gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src={FOCUS_BG_IMAGE}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover opacity-40"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--background))]/85 via-[hsl(var(--background))]/40 to-[hsl(var(--background))]/95" />
      </div>

      <div className="relative z-10 flex flex-col flex-1 max-w-md w-full mx-auto px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        {/* Header */}
        <header className="flex items-center gap-3 pt-[calc(env(safe-area-inset-top)+1rem)] pb-2 min-h-[64px]">
          {!inSession && (
            <button
              type="button"
              onClick={() =>
                view === 'vault' || view === 'celebration' || view === 'broken'
                  ? setView('home')
                  : navigate(ROUTES.DASHBOARD)
              }
              aria-label={t('actions.back')}
              className="w-9 h-9 rounded-full glass-card flex items-center justify-center text-white shrink-0"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="font-sans normal-case text-xl font-extrabold text-white leading-tight">
              {view === 'vault' ? t('focus.vault') : t('focus.title')}
            </h1>
            {view === 'home' && (
              <p className="text-white/60 text-xs">{t('focus.subtitle')}</p>
            )}
          </div>
          {view === 'home' && (
            <button
              type="button"
              onClick={() => setView('vault')}
              aria-label={t('focus.vault')}
              className="w-9 h-9 rounded-full glass-card flex items-center justify-center text-teal-300 shrink-0"
            >
              <Gem size={17} />
            </button>
          )}
          {view === 'vault' && <VaultCurrencyChips stats={focusStats} />}
        </header>

        {/* Views */}
        {view === 'home' && (
          <div className="flex-1 flex flex-col gap-8 pt-8">
            {isLoading && focusGems.length === 0 ? (
              <div className="flex-1 grid place-items-center">
                <Loader2 className="w-9 h-9 text-teal-400 animate-spin" />
              </div>
            ) : (
              <>
                <section>
                  <h2 className="section-label mb-3.5">
                    {t('focus.pickGem')}
                  </h2>
                  {focusGems.length === 0 && !isLoading && (
                    <p className="text-white/50 text-xs mb-3">
                      {t('focus.noGems')}
                    </p>
                  )}
                  <GemPicker
                    gems={focusGems}
                    selectedGemId={selectedGemId}
                    onSelect={setSelectedGemId}
                    onCreateNew={() => setCreatorOpen(true)}
                  />
                </section>

                <section>
                  <h2 className="section-label mb-3.5">
                    {t('focus.duration')}
                  </h2>
                  <DurationPicker minutes={minutes} onChange={setMinutes} />
                </section>

                <div className="mt-auto pt-2 pb-2">
                  <button
                    type="button"
                    onClick={handleStart}
                    disabled={!selectedGemId || starting}
                    className="btn-primary w-full py-4 text-base disabled:opacity-40"
                  >
                    {starting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Sparkles className="w-5 h-5" />
                    )}
                    {t('focus.start')}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {inSession && (
          <FocusSessionScreen
            onCompleted={handleCompleted}
            onBroken={handleBroken}
          />
        )}

        {view === 'celebration' && lastResult && lastSpecies && (
          <SessionCelebration
            result={lastResult}
            species={lastSpecies}
            gemName={lastGemName}
            onAgain={() => setView('home')}
            onVault={() => setView('vault')}
          />
        )}

        {view === 'broken' && (
          <SessionBrokenScreen
            reason={breakReason}
            species={lastSpecies}
            onRetry={() => setView('home')}
          />
        )}

        {view === 'vault' &&
          (focusStats ? (
            <GemVault stats={focusStats} />
          ) : (
            <div className="flex-1 grid place-items-center">
              <Loader2 className="w-9 h-9 text-teal-400 animate-spin" />
            </div>
          ))}
      </div>

      {creatorOpen && (
        <GemCreatorSheet
          onClose={() => setCreatorOpen(false)}
          onCreated={(gem) => {
            setCreatorOpen(false);
            setSelectedGemId(gem.id);
          }}
        />
      )}
    </div>
  );
}

export default Focus;
