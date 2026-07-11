/**
 * AvatarCreator
 *
 * Full flow to create a personalized AI avatar from a user photo, rendered
 * in the app's chibi hero style via the `generate-avatar` Edge Function
 * (Nano Banana / Gemini). Self-contained sheet:
 *
 *   pick photo → generating (~30-60s) → preview bust+body → save / retry
 *
 * Saving uploads both PNGs to storage and updates the profile; the parent
 * gets the final URLs through onSaved to sync local state.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, Sparkles, Wand2, X } from 'lucide-react';
import { cn } from '@/utils';
import { useLocale } from '@/hooks/useLocale';
import {
  AvatarService,
  AvatarGenerationError,
  type GeneratedAvatar,
} from '@/services/supabase/avatar.service';
import type { Gender } from '@/types/user';

interface AvatarCreatorProps {
  /** Player identity — picks the style reference (female → Dani). */
  gender?: Gender;
  onClose: () => void;
  /** Called after the avatar is uploaded + persisted in the profile. */
  onSaved: (avatarUrl: string, avatarBodyUrl: string) => void;
}

type Step = 'pick' | 'ready' | 'generating' | 'preview' | 'saving';

/** Rotating status lines while Gemini works (i18n keys). */
const GENERATING_KEYS = [
  'profile.avatarCreator.generating1',
  'profile.avatarCreator.generating2',
  'profile.avatarCreator.generating3',
] as const;

export function AvatarCreator({ gender, onClose, onSaved }: AvatarCreatorProps) {
  const { t } = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('pick');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [generated, setGenerated] = useState<GeneratedAvatar | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messageIndex, setMessageIndex] = useState(0);
  // Guards against state updates from a generation the user abandoned.
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);

  // Rotate the "generating" copy so the long wait feels alive.
  useEffect(() => {
    if (step !== 'generating') return;
    const interval = setInterval(
      () => setMessageIndex((i) => (i + 1) % GENERATING_KEYS.length),
      6000
    );
    return () => clearInterval(interval);
  }, [step]);

  // Revoke preview object URLs when the sheet unmounts.
  useEffect(() => {
    return () => {
      generated?.dispose();
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generated, photoPreview]);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError(null);
    setStep('ready');
  };

  const handleGenerate = async () => {
    if (!photo) return;
    setError(null);
    setMessageIndex(0);
    setStep('generating');
    try {
      const result = await AvatarService.generate(photo, gender);
      if (!activeRef.current) {
        result.dispose();
        return;
      }
      generated?.dispose();
      setGenerated(result);
      setStep('preview');
    } catch (err) {
      if (!activeRef.current) return;
      console.error('Avatar generation failed:', err);
      setError(
        err instanceof AvatarGenerationError && err.code === 'daily_limit_reached'
          ? t('profile.avatarCreator.limitError')
          : t('profile.avatarCreator.error')
      );
      setStep('ready');
    }
  };

  const handleSave = async () => {
    if (!generated) return;
    setError(null);
    setStep('saving');
    try {
      const saved = await AvatarService.save(generated);
      if (!activeRef.current) return;
      onSaved(saved.avatarUrl, saved.avatarBodyUrl);
    } catch (err) {
      if (!activeRef.current) return;
      console.error('Avatar save failed:', err);
      setError(t('profile.avatarCreator.error'));
      setStep('preview');
    }
  };

  const busy = step === 'generating' || step === 'saving';

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md glass-card p-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Wand2 size={18} className="text-teal-300" />
            {t('profile.avatarCreator.title')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label={t('common.cancel')}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-40 flex items-center justify-center text-white"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-white/60 text-sm mb-4">
          {t('profile.avatarCreator.subtitle')}
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoChange}
        />

        {/* Step: pick / ready — photo selection */}
        {(step === 'pick' || step === 'ready') && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'w-full rounded-2xl border-2 border-dashed border-white/20 hover:border-teal-400/60',
                'bg-white/[0.03] hover:bg-white/[0.06] transition-colors',
                'flex flex-col items-center justify-center gap-3 py-6'
              )}
            >
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt={t('profile.avatarCreator.photoAlt')}
                  className="w-32 h-32 rounded-2xl object-cover"
                />
              ) : (
                <span className="w-16 h-16 rounded-full bg-teal-500/15 flex items-center justify-center text-teal-300">
                  <Camera size={28} />
                </span>
              )}
              <span className="text-sm font-semibold text-white/80">
                {photoPreview
                  ? t('profile.avatarCreator.changePhoto')
                  : t('profile.avatarCreator.pickPhoto')}
              </span>
            </button>

            {error && (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleGenerate}
              disabled={!photo}
              className={cn(
                'w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors',
                photo
                  ? 'bg-teal-500 hover:bg-teal-600 text-white'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              )}
            >
              <Sparkles size={18} />
              {t('profile.avatarCreator.generate')}
            </button>

            <p className="text-xs text-white/40 text-center">
              {t('profile.avatarCreator.privacy')}
            </p>
          </div>
        )}

        {/* Step: generating */}
        {step === 'generating' && (
          <div className="flex flex-col items-center gap-4 py-10">
            <span className="relative w-16 h-16">
              <span className="absolute inset-0 rounded-full border-4 border-teal-500/20" />
              <span className="absolute inset-0 rounded-full border-4 border-transparent border-t-teal-400 animate-spin" />
              <Sparkles
                size={22}
                className="absolute inset-0 m-auto text-teal-300 animate-pulse"
              />
            </span>
            <p className="text-white/80 font-semibold text-center" aria-live="polite">
              {t(GENERATING_KEYS[messageIndex] ?? GENERATING_KEYS[0])}
            </p>
            <p className="text-xs text-white/40">
              {t('profile.avatarCreator.generatingHint')}
            </p>
          </div>
        )}

        {/* Step: preview / saving */}
        {(step === 'preview' || step === 'saving') && generated && (
          <div className="space-y-4">
            <div className="flex items-end justify-center gap-4">
              <div className="flex flex-col items-center gap-2">
                <span className="w-28 h-28 rounded-full p-[3px] bg-gradient-to-br from-teal-300 via-teal-500 to-teal-700">
                  <img
                    src={generated.bustPreviewUrl}
                    alt={t('profile.avatarCreator.bustAlt')}
                    className="w-full h-full rounded-full object-cover object-top bg-[hsl(var(--background))]"
                  />
                </span>
                <span className="text-[11px] font-semibold text-white/60">
                  {t('profile.avatarCreator.bustLabel')}
                </span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <img
                  src={generated.bodyPreviewUrl}
                  alt={t('profile.avatarCreator.bodyAlt')}
                  className="h-48 w-auto object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)]"
                />
                <span className="text-[11px] font-semibold text-white/60">
                  {t('profile.avatarCreator.bodyLabel')}
                </span>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={step === 'saving'}
                className="flex-1 py-3 rounded-xl font-semibold bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw size={16} />
                {t('profile.avatarCreator.retry')}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={step === 'saving'}
                className="flex-1 py-3 rounded-xl font-semibold bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white flex items-center justify-center gap-2 transition-colors"
              >
                {step === 'saving' ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                {t('profile.avatarCreator.use')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AvatarCreator;
