
import React, { useState } from 'react';
import { Image, View, StyleSheet, ActivityIndicator, Text, ImageProps } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from './IconSymbol';

interface CDNImageFixedProps extends Omit<ImageProps, 'source'> {
  source: { uri: string } | number;
  fallbackIcon?: string;
  showLoadingIndicator?: boolean;
}

/**
 * CDNImageFixed Component
 * 
 * Fixes the white screen issue when images fail to load.
 * 
 * Features:
 * - Validates source URI before rendering
 * - Shows loading indicator while loading
 * - Shows fallback UI if image fails to load
 * - Never renders white screens
 * - Handles both CDN and direct URLs
 */
export default function CDNImageFixed({
  source,
  fallbackIcon = 'photo',
  showLoadingIndicator = true,
  style,
  ...props
}: CDNImageFixedProps) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Validate source
  const isValidSource = () => {
    if (typeof source === 'number') {
      return true; // Local image
    }

    if (!source || !source.uri) {
      return false;
    }

    const uri = source.uri;
    return uri && uri.trim() !== '' && (uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('file://'));
  };

  const handleLoadStart = () => {
    setLoading(true);
    setError(false);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = (e: any) => {
    console.error('Image load error:', e.nativeEvent?.error || 'Unknown error');
    setLoading(false);
    setError(true);
  };

  // If source is invalid, show fallback immediately
  if (!isValidSource()) {
    return (
      <View style={[styles.fallbackContainer, { backgroundColor: colors.backgroundAlt }, style]}>
        <IconSymbol
          ios_icon_name={`${fallbackIcon}.fill`}
          android_material_icon_name={fallbackIcon}
          size={32}
          color={colors.textSecondary}
        />
        <Text style={[styles.fallbackText, { color: colors.textSecondary }]}>No image</Text>
      </View>
    );
  }

  // If error occurred, show fallback
  if (error) {
    return (
      <View style={[styles.fallbackContainer, { backgroundColor: colors.backgroundAlt }, style]}>
        <IconSymbol
          ios_icon_name="exclamationmark.triangle.fill"
          android_material_icon_name="error"
          size={32}
          color={colors.textSecondary}
        />
        <Text style={[styles.fallbackText, { color: colors.textSecondary }]}>Failed to load</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Image
        source={source}
        style={[StyleSheet.absoluteFill, style]}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        {...props}
      />
      {loading && showLoadingIndicator && (
        <View style={[styles.loadingContainer, { backgroundColor: colors.backgroundAlt }]}>
          <ActivityIndicator size="small" color={colors.brandPrimary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fallbackText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
