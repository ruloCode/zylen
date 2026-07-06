import React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Send } from 'lucide-react-native';
import { useAccent, type ChatAccent } from './accent';

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  /** Fired on submit (the send button). */
  onSend: () => void;
  placeholder?: string;
  /** Disables the send button (e.g. empty input or in-flight request). */
  disabled?: boolean;
  /** Request in flight — keeps the send button disabled. */
  isLoading?: boolean;
  accent?: ChatAccent;
  maxLength?: number;
  sendLabel?: string;
  autoFocus?: boolean;
  /** Kept for web API parity (no DOM ids on native). */
  inputId?: string;
}

const MAX_INPUT_HEIGHT = 160; // px — ~6-7 lines before it scrolls internally

/**
 * Auto-growing chat input. The multiline TextInput expands with its content
 * up to {@link MAX_INPUT_HEIGHT} (then scrolls internally) and the gradient
 * send button matches the surface accent (teal for the generic chat, gold for
 * the Coach).
 *
 * RN port note: the keyboard return key inserts a newline (standard mobile
 * chat UX — the web's Enter-to-send has no native equivalent); sending is
 * always via the button. Wrap the screen in a KeyboardAvoidingView so the
 * composer rises above the keyboard.
 */
export function ChatComposer({
  value,
  onChange,
  onSend,
  placeholder,
  disabled,
  isLoading,
  accent = 'gold',
  maxLength,
  sendLabel = 'Send',
  autoFocus,
}: ChatComposerProps) {
  const colors = useAccent(accent);
  const blocked = disabled || isLoading;

  return (
    <View className="flex-row items-end gap-3 rounded-3xl border border-white/10 bg-[hsl(var(--glass-bg)/0.65)] p-3">
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="rgba(255, 255, 255, 0.5)"
        multiline
        maxLength={maxLength}
        autoFocus={autoFocus}
        accessibilityLabel={placeholder}
        className="flex-1 self-center py-2 pl-2 text-base leading-relaxed text-white"
        style={{ maxHeight: MAX_INPUT_HEIGHT, textAlignVertical: 'center' }}
      />
      <Pressable
        onPress={() => {
          if (!blocked) onSend();
        }}
        disabled={blocked}
        accessibilityRole="button"
        accessibilityLabel={sendLabel}
        accessibilityState={{ disabled: !!blocked }}
        className="active:scale-95"
        style={{ opacity: blocked ? 0.5 : 1 }}
      >
        <LinearGradient
          colors={[colors.from, colors.to]}
          style={{
            minWidth: 48,
            minHeight: 48,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Send size={20} color="#FFFFFF" />
        </LinearGradient>
      </Pressable>
    </View>
  );
}
