
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import UnifiedRoastIcon, { UnifiedIconName } from './UnifiedRoastIcon';
import { IconSymbol } from '@/components/IconSymbol';
import { Ionicons } from '@expo/vector-icons';

/**
 * AppIcon - Global Safe Icon Wrapper
 * 
 * This is the ONLY component that should be used for rendering icons throughout the app.
 * It provides:
 * - Runtime validation of icon keys
 * - Automatic fallback for invalid icons
 * - Cross-platform compatibility (iOS, Android, Web)
 * - Theme-aware rendering
 * - Zero "?" placeholder rendering
 * 
 * USAGE:
 * <AppIcon name="flame-home" size={24} color={colors.text} />
 * <AppIcon name="settings" size={20} type="system" iosName="gear" androidName="settings" />
 */

export type AppIconType = 'roast' | 'system';

interface AppIconProps {
  // Icon name from UnifiedRoastIcon registry
  name?: UnifiedIconName;
  
  // Icon type: 'roast' for branded icons, 'system' for platform icons
  type?: AppIconType;
  
  // For system icons: iOS SF Symbol name
  iosName?: string;
  
  // For system icons: Android Material Icon name
  androidName?: keyof typeof Ionicons.glyphMap;
  
  // Icon size in pixels
  size?: number;
  
  // Icon color
  color?: string;
  
  // Additional styles
  style?: any;
  
  // Force a specific theme
  forceTheme?: 'light' | 'dark';
}

/**
 * AppIcon Component
 * 
 * The global safe icon wrapper that validates icon keys at runtime
 * and provides fallback rendering for invalid icons.
 * 
 * This component ensures that NO "?" characters ever appear in the app.
 */
export default function AppIcon({
  name,
  type = 'roast',
  iosName,
  androidName,
  size = 24,
  color,
  style,
  forceTheme,
}: AppIconProps) {
  const { colors, theme } = useTheme();

  // Determine effective color
  const effectiveColor = color || colors.text;
  const effectiveTheme = forceTheme || theme;

  // Render Roast Live branded icons
  if (type === 'roast') {
    if (!name) {
      console.warn('⚠️ AppIcon: No icon name provided for type "roast"');
      return renderFallback(size, effectiveColor);
    }

    return (
      <UnifiedRoastIcon
        name={name}
        size={size}
        color={effectiveColor}
        style={style}
        forceTheme={effectiveTheme}
      />
    );
  }

  // Render system icons (SF Symbols on iOS, Material Icons on Android)
  if (type === 'system') {
    if (!iosName && !androidName) {
      console.warn('⚠️ AppIcon: No icon names provided for type "system"');
      return renderFallback(size, effectiveColor);
    }

    // Use platform-specific icon names
    const finalIosName = iosName;
    const finalAndroidName = androidName || 'help-circle';

    return (
      <IconSymbol
        ios_icon_name={finalIosName}
        android_material_icon_name={finalAndroidName}
        size={size}
        color={effectiveColor}
        style={style}
      />
    );
  }

  // Fallback for unknown type
  console.warn(`⚠️ AppIcon: Unknown icon type "${type}"`);
  return renderFallback(size, effectiveColor);
}

/**
 * Render a styled fallback icon instead of "?"
 * This ensures the UI never shows broken icon placeholders
 */
function renderFallback(size: number, color: string) {
  return (
    <View
      style={[
        styles.fallbackContainer,
        {
          width: size,
          height: size,
        },
      ]}
    >
      <View
        style={[
          styles.fallbackCircle,
          {
            width: size * 0.8,
            height: size * 0.8,
            borderRadius: (size * 0.8) / 2,
            borderColor: color,
            opacity: 0.3,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fallbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackCircle: {
    borderWidth: 2,
  },
});
