/**
 * ReactionBar — reacciones de una foto de progreso del feed.
 * Una por usuario (toggle): la propia se resalta; tocar otra la cambia.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { PostReactionKind, PostReactions } from '@/types/community';

export const POST_REACTIONS: Array<{ kind: PostReactionKind; emoji: string }> = [
  { kind: 'fire', emoji: '🔥' },
  { kind: 'flex', emoji: '💪' },
  { kind: 'clap', emoji: '👏' },
  { kind: 'heart', emoji: '💛' },
];

interface ReactionBarProps {
  reactions?: PostReactions;
  onReact: (kind: PostReactionKind) => void;
  /** i18n label builder for accessibility. */
  reactLabel: (kind: PostReactionKind) => string;
}

export function ReactionBar({ reactions, onReact, reactLabel }: ReactionBarProps) {
  const counts = reactions?.counts ?? {};
  const mine = reactions?.mine;

  return (
    <View className="mt-2 flex-row items-center gap-1.5">
      {POST_REACTIONS.map(({ kind, emoji }) => {
        const count = counts[kind] ?? 0;
        const isMine = mine === kind;
        return (
          <Pressable
            key={kind}
            onPress={() => onReact(kind)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={reactLabel(kind)}
            accessibilityState={{ selected: isMine }}
            className={`flex-row items-center gap-1 rounded-full border px-2.5 py-1 active:scale-95 ${
              isMine
                ? 'border-teal-400/60 bg-teal-500/25'
                : 'border-white/10 bg-white/[0.05]'
            }`}
          >
            <Text className="text-[13px]">{emoji}</Text>
            {count > 0 && (
              <Text
                className={`text-[11px] font-bold tabular-nums ${
                  isMine ? 'text-teal-200' : 'text-white/60'
                }`}
              >
                {count}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

export default ReactionBar;
