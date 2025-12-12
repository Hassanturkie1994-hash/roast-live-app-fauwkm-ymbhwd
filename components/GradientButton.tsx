
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, buttonStyles } from '@/styles/commonStyles';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export default function GradientButton({
  title,
  onPress,
  size = 'medium',
  style,
  disabled = false,
  variant = 'primary',
}: GradientButtonProps) {
  const buttonSize = {
    small: { paddingVertical: 8, paddingHorizontal: 20 },
    medium: { paddingVertical: 12, paddingHorizontal: 28 },
    large: { paddingVertical: 16, paddingHorizontal: 36 },
  };

  const textSize = {
    small: 12,
    medium: 14,
    large: 16,
  };

  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        isPrimary ? styles.primaryButton : styles.secondaryButton,
        buttonSize[size],
        disabled && styles.disabledButton,
        style,
      ]}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.buttonText,
          isPrimary ? styles.primaryButtonText : styles.secondaryButtonText,
          { fontSize: textSize[size] },
          disabled && styles.disabledText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: colors.brandPrimary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.brandPrimary,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
    borderColor: '#CCCCCC',
  },
  buttonText: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: colors.brandPrimary,
  },
  disabledText: {
    color: '#888888',
  },
});