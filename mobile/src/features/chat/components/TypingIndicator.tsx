import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { User } from 'lucide-react-native';
import { img } from '@/assets/registry';
import { useAccent, type ChatAccent } from './accent';

interface TypingIndicatorProps {
  /** Hero avatar shown beside the bubble (assistant identity). */
  avatarSrc?: string;
  /** Accent palette for the pulsing dots. */
  accent?: ChatAccent;
}

/** One pulsing dot — opacity + translateY loop, staggered by `delay` ms. */
function Dot({ color, delay }: { color: string; delay: number }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(400 - delay),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [progress, delay]);

  return (
    <Animated.View
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: color,
        opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
        transform: [
          { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) },
        ],
      }}
    />
  );
}

/**
 * Elegant "assistant is typing" indicator — a soft glassy bubble with three
 * gently pulsing dots (Animated opacity/translateY loop), aligned with the
 * assistant avatar so it reads as the coach gathering their thoughts before
 * the response streams in.
 */
export function TypingIndicator({ avatarSrc, accent = 'gold' }: TypingIndicatorProps) {
  const colors = useAccent(accent);
  const avatarSource = avatarSrc
    ? avatarSrc.startsWith('/')
      ? img(avatarSrc)
      : { uri: avatarSrc }
    : undefined;

  return (
    <View className="mb-4 w-full flex-row gap-3">
      {/* Avatar */}
      <LinearGradient
        colors={[colors.from, colors.to]}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
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
          <User size={20} color="#FFFFFF" />
        )}
      </LinearGradient>

      {/* Dots bubble */}
      <View className="flex-row items-center gap-1.5 rounded-2xl rounded-tl-md border border-white/10 bg-charcoal-500 px-4 py-3.5">
        <Dot color={colors.soft} delay={0} />
        <Dot color={colors.soft} delay={200} />
        <Dot color={colors.soft} delay={300} />
      </View>
    </View>
  );
}
