import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useOnboarding } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { Logo } from '@/components/branding/Logo';
import { cn } from '@/utils';
import { DEFAULT_AVATAR, GENDER_OPTIONS } from '@/constants';
import { AvatarPicker } from '@/features/profile/components';
import type { Gender } from '@/types/user';

interface OnboardingStep1Props {
  onNext: () => void;
}

/**
 * Onboarding Step 1: Welcome + Name Input
 */
export function OnboardingStep1({ onNext }: OnboardingStep1Props) {
  const { temporaryData, saveStepData, completeStep } = useOnboarding();
  const { t } = useLocale();
  const [name, setName] = useState(temporaryData.userName || '');
  const [selectedAvatar, setSelectedAvatar] = useState(temporaryData.avatarUrl || DEFAULT_AVATAR);
  const [gender, setGender] = useState<Gender | undefined>(temporaryData.gender);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load saved name and avatar if exists
    if (temporaryData.userName) {
      setName(temporaryData.userName);
    }
    if (temporaryData.avatarUrl) {
      setSelectedAvatar(temporaryData.avatarUrl);
    }
  }, [temporaryData.userName, temporaryData.avatarUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      setError(t('onboarding.step1.nameError'));
      return;
    }

    if (!gender) {
      setError(t('onboarding.identity.error'));
      return;
    }

    // Save name, avatar and identity to temporary data
    saveStepData({ userName: trimmedName, avatarUrl: selectedAvatar, gender });
    completeStep(0);
    onNext();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Logo */}
      <div className="flex justify-center mb-8">
        <Logo size="lg" />
      </div>

      {/* Welcome Message */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 flex items-center justify-center gap-2 uppercase tracking-wide">
          <Sparkles className="text-[hsl(var(--primary))]" size={32} />
          {t('onboarding.step1.title')}
        </h1>
        <p className="text-white/85 text-lg font-semibold">
          {t('onboarding.step1.description')}
        </p>
      </div>

      {/* Name Input Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-bold text-white/90 mb-2 uppercase tracking-wide">
            {t('onboarding.step1.nameLabel')}
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder={t('onboarding.step1.namePlaceholder')}
            aria-describedby={error ? "name-error" : undefined}
            aria-invalid={error ? "true" : "false"}
            className={cn(
              'w-full px-4 py-3 rounded-none min-h-[44px]',
              'bg-[rgb(23,20,18)] border-2',
              'text-white placeholder-white/50 font-medium',
              'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]',
              'transition-all duration-200',
              error
                ? 'border-red-500 focus:border-red-500'
                : 'border-white/20 focus:border-[hsl(var(--primary))]'
            )}
            autoFocus
            maxLength={30}
          />
          {error && (
            <p id="name-error" className="mt-2 text-sm text-red-400 animate-in fade-in slide-in-from-top-1" role="alert">
              {error}
            </p>
          )}
        </div>

        {/* Avatar Selection */}
        <div>
          <label className="block text-sm font-bold text-white/90 mb-3 uppercase tracking-wide">
            {t('onboarding.step1.avatarLabel')}
          </label>
          <AvatarPicker value={selectedAvatar} onChange={setSelectedAvatar} />
        </div>

        {/* Identity Selection — drives gendered language across the app */}
        <div>
          <label className="block text-sm font-bold text-white/90 mb-3 uppercase tracking-wide">
            {t('onboarding.identity.label')}
          </label>
          <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label={t('onboarding.identity.label')}>
            {GENDER_OPTIONS.map((option) => {
              const isSelected = gender === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => {
                    setGender(option.value);
                    setError('');
                  }}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-2xl p-3 transition-all',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60',
                    isSelected
                      ? 'bg-teal-500/15 ring-2 ring-teal-400/70'
                      : 'bg-white/[0.04] ring-1 ring-white/10 hover:bg-white/[0.07]'
                  )}
                >
                  <span className="text-2xl" aria-hidden="true">{option.emoji}</span>
                  <span
                    className={cn(
                      'text-[11px] font-semibold leading-tight',
                      isSelected ? 'text-teal-200' : 'text-white/60'
                    )}
                  >
                    {t(option.labelKey)}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-white/45">{t('onboarding.identity.hint')}</p>
        </div>

        {/* Next Button */}
        <button
          type="submit"
          disabled={name.trim().length < 2 || !gender}
          className={cn(
            'w-full py-3 px-6 rounded-xl font-semibold',
            'flex items-center justify-center gap-2',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--background))]',
            name.trim().length < 2 || !gender
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary-hover))] shadow-lg hover:shadow-[0_10px_30px_-8px_hsl(var(--primary)/0.6)]'
          )}
        >
          {t('onboarding.step1.nextButton')}
          <ArrowRight size={20} />
        </button>
      </form>

      {/* Helper Text */}
      <p className="mt-6 text-center text-sm text-gray-400">
        {t('onboarding.step1.helperText')}
      </p>
    </div>
  );
}

export default OnboardingStep1;
