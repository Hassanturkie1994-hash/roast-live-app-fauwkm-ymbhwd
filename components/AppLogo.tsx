
import React from 'react';
import { Animated, StyleSheet, View, ViewStyle, ImageStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface AppLogoProps {
  size?: number | 'small' | 'medium' | 'large' | 'xlarge';
  style?: ViewStyle;
  opacity?: number;
  alignment?: 'left' | 'center' | 'right';
  withShadow?: boolean;
}

export default function AppLogo({ 
  size = 'medium', 
  style, 
  opacity = 1,
  alignment = 'center',
  withShadow = false 
}: AppLogoProps) {
  const { images, themeOpacity } = useTheme();

  // Size presets (width in pixels)
  const sizePresets = {
    small: 100,
    medium: 150,
    large: 200,
    xlarge: 280,
  };

  // Get the actual size value
  const sizeValue = typeof size === 'number' ? size : sizePresets[size];
  
  // Calculate height based on aspect ratio (approximately 3:1 for the logo)
  const height = sizeValue / 3;

  // Alignment styles
  const alignmentStyles: Record<string, ViewStyle> = {
    left: { alignItems: 'flex-start' },
    center: { alignItems: 'center' },
    right: { alignItems: 'flex-end' },
  };

  // Multiply the themeOpacity with the opacity prop
  const combinedOpacity = Animated.multiply(themeOpacity, opacity);

  return (
    <View style={[styles.container, alignmentStyles[alignment], style]}>
      <Animated.Image
        source={images.logo}
        style={[
          styles.logo,
          {
            width: sizeValue,
            height: height,
            opacity: combinedOpacity,
          } as ImageStyle,
          withShadow && styles.logoWithShadow,
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  logo: {
    // Image styling
  },
  logoWithShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
