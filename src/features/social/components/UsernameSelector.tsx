/**
 * UsernameSelector Component
 * Allows users to choose and validate a unique username
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { Button } from '@/components/ui/Button';
import { User, Check, X, Loader2 } from 'lucide-react';
import * as SocialService from '@/services/supabase/social.service';
import { debounce } from '@/utils';
import { supabase } from '@/lib/supabase';

interface UsernameSelectorProps {
  defaultName?: string;
  onUsernameSet?: (username: string) => void;
  onSkip?: () => void;
  showSkipButton?: boolean;
}

export function UsernameSelector({
  defaultName = '',
  onUsernameSet,
  onSkip,
  showSkipButton = false,
}: UsernameSelectorProps) {
  const { t } = useLocale();
  const [username, setUsername] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation regex: 3-20 chars, alphanumeric + underscore
  const isValidFormat = (value: string): boolean => {
    return /^[a-zA-Z0-9_]{3,20}$/.test(value);
  };

  // Get validation error message
  const getValidationError = (value: string): string | null => {
    if (value.length < 3) {
      return t('username.validation.tooShort');
    }
    if (value.length > 20) {
      return t('username.validation.tooLong');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return t('username.validation.invalidChars');
    }
    return null;
  };

  // Check username availability (debounced)
  const checkAvailability = useCallback(
    debounce(async (value: string) => {
      if (!value || !isValidFormat(value)) {
        setIsAvailable(null);
        setIsChecking(false);
        return;
      }

      setIsChecking(true);
      try {
        const available = await SocialService.checkUsernameAvailability(value);
        setIsAvailable(available);

        // If not available, generate suggestions
        if (!available && defaultName) {
          const newSuggestions = await SocialService.generateUsernameSuggestions(
            defaultName,
            3
          );
          setSuggestions(newSuggestions);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error('Error checking username:', err);
        setIsAvailable(null);
      } finally {
        setIsChecking(false);
      }
    }, 500),
    [defaultName]
  );

  // Handle username change
  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setError(getValidationError(value));

    if (isValidFormat(value)) {
      setIsChecking(true);
      checkAvailability(value);
    } else {
      setIsAvailable(null);
      setIsChecking(false);
    }
  };

  // Load initial suggestions
  useEffect(() => {
    if (defaultName && !username) {
      SocialService.generateUsernameSuggestions(defaultName, 3)
        .then(setSuggestions)
        .catch(console.error);
    }
  }, [defaultName, username]);

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setUsername(suggestion);
    handleUsernameChange(suggestion);
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!username || !isAvailable || error) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      await SocialService.updateUsername(user.id, username);
      onUsernameSet?.(username);
    } catch (err: any) {
      console.error('Error setting username:', err);
      setError(err.message || t('username.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status indicator
  const getStatusIndicator = () => {
    if (isChecking) {
      return (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-danger-400">
          <X className="w-5 h-5" />
        </div>
      );
    }

    if (isAvailable === true) {
      return (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-success-400">
          <Check className="w-5 h-5" />
        </div>
      );
    }

    if (isAvailable === false) {
      return (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-danger-400">
          <X className="w-5 h-5" />
        </div>
      );
    }

    return null;
  };

  // Status message
  const getStatusMessage = () => {
    if (isChecking) {
      return <p className="text-sm text-teal-400">{t('username.checking')}</p>;
    }

    if (error) {
      return <p className="text-sm text-danger-400">{error}</p>;
    }

    if (isAvailable === true) {
      return <p className="text-sm text-success-400">{t('username.available')}</p>;
    }

    if (isAvailable === false) {
      return <p className="text-sm text-danger-400">{t('username.taken')}</p>;
    }

    return null;
  };

  const canSubmit = username && isAvailable && !error && !isSubmitting;

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="p-4 rounded-2xl bg-teal-500/10">
            <User className="w-8 h-8 text-teal-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-pale-50">
          {t('username.choose')}
        </h2>
      </div>

      {/* Username Input */}
      <div className="space-y-2">
        <div className="relative">
          <input
            type="text"
            value={username}
            onChange={(e) => handleUsernameChange(e.target.value)}
            placeholder={t('username.placeholder')}
            className="w-full px-4 py-3 pr-12 bg-charcoal-800 border border-charcoal-600 rounded-xl text-pale-50 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            maxLength={20}
            disabled={isSubmitting}
          />
          {getStatusIndicator()}
        </div>
        {getStatusMessage()}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-charcoal-300">{t('username.suggestions')}</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-3 py-1.5 bg-charcoal-700 hover:bg-charcoal-600 text-pale-100 rounded-lg text-sm transition-colors"
                disabled={isSubmitting}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {showSkipButton && (
          <Button
            variant="secondary"
            onClick={onSkip}
            disabled={isSubmitting}
            className="flex-1"
          >
            {t('actions.skip')}
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          isLoading={isSubmitting}
          className="flex-1"
        >
          {t('actions.confirm')}
        </Button>
      </div>
    </div>
  );
}
