import React, { useMemo } from 'react';
import { View, type TextStyle, type ViewStyle } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useAccent, type ChatAccent } from './accent';

interface MarkdownMessageProps {
  /** Raw markdown string (assistant message content). */
  content: string;
  /** Accent palette used for links / code chrome. */
  accent?: ChatAccent;
}

/** Mono font loaded in app/_layout.tsx (tailwind `font-mono`). */
const MONO = 'JetBrainsMono_400Regular';

/**
 * Builds the react-native-markdown-display style map for an accent.
 *
 * RN port of the web's react-markdown component map: same type scale, white
 * text on the assistant bubble, dark code blocks in JetBrains Mono. Syntax
 * highlighting (rehype-highlight) has no native counterpart, so fenced code
 * stays monochrome on the dark chrome.
 */
function buildStyles(linkColor: string, quoteBorder: string): Record<string, ViewStyle | TextStyle> {
  const codeChrome: TextStyle = {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 14,
    color: '#FFFFFF',
    fontFamily: MONO,
    fontSize: 12.5,
    lineHeight: 19,
    marginVertical: 10,
  };

  return {
    body: { color: '#FFFFFF', fontSize: 14, lineHeight: 21 },
    paragraph: { marginTop: 8, marginBottom: 8 },
    strong: { fontWeight: '700', color: '#FFFFFF' },
    em: { fontStyle: 'italic' },
    s: { color: 'rgba(255, 255, 255, 0.5)' },
    link: {
      color: linkColor,
      fontWeight: '500',
      textDecorationLine: 'underline',
    },
    bullet_list: { marginTop: 8, marginBottom: 8 },
    ordered_list: { marginTop: 8, marginBottom: 8 },
    list_item: { marginBottom: 4 },
    bullet_list_icon: { color: 'rgba(255, 255, 255, 0.4)' },
    ordered_list_icon: { color: 'rgba(255, 255, 255, 0.4)' },
    heading1: { fontSize: 18, lineHeight: 24, fontWeight: '700', color: '#FFFFFF', marginTop: 12, marginBottom: 8 },
    heading2: { fontSize: 16, lineHeight: 22, fontWeight: '700', color: '#FFFFFF', marginTop: 12, marginBottom: 8 },
    heading3: { fontSize: 14, lineHeight: 20, fontWeight: '700', color: '#FFFFFF', marginTop: 10, marginBottom: 6 },
    heading4: { fontSize: 14, lineHeight: 20, fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)', marginTop: 8, marginBottom: 6 },
    heading5: { fontSize: 13, lineHeight: 19, fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)', marginTop: 8, marginBottom: 6 },
    heading6: { fontSize: 13, lineHeight: 19, fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginTop: 8, marginBottom: 6 },
    blockquote: {
      backgroundColor: 'transparent',
      borderLeftWidth: 2,
      borderLeftColor: quoteBorder,
      paddingLeft: 12,
      paddingRight: 0,
      marginLeft: 0,
      marginVertical: 10,
      fontStyle: 'italic',
      color: 'rgba(255, 255, 255, 0.7)',
    },
    hr: { backgroundColor: 'rgba(255, 255, 255, 0.1)', height: 1, marginVertical: 12 },
    code_inline: {
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      color: '#FFFFFF',
      fontFamily: MONO,
      fontSize: 12,
      borderRadius: 6,
      paddingHorizontal: 5,
      paddingVertical: 1,
    },
    code_block: codeChrome,
    fence: codeChrome,
    table: {
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: 8,
      marginVertical: 10,
    },
    thead: { borderBottomWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)' },
    tr: { borderBottomWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)', flexDirection: 'row' },
    th: { flex: 1, padding: 8, fontWeight: '600', color: '#FFFFFF', fontSize: 13 },
    td: { flex: 1, padding: 8, color: 'rgba(255, 255, 255, 0.8)', fontSize: 13 },
    image: { borderRadius: 12, marginVertical: 8 },
  };
}

/**
 * Renders an assistant message as rich markdown — bold/italics, ordered &
 * unordered lists, headings, blockquotes, tables, inline & fenced code with
 * dark chrome (JetBrains Mono), and tappable links (opened via the system
 * browser by the library's default handler). User messages stay plain text
 * and never reach this component.
 */
export function MarkdownMessage({ content, accent = 'gold' }: MarkdownMessageProps) {
  const colors = useAccent(accent);
  const style = useMemo(() => buildStyles(colors.soft, colors.soft), [colors.soft]);

  return (
    <View>
      <Markdown style={style}>{content}</Markdown>
    </View>
  );
}
