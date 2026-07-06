/**
 * XPBurst — one-shot celebration when a habit is completed. (RN port)
 * Renders a floating "+XP" chip plus a few golden particles that fly outward
 * (react-native Animated), then unmounts itself. Position it inside a
 * container with `relative` positioning.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';

interface XPBurstProps {
  xp: number;
  /** extra text under the XP (e.g. streak bonus) */
  hint?: string;
  onDone?: () => void;
}

const GOLD_LIGHT = '#FBC956'; // gold-300

const PARTICLES = [
  { x: -26, y: -30, delay: 0, size: 10 },
  { x: 24, y: -34, delay: 60, size: 8 },
  { x: -12, y: -44, delay: 120, size: 7 },
  { x: 16, y: -20, delay: 40, size: 9 },
  { x: 0, y: -40, delay: 90, size: 11 },
];

export function XPBurst({ xp, hint, onDone }: XPBurstProps) {
  const [visible, setVisible] = useState(true);
  const chip = useRef(new Animated.Value(0)).current;
  const particles = useRef(PARTICLES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.timing(chip, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    particles.forEach((progress, i) => {
      Animated.timing(progress, {
        toValue: 1,
        duration: 700,
        delay: PARTICLES[i].delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    });

    const timer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 1200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onDone]);

  if (!visible) return null;

  return (
    <View
      pointerEvents="none"
      className="absolute inset-0 z-20 items-center justify-center"
    >
      <View className="relative">
        {/* Floating +XP chip */}
        <Animated.View
          style={{
            alignItems: 'center',
            opacity: chip.interpolate({
              inputRange: [0, 0.1, 0.75, 1],
              outputRange: [0, 1, 1, 0],
            }),
            transform: [
              {
                translateY: chip.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -36],
                }),
              },
            ],
          }}
        >
          <View className="rounded-full bg-gold-500/90 px-2.5 py-1">
            <Text className="text-sm font-extrabold text-[#231A07]">+{xp} XP</Text>
          </View>
          {hint && (
            <Text className="mt-0.5 text-[10px] font-bold text-gold-300">{hint}</Text>
          )}
        </Animated.View>

        {/* Golden particles */}
        {PARTICLES.map((p, i) => (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              opacity: particles[i].interpolate({
                inputRange: [0, 0.2, 0.8, 1],
                outputRange: [0, 1, 1, 0],
              }),
              transform: [
                {
                  translateX: particles[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, p.x],
                  }),
                },
                {
                  translateY: particles[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, p.y],
                  }),
                },
              ],
            }}
          >
            <Sparkles size={p.size} color={GOLD_LIGHT} />
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

export default XPBurst;
