/**
 * UsernameSelector Component — React Native port.
 * Allows users to choose and validate a unique username.
 * Same export and props as the web version (also used by onboarding).
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { useLocale } from '@/hooks/useLocale';
import { Button } from '@/components/ui/Button';
import { User, Check, X } from 'lucide-react-native';
import * as SocialService from '@/services/supabase/social.service';
import { debounce } from '@/utils';
import { supabase } from '@/lib/supabase';

interface UsernameSelectorProps {
  defaultName?: string;
  onUsernameSet?: (username: string) => void;
  onSkip?: () => void;
  showSkipButton?: boolean;
}

const COLORS = {
  teal400: '#2dd4bf',
  danger400: '#F56565',
  success400: '#66CB8F',
};

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setError(t(err?.code === 'username_taken' ? 'username.taken' : 'username.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status indicator (inside the input, right side)
  const getStatusIndicator = () => {
    if (isChecking) {
      return (
        <View className="absolute bottom-0 right-3 top-0 justify-center">
          <ActivityIndicator size="small" color={COLORS.teal400} />
        </View>
      );
    }

    if (error) {
      return (
        <View className="absolute bottom-0 right-3 top-0 justify-center">
          <X size={20} color={COLORS.danger400} />
        </View>
      );
    }

    if (isAvailable === true) {
      return (
        <View className="absolute bottom-0 right-3 top-0 justify-center">
          <Check size={20} color={COLORS.success400} />
        </View>
      );
    }

    if (isAvailable === false) {
      return (
        <View className="absolute bottom-0 right-3 top-0 justify-center">
          <X size={20} color={COLORS.danger400} />
        </View>
      );
    }

    return null;
  };

  // Status message
  const getStatusMessage = () => {
    if (isChecking) {
      return (
        <Text className="text-sm text-teal-400" accessibilityLiveRegion="polite">
          {t('username.checking')}
        </Text>
      );
    }

    if (error) {
      return (
        <Text className="text-sm text-danger-400" accessibilityLiveRegion="assertive">
          {error}
        </Text>
      );
    }

    if (isAvailable === true) {
      return (
        <Text className="text-sm text-success-400" accessibilityLiveRegion="polite">
          {t('username.available')}
        </Text>
      );
    }

    if (isAvailable === false) {
      return (
        <Text className="text-sm text-danger-400" accessibilityLiveRegion="assertive">
          {t('username.taken')}
        </Text>
      );
    }

    return null;
  };

  const canSubmit = username && isAvailable && !error && !isSubmitting;

  return (
    <View className="w-full max-w-md gap-6 self-center">
      {/* Title */}
      <View className="items-center gap-2">
        <View className="rounded-2xl bg-teal-500/10 p-4">
          <User size={32} color={COLORS.teal400} />
        </View>
        <Text className="text-center text-2xl font-bold text-white">
          {t('username.choose')}
        </Text>
      </View>

      {/* Username Input */}
      <View className="gap-2">
        <View className="relative">
          <TextInput
            value={username}
            onChangeText={handleUsernameChange}
            placeholder={t('username.placeholder')}
            placeholderTextColor="rgba(255,255,255,0.4)"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            maxLength={20}
            editable={!isSubmitting}
            className="min-h-[44px] w-full rounded-xl border border-charcoal-600 bg-charcoal-800 px-4 py-3 pr-12 text-white"
          />
          {getStatusIndicator()}
        </View>
        {getStatusMessage()}
      </View>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <View className="gap-2">
          <Text className="text-sm text-charcoal-300">{t('username.suggestions')}</Text>
          <View className="flex-row flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <Pressable
                key={suggestion}
                onPress={() => handleSuggestionClick(suggestion)}
                disabled={isSubmitting}
                className="rounded-lg bg-charcoal-700 px-3 py-1.5 active:bg-charcoal-600"
              >
                <Text className="text-sm text-white">{suggestion}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View className="flex-row gap-3">
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
      </View>
    </View>
  );
}
