
import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemedEmojiProps {
  emoji: string;
  size?: number;
  style?: TextStyle;
}

/**
 * ThemedEmoji component renders emojis with theme-aware styling
 * In dark mode, emojis appear brighter; in light mode, they appear with normal contrast
 */
export default function ThemedEmoji({ emoji, size = 20, style }: ThemedEmojiProps) {
  const { theme } = useTheme();

  return (
    <Text
      style={[
        styles.emoji,
        {
          fontSize: size,
          opacity: theme === 'dark' ? 1 : 0.9,
          // Add subtle text shadow for better visibility in dark mode
          textShadowColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.1)',
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: theme === 'dark' ? 4 : 2,
        },
        style,
      ]}
    >
      {emoji}
    </Text>
  );
}

const styles = StyleSheet.create({
  emoji: {
    fontFamily: 'System',
  },
});