import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useOnboarding } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { Logo } from '@/components/branding/Logo';
import { cn } from '@/utils';
import { DEFAULT_AVATAR } from '@/constants';
import { AvatarPicker } from '@/features/profile/components';

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

    // Save name and avatar to temporary data
    saveStepData({ userName: trimmedName, avatarUrl: selectedAvatar });
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
          <Sparkles className="text-[rgb(137,184,32)]" size={32} />
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
              'focus:outline-none focus:ring-2 focus:ring-[rgb(137,184,32)]',
              'transition-all duration-200',
              error
                ? 'border-red-500 focus:border-red-500'
                : 'border-white/20 focus:border-[rgb(137,184,32)]'
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

        {/* Next Button */}
        <button
          type="submit"
          disabled={name.trim().length < 2}
          className={cn(
            'w-full py-3 px-6 rounded-xl font-semibold',
            'flex items-center justify-center gap-2',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 focus:ring-offset-charcoal-900',
            name.trim().length < 2
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 shadow-lg hover:shadow-gold-500/50'
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
