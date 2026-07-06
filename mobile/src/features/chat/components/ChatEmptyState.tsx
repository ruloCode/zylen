import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import { img } from '@/assets/registry';
import { useAccent, type ChatAccent } from './accent';

interface ChatEmptyStateProps {
  title: string;
  subtitle: string;
  /** Starter prompts rendered as tappable chips. */
  suggestions?: string[];
  /** Called when a suggestion chip is tapped. */
  onSuggestion?: (text: string) => void;
  /** Hero avatar (Coach). Falls back to a sparkle glyph. */
  avatarSrc?: string;
  accent?: ChatAccent;
}

/**
 * Friendly empty state shown before a conversation starts: a glowing avatar,
 * a warm greeting, and a few starter chips that kick off the chat in one tap.
 *
 * RN port: the web's blurred halo + `animate-glow-pulse` becomes an Animated
 * scale/opacity loop on a translucent accent circle behind the avatar.
 */
export function ChatEmptyState({
  title,
  subtitle,
  suggestions = [],
  onSuggestion,
  avatarSrc,
  accent = 'gold',
}: ChatEmptyStateProps) {
  const colors = useAccent(accent);
  // i18n's `returnObjects` can briefly yield a non-array while locales load.
  const items = Array.isArray(suggestions) ? suggestions : [];

  const avatarSource = avatarSrc
    ? avatarSrc.startsWith('/')
      ? img(avatarSrc)
      : { uri: avatarSrc }
    : undefined;

  // ≈ web `animate-glow-pulse` on the halo.
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View className="flex-1 items-center justify-center px-4 py-8">
      {/* Glowing avatar */}
      <View className="relative mb-5 items-center justify-center">
        <Animated.View
          style={{
            position: 'absolute',
            width: 112,
            height: 112,
            borderRadius: 56,
            backgroundColor: colors.glow,
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
            transform: [
              { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) },
            ],
          }}
        />
        <LinearGradient
          colors={colors.halo}
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          {avatarSource ? (
            <Image
              source={avatarSource}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              contentPosition="top"
            />
          ) : (
            <Sparkles size={34} color="#FFFFFF" />
          )}
        </LinearGradient>
      </View>

      <Text className="mb-2 text-center text-xl font-bold leading-snug text-white">{title}</Text>
      <Text className="mb-6 max-w-xs text-center text-sm leading-relaxed text-white/60">
        {subtitle}
      </Text>

      {items.length > 0 && (
        <View className="w-full max-w-sm flex-col gap-2">
          {items.map((suggestion) => (
            <Pressable
              key={suggestion}
              onPress={() => onSuggestion?.(suggestion)}
              accessibilityRole="button"
              className="flex-row items-center gap-2 rounded-2xl border border-white/10 bg-[hsl(var(--glass-bg)/0.65)] px-4 py-3 active:opacity-80"
            >
              <Sparkles size={15} color={colors.soft} />
              <Text className="flex-1 text-left text-sm text-white/80">{suggestion}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
