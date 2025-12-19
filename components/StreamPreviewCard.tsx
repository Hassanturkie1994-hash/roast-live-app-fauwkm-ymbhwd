
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import LiveBadge from '@/components/LiveBadge';
import PremiumBadge from '@/components/PremiumBadge';
import VerifiedBadge from '@/components/VerifiedBadge';
import { NormalizedStream } from '@/utils/streamNormalizer';

interface StreamPreviewCardProps {
  stream: NormalizedStream | null | undefined;
  onPress: () => void;
}

/**
 * StreamPreviewCard - Fully Defensive Component
 * 
 * STABILITY FIXES APPLIED:
 * - Multiple layers of null/undefined checks
 * - Safe fallbacks for all data access
 * - No assumptions about data shape
 * - Graceful degradation when data is missing
 * - Console warnings for debugging
 * 
 * NEW: Shows verified badge on live streams
 */
export default function StreamPreviewCard({ stream, onPress }: StreamPreviewCardProps) {
  // CRITICAL LAYER 1: Guard against null/undefined stream
  if (!stream) {
    console.warn('⚠️ [StreamPreviewCard] stream is null/undefined - rendering nothing');
    return null;
  }

  // CRITICAL LAYER 2: Validate stream has required ID
  if (!stream.id) {
    console.warn('⚠️ [StreamPreviewCard] stream.id is missing - rendering nothing');
    return null;
  }

  // CRITICAL LAYER 3: Guard against null/undefined stream.user
  if (!stream.user) {
    console.warn('⚠️ [StreamPreviewCard] stream.user is null/undefined for stream:', stream.id);
    return null;
  }

  // CRITICAL LAYER 4: Validate user has required ID
  if (!stream.user.id) {
    console.warn('⚠️ [StreamPreviewCard] stream.user.id is missing for stream:', stream.id);
    return null;
  }

  // DEFENSIVE: Extract safe values with multiple fallback layers
  const thumbnailUrl = stream.thumbnail_url || 
                       stream.playback_url || 
                       'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400&h=600&fit=crop';
  
  const title = stream.title || 'Untitled Stream';
  const viewerCount = typeof stream.viewer_count === 'number' ? stream.viewer_count : 0;
  const isLive = stream.is_live === true || stream.status === 'live';
  const broadcasterId = stream.broadcaster_id || stream.user.id || '';
  
  // DEFENSIVE: Safe user data extraction with multiple fallbacks
  const userAvatar = stream.user.avatar || 
                     stream.user.avatar_url || 
                     null;
  
  const displayName = stream.user.display_name || 
                      stream.user.username || 
                      'Unknown';
  
  const verifiedStatus = stream.user.verified_status === true;

  // DEFENSIVE: Validate onPress is a function
  const handlePress = () => {
    if (typeof onPress === 'function') {
      try {
        onPress();
      } catch (error) {
        console.error('❌ [StreamPreviewCard] Error in onPress handler:', error);
      }
    } else {
      console.warn('⚠️ [StreamPreviewCard] onPress is not a function');
    }
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={handlePress} 
      activeOpacity={0.8}
    >
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ uri: thumbnailUrl }}
          style={styles.thumbnail}
          resizeMode="cover"
          onError={(error) => {
            console.warn('⚠️ [StreamPreviewCard] Image load error:', error.nativeEvent.error);
          }}
        />
        <View style={styles.overlay}>
          <View style={styles.topRow}>
            {isLive && <LiveBadge size="small" />}
            <View style={styles.viewerBadge}>
              <IconSymbol
                ios_icon_name="eye.fill"
                android_material_icon_name="visibility"
                size={12}
                color="#FFFFFF"
              />
              <Text style={styles.viewerCount}>{viewerCount}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.avatarContainer}>
          {userAvatar ? (
            <Image
              source={{ uri: userAvatar }}
              style={styles.avatar}
              resizeMode="cover"
              onError={(error) => {
                console.warn('⚠️ [StreamPreviewCard] Avatar load error:', error.nativeEvent.error);
              }}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <IconSymbol
                ios_icon_name="person.fill"
                android_material_icon_name="person"
                size={20}
                color={colors.textSecondary}
              />
            </View>
          )}
        </View>

        <View style={styles.textInfo}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <View style={styles.broadcasterRow}>
            <Text style={styles.broadcasterName} numberOfLines={1}>
              {displayName}
            </Text>
            {verifiedStatus && (
              <View style={styles.verifiedBadgeContainer}>
                <VerifiedBadge size="small" showText={false} />
              </View>
            )}
            {broadcasterId && <PremiumBadge userId={broadcasterId} size="small" />}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnailContainer: {
    width: '100%',
    aspectRatio: 9 / 16,
    backgroundColor: colors.backgroundAlt,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  viewerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  viewerCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  info: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  avatarContainer: {
    width: 40,
    height: 40,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.brandPrimary,
  },
  avatarPlaceholder: {
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInfo: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 18,
  },
  broadcasterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  broadcasterName: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  verifiedBadgeContainer: {
    marginLeft: 2,
  },
});
