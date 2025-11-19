import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Loader2, Check, X } from 'lucide-react';
import { useOnboarding } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { Logo } from '@/components/branding/Logo';
import { cn } from '@/utils';
import { AVATARS } from '@/constants';
import { supabase } from '@/lib/supabase';

interface OnboardingStep1Props {
  onNext: () => void;
}

/**
 * Onboarding Step 1: Welcome + Username Input + Avatar Selection
 */
export function OnboardingStep1({ onNext }: OnboardingStep1Props) {
  const { temporaryData, saveStepData, completeStep } = useOnboarding();
  const { t } = useLocale();

  const [username, setUsername] = useState(temporaryData.username || '');
  const [selectedAvatar, setSelectedAvatar] = useState(temporaryData.avatarUrl || AVATARS.RULO);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    // Load saved username and avatar if exists
    if (temporaryData.username) {
      setUsername(temporaryData.username);
    }
    if (temporaryData.avatarUrl) {
      setSelectedAvatar(temporaryData.avatarUrl);
    }
  }, [temporaryData.username, temporaryData.avatarUrl]);

  // Debounced username availability check
  useEffect(() => {
    const trimmedUsername = username.trim();

    // Reset states if empty
    if (!trimmedUsername) {
      setIsAvailable(null);
      setError('');
      setSuggestions([]);
      return;
    }

    // Validate format first
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(trimmedUsername)) {
      if (trimmedUsername.length < 3) {
        setError(t('username.validation.tooShort'));
      } else if (trimmedUsername.length > 20) {
        setError(t('username.validation.tooLong'));
      } else {
        setError(t('username.validation.invalidChars'));
      }
      setIsAvailable(null);
      setSuggestions([]);
      return;
    }

    // Clear format errors
    setError('');

    // Check availability with debounce
    const timer = setTimeout(async () => {
      setIsChecking(true);
      try {
        const { data, error: rpcError } = await supabase.rpc('is_username_available', {
          p_username: trimmedUsername
        });

        if (rpcError) throw rpcError;

        setIsAvailable(data);

        // If not available, get suggestions
        if (!data) {
          const { data: suggestionsData, error: sugError } = await supabase.rpc(
            'generate_username_suggestions',
            {
              p_name: trimmedUsername,
              p_count: 3
            }
          );

          if (!sugError && suggestionsData) {
            setSuggestions(suggestionsData);
          }
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error('Error checking username:', err);
        setIsAvailable(null);
      } finally {
        setIsChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username, t]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedUsername = username.trim();

    // Validate username
    if (trimmedUsername.length < 3) {
      setError(t('username.validation.tooShort'));
      return;
    }

    if (!isAvailable) {
      setError(t('username.taken'));
      return;
    }

    // Save username and avatar to temporary data
    saveStepData({ username: trimmedUsername, avatarUrl: selectedAvatar });
    completeStep(0);
    onNext();
  };

  const isFormValid = username.trim().length >= 3 && isAvailable === true && !isChecking;

  return (
    <div className="w-full max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Logo */}
      <div className="flex justify-center mb-4 md:mb-8">
        <Logo size="md" />
      </div>

      {/* Welcome Message */}
      <div className="text-center mb-6 md:mb-10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-3 flex items-center justify-center gap-2 uppercase">
          <Sparkles className="text-[rgb(137,184,32)] animate-pulse" size={28} />
          {t('onboarding.step1.title')}
        </h1>
        <p className="text-white/70 text-sm sm:text-base max-w-md mx-auto">
          {t('onboarding.step1.description')}
        </p>
      </div>

      {/* Username Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        <div>
          <label htmlFor="username" className="block text-sm font-bold text-white/90 mb-2 uppercase tracking-wide">
            {t('username.choose')}
          </label>
          <div className="relative">
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              placeholder={t('username.placeholder')}
              aria-describedby={error ? "username-error" : undefined}
              aria-invalid={error ? "true" : "false"}
              className={cn(
                'w-full px-4 py-3 pr-12 rounded-none min-h-[44px]',
                'bg-[rgb(23,20,18)] border-2',
                'text-white placeholder-white/50 font-medium',
                'focus:outline-none focus:ring-2 focus:ring-[rgb(137,184,32)]',
                'transition-all duration-200',
                error
                  ? 'border-red-500 focus:border-red-500'
                  : isAvailable === true
                  ? 'border-green-500 focus:border-green-500'
                  : isAvailable === false
                  ? 'border-yellow-500 focus:border-yellow-500'
                  : 'border-white/20 focus:border-[rgb(137,184,32)]'
              )}
              autoFocus
              maxLength={20}
            />
            {/* Status Icon */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isChecking && (
                <Loader2 className="w-5 h-5 text-white/50 animate-spin" />
              )}
              {!isChecking && isAvailable === true && (
                <Check className="w-5 h-5 text-green-500" />
              )}
              {!isChecking && isAvailable === false && (
                <X className="w-5 h-5 text-yellow-500" />
              )}
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <p id="username-error" className="mt-2 text-sm text-red-400 animate-in fade-in slide-in-from-top-1" role="alert">
              {error}
            </p>
          )}
          {!error && isChecking && (
            <p className="mt-2 text-sm text-white/50 animate-in fade-in">
              {t('username.checking')}
            </p>
          )}
          {!error && !isChecking && isAvailable === true && (
            <p className="mt-2 text-sm text-green-500 animate-in fade-in">
              {t('username.available')}
            </p>
          )}
          {!error && !isChecking && isAvailable === false && (
            <p className="mt-2 text-sm text-yellow-500 animate-in fade-in">
              {t('username.taken')}
            </p>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="mt-3 animate-in fade-in slide-in-from-top-2">
              <p className="text-xs text-white/70 mb-2">{t('username.suggestions')}</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setUsername(suggestion)}
                    className="px-3 py-1 text-sm bg-charcoal-700 text-[rgb(137,184,32)] border border-[rgb(137,184,32)]/30 rounded-none hover:bg-[rgb(137,184,32)]/10 hover:border-[rgb(137,184,32)] transition-colors"
                  >
                    @{suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Avatar Selection */}
        <div>
          <label className="block text-sm font-bold text-white/90 mb-3 uppercase tracking-wide">
            {t('onboarding.step1.avatarLabel')}
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* Rulo Avatar (Male) */}
            <button
              type="button"
              onClick={() => setSelectedAvatar(AVATARS.RULO)}
              aria-label={`${t('actions.select')} ${t('onboarding.step1.avatarMale')} avatar`}
              aria-pressed={selectedAvatar === AVATARS.RULO}
              className={cn(
                'relative p-3 rounded-none transition-all duration-200 min-h-[80px] md:min-h-[100px]',
                'border-2 hover:scale-105',
                'focus:outline-none focus:ring-2 focus:ring-[rgb(137,184,32)]',
                selectedAvatar === AVATARS.RULO
                  ? 'border-[rgb(137,184,32)] bg-[rgb(137,184,32)]/10 shadow-lg shadow-[rgb(137,184,32)]/30'
                  : 'border-charcoal-600 bg-charcoal-700 hover:border-[rgb(137,184,32)]/50'
              )}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={cn(
                  'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2',
                  selectedAvatar === AVATARS.RULO ? 'border-[rgb(137,184,32)]' : 'border-charcoal-500'
                )}>
                  <img src={AVATARS.RULO} alt={t('onboarding.step1.avatarMale')} className="w-full h-full object-cover" />
                </div>
                <span className={cn(
                  'text-xs sm:text-sm font-medium',
                  selectedAvatar === AVATARS.RULO ? 'text-[rgb(137,184,32)]' : 'text-gray-300'
                )}>
                  {t('onboarding.step1.avatarMale')}
                </span>
              </div>
              {selectedAvatar === AVATARS.RULO && (
                <div className="absolute top-1 right-1 w-5 h-5 bg-[rgb(137,184,32)] rounded-none flex items-center justify-center">
                  <svg className="w-3 h-3 text-charcoal-900" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>

            {/* Dani Avatar (Female) */}
            <button
              type="button"
              onClick={() => setSelectedAvatar(AVATARS.DANI)}
              aria-label={`${t('actions.select')} ${t('onboarding.step1.avatarFemale')} avatar`}
              aria-pressed={selectedAvatar === AVATARS.DANI}
              className={cn(
                'relative p-3 rounded-none transition-all duration-200 min-h-[80px] md:min-h-[100px]',
                'border-2 hover:scale-105',
                'focus:outline-none focus:ring-2 focus:ring-[rgb(137,184,32)]',
                selectedAvatar === AVATARS.DANI
                  ? 'border-[rgb(137,184,32)] bg-[rgb(137,184,32)]/10 shadow-lg shadow-[rgb(137,184,32)]/30'
                  : 'border-charcoal-600 bg-charcoal-700 hover:border-[rgb(137,184,32)]/50'
              )}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={cn(
                  'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2',
                  selectedAvatar === AVATARS.DANI ? 'border-[rgb(137,184,32)]' : 'border-charcoal-500'
                )}>
                  <img src={AVATARS.DANI} alt={t('onboarding.step1.avatarFemale')} className="w-full h-full object-cover" />
                </div>
                <span className={cn(
                  'text-xs sm:text-sm font-medium',
                  selectedAvatar === AVATARS.DANI ? 'text-[rgb(137,184,32)]' : 'text-gray-300'
                )}>
                  {t('onboarding.step1.avatarFemale')}
                </span>
              </div>
              {selectedAvatar === AVATARS.DANI && (
                <div className="absolute top-1 right-1 w-5 h-5 bg-[rgb(137,184,32)] rounded-none flex items-center justify-center">
                  <svg className="w-3 h-3 text-charcoal-900" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Next Button */}
        <button
          type="submit"
          disabled={!isFormValid}
          className={cn(
            'w-full py-3 md:py-4 px-6 rounded-none font-bold text-base md:text-lg uppercase',
            'flex items-center justify-center gap-2',
            'transition-all duration-300',
            'focus:outline-none focus:ring-2 focus:ring-[rgb(137,184,32)]',
            !isFormValid
              ? 'bg-charcoal-700 text-charcoal-500 cursor-not-allowed'
              : 'bg-[rgb(137,184,32)] text-charcoal-900 hover:bg-[rgb(120,160,28)] shadow-xl hover:shadow-[rgb(137,184,32)]/40 hover:scale-[1.02] active:scale-[0.98]'
          )}
        >
          {t('onboarding.step1.nextButton')}
          <ArrowRight size={20} />
        </button>
      </form>
    </div>
  );
}

export default OnboardingStep1;
