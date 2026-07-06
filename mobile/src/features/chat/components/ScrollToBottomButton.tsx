import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowDown } from 'lucide-react-native';
import { useAccent, type ChatAccent } from './accent';

interface ScrollToBottomButtonProps {
  show: boolean;
  onClick: () => void;
  label: string;
  accent?: ChatAccent;
}

/**
 * Floating "↓ new messages" pill, shown when the user has scrolled up and fresh
 * content arrived below. Tapping it jumps to the latest message. Render it as
 * a sibling of the messages ScrollView inside a relative container.
 */
export function ScrollToBottomButton({
  show,
  onClick,
  label,
  accent = 'gold',
}: ScrollToBottomButtonProps) {
  const colors = useAccent(accent);

  if (!show) return null;

  return (
    <View pointerEvents="box-none" className="absolute bottom-3 left-0 right-0 items-center">
      <Pressable
        onPress={onClick}
        accessibilityRole="button"
        accessibilityLabel={label}
        className="active:scale-95"
      >
        <LinearGradient
          colors={[colors.from, colors.to]}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            borderRadius: 999,
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
        >
          <ArrowDown size={14} color="#FFFFFF" />
          <Text className="text-xs font-semibold text-white">{label}</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}
