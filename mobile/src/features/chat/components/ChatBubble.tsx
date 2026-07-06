import React, { useEffect, useRef, useState } from 'react';
import { Animated, Clipboard, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Copy, User } from 'lucide-react-native';
import { img } from '@/assets/registry';
import { MarkdownMessage } from './MarkdownMessage';
import { useAccent, type ChatAccent } from './accent';

interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: string;
  /**
   * Full-body hero avatar shown for assistant (Hermes) messages — the same
   * character the user picked on the Home. Falls back to a generic icon when
   * absent. Ignored for user messages.
   */
  avatarSrc?: string;
  /** Accent palette: gold for the Coach (Hermes), teal for the generic chat. */
  accent?: ChatAccent;
  /** Label for the copy action (i18n). */
  copyLabel?: string;
  /** Label shown briefly after copying (i18n). */
  copiedLabel?: string;
}

/**
 * A single chat row: avatar + bubble.
 *
 * Assistant messages render rich markdown ({@link MarkdownMessage}) in a wide
 * bubble so formatted content (lists, code, tables) breathes, and expose a
 * copy action + timestamp in a subtle meta row (always visible on touch —
 * there is no hover to reveal it, unlike the web). User messages stay plain
 * text in a tighter, accent-tinted bubble.
 */
export function ChatBubble({
  message,
  isUser,
  timestamp,
  avatarSrc,
  accent = 'gold',
  copyLabel = 'Copy',
  copiedLabel = 'Copied',
}: ChatBubbleProps) {
  const [copied, setCopied] = useState(false);
  const colors = useAccent(accent);
  // Teal accent for the user avatar regardless of surface accent (web parity).
  const userColors = useAccent('teal');

  // ≈ web `animate-message-in`: fade + slide up on mount.
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [enter]);

  const handleCopy = () => {
    try {
      // Core Clipboard is deprecated in favor of @react-native-clipboard, but
      // that package isn't installed; the core module still works on RN 0.86.
      Clipboard.setString(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  };

  const avatarSource = avatarSrc
    ? avatarSrc.startsWith('/')
      ? img(avatarSrc)
      : { uri: avatarSrc }
    : undefined;
  const avatarGradient: [string, string] = isUser
    ? [userColors.from, userColors.to]
    : [colors.from, colors.to];

  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
      }}
      className={`mb-4 w-full flex-row gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <LinearGradient
        colors={avatarGradient}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {!isUser && avatarSource ? (
          <Image
            source={avatarSource}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            contentPosition="top"
          />
        ) : (
          <User size={20} color="#FFFFFF" />
        )}
      </LinearGradient>

      {/* Bubble + meta */}
      <View
        className={`flex-col ${isUser ? 'items-end' : 'items-start'}`}
        style={{ maxWidth: isUser ? '80%' : '88%', flexShrink: 1 }}
      >
        <View
          className={`max-w-full rounded-2xl border px-4 py-3 ${
            isUser
              ? 'rounded-tr-md border-teal-600/30 bg-teal-500/90'
              : 'rounded-tl-md border-white/10 bg-charcoal-500'
          }`}
        >
          {isUser ? (
            <Text className="text-sm leading-relaxed text-white">{message}</Text>
          ) : (
            <MarkdownMessage content={message} accent={accent} />
          )}
        </View>

        {/* Meta row — copy (assistant only) + timestamp */}
        <View
          className={`mt-1 flex-row items-center gap-2 px-1 ${isUser ? 'flex-row-reverse' : ''}`}
        >
          {!isUser && (
            <Pressable
              onPress={handleCopy}
              accessibilityRole="button"
              accessibilityLabel={copied ? copiedLabel : copyLabel}
              className="flex-row items-center gap-1 rounded-md px-1 py-0.5 active:opacity-70"
              hitSlop={8}
            >
              {copied ? (
                <>
                  <Check size={12} color="#4ADE80" />
                  <Text className="text-xs" style={{ color: '#4ADE80' }}>
                    {copiedLabel}
                  </Text>
                </>
              ) : (
                <Copy size={12} color="rgba(255,255,255,0.5)" />
              )}
            </Pressable>
          )}
          {timestamp ? <Text className="text-xs text-white/40">{timestamp}</Text> : null}
        </View>
      </View>
    </Animated.View>
  );
}
