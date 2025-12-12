
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/styles/commonStyles';

export type ContentLabel = 'family_friendly' | 'roast_mode' | 'adult_only';

interface ContentLabelBadgeProps {
  label: ContentLabel;
  size?: 'small' | 'medium' | 'large';
}

export default function ContentLabelBadge({ label, size = 'medium' }: ContentLabelBadgeProps) {
  const getLabelConfig = () => {
    switch (label) {
      case 'family_friendly':
        return {
          icon: '⭐',
          text: 'Family Friendly',
          color: '#4CAF50',
        };
      case 'roast_mode':
        return {
          icon: '🔥',
          text: 'Roast Mode Activated',
          color: '#FF9800',
        };
      case 'adult_only':
        return {
          icon: '🔞',
          text: 'Adults Only',
          color: colors.gradientEnd,
        };
      default:
        return null;
    }
  };

  const config = getLabelConfig();
  if (!config) return null;

  const sizeStyles = {
    small: {
      container: styles.containerSmall,
      icon: styles.iconSmall,
      text: styles.textSmall,
    },
    medium: {
      container: styles.containerMedium,
      icon: styles.iconMedium,
      text: styles.textMedium,
    },
    large: {
      container: styles.containerLarge,
      icon: styles.iconLarge,
      text: styles.textLarge,
    },
  };

  return (
    <View style={[styles.container, sizeStyles[size].container, { backgroundColor: config.color }]}>
      <Text style={sizeStyles[size].icon}>{config.icon}</Text>
      <Text style={[styles.text, sizeStyles[size].text]}>{config.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  containerSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  containerMedium: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  containerLarge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  text: {
    fontWeight: '800',
    color: colors.text,
  },
  textSmall: {
    fontSize: 10,
  },
  textMedium: {
    fontSize: 12,
  },
  textLarge: {
    fontSize: 14,
  },
  iconSmall: {
    fontSize: 12,
  },
  iconMedium: {
    fontSize: 14,
  },
  iconLarge: {
    fontSize: 16,
  },
});