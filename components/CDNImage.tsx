
import React, { useState, useEffect, useCallback } from 'react';
import { Image, ImageProps, View, ActivityIndicator, StyleSheet } from 'react-native';
import { cdnService } from '@/app/services/cdnService';

interface CDNImageProps extends Omit<ImageProps, 'source'> {
  source: string | { uri: string };
  type?: 'profile' | 'story' | 'feed' | 'thumbnail' | 'explore';
  fallbackSource?: string;
  showLoader?: boolean;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: (error: any) => void;
}

/**
 * CDN-optimized Image component
 * 
 * Features:
 * - Auto device-optimized delivery (Tier 1/2/3)
 * - Automatic fallback to Supabase URLs
 * - Loading states
 * - Error handling
 * - Prefetching support
 */
export function CDNImage({
  source,
  type = 'feed',
  fallbackSource,
  showLoader = true,
  onLoadStart,
  onLoadEnd,
  onError,
  style,
  ...props
}: CDNImageProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  // Memoize handleImageError to prevent recreation on every render
  const handleImageError = useCallback((err: any) => {
    console.warn('CDN image failed, trying fallback:', err);
    
    if (!useFallback) {
      // Try fallback URL
      const sourceUrl = typeof source === 'string' ? source : source.uri;
      const fallback = fallbackSource || cdnService.getFallbackUrl(sourceUrl);
      setImageUrl(fallback);
      setUseFallback(true);
      setError(false);
    } else {
      setError(true);
      onError?.(err);
    }
  }, [useFallback, source, fallbackSource, onError]);

  // Memoize loadImage to prevent recreation on every render
  const loadImage = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);

      // Extract URL from source
      const sourceUrl = typeof source === 'string' ? source : source.uri;

      if (!sourceUrl) {
        setError(true);
        setLoading(false);
        return;
      }

      // Get device-optimized CDN URL
      const optimizedUrl = cdnService.getOptimizedImageUrl(sourceUrl, type);
      setImageUrl(optimizedUrl);

      // Track media access
      await cdnService.trackMediaAccess(optimizedUrl, type, false, 0);
    } catch (err) {
      console.error('Error loading CDN image:', err);
      setError(true);
      handleImageError(err);
    } finally {
      setLoading(false);
    }
  }, [source, type, handleImageError]);

  useEffect(() => {
    loadImage();
  }, [loadImage]);

  const handleLoadStart = useCallback(() => {
    setLoading(true);
    onLoadStart?.();
  }, [onLoadStart]);

  const handleLoadEnd = useCallback(() => {
    setLoading(false);
    onLoadEnd?.();
  }, [onLoadEnd]);

  if (error && !useFallback) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          {/* Empty placeholder for error state */}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {imageUrl && (
        <Image
          {...props}
          source={{ uri: imageUrl }}
          style={[styles.image, style]}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleImageError}
        />
      )}
      
      {loading && showLoader && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color="#E30052" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#0A0A0A',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1A1A1A',
  },
});