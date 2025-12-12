
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/styles/commonStyles';

interface AchievementBadgeProps {
  emoji: string;
  name: string;
  description?: string;
  unlocked?: boolean;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export function AchievementBadge({
  emoji,
  name,
  description,
  unlocked = true,
  onPress,
  size = 'medium',
}: AchievementBadgeProps) {
  const sizeStyles = {
    small: {
      container: styles.containerSmall,
      emoji: styles.emojiSmall,
      name: styles.nameSmall,
    },
    medium: {
      container: styles.containerMedium,
      emoji: styles.emojiMedium,
      name: styles.nameMedium,
    },
    large: {
      container: styles.containerLarge,
      emoji: styles.emojiLarge,
      name: styles.nameLarge,
    },
  };

  const currentSize = sizeStyles[size];

  const content = (
    <View style={[styles.container, currentSize.container, !unlocked && styles.locked]}>
      <Text style={[styles.emoji, currentSize.emoji, !unlocked && styles.lockedEmoji]}>
        {unlocked ? emoji : '🔒'}
      </Text>
      {size !== 'small' && (
        <Text style={[styles.name, currentSize.name, !unlocked && styles.lockedText]}>
          {name}
        </Text>
      )}
      {description && size === 'large' && (
        <Text style={[styles.description, !unlocked && styles.lockedText]}>
          {description}
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  containerSmall: {
    width: 50,
    height: 50,
  },
  containerMedium: {
    width: 80,
    height: 80,
  },
  containerLarge: {
    width: 120,
    height: 120,
    padding: 12,
  },
  emoji: {
    textAlign: 'center',
  },
  emojiSmall: {
    fontSize: 24,
  },
  emojiMedium: {
    fontSize: 32,
  },
  emojiLarge: {
    fontSize: 48,
  },
  name: {
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  nameSmall: {
    fontSize: 8,
  },
  nameMedium: {
    fontSize: 10,
  },
  nameLarge: {
    fontSize: 14,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  locked: {
    opacity: 0.5,
    backgroundColor: colors.background,
  },
  lockedEmoji: {
    opacity: 0.3,
  },
  lockedText: {
    opacity: 0.5,
  },
});