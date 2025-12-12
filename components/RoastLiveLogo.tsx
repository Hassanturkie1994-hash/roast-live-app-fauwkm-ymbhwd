
import React from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface RoastLiveLogoProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  style?: ViewStyle;
  opacity?: number;
  withShadow?: boolean;
}

export default function RoastLiveLogo({ 
  size = 'medium', 
  style, 
  opacity = 1,
  withShadow = false 
}: RoastLiveLogoProps) {
  const { images, themeOpacity } = useTheme();

  const sizeStyles = {
    small: { width: 100, height: 30 },
    medium: { width: 150, height: 45 },
    large: { width: 200, height: 60 },
    xlarge: { width: 280, height: 84 },
  };

  const currentSize = sizeStyles[size];

  // Multiply the themeOpacity with the opacity prop
  const combinedOpacity = Animated.multiply(themeOpacity, opacity);

  return (
    <View style={[styles.container, style]}>
      <Animated.Image
        source={images.logo}
        style={[
          styles.logo,
          {
            width: currentSize.width,
            height: currentSize.height,
            opacity: combinedOpacity,
          },
          withShadow && styles.logoWithShadow,
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
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