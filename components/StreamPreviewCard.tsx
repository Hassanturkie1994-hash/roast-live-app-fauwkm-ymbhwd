
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import LiveBadge from '@/components/LiveBadge';
import PremiumBadge from '@/components/PremiumBadge';
import { NormalizedStream } from '@/utils/streamNormalizer';

interface StreamPreviewCardProps {
  stream: NormalizedStream | null | undefined;
  onPress: () => void;
}

export default function StreamPreviewCard({ stream, onPress }: StreamPreviewCardProps) {
  // CRITICAL: Guard against undefined/null stream
  if (!stream) {
    console.warn('⚠️ StreamPreviewCard: stream is null/undefined');
    return null;
  }

  // CRITICAL: Guard against undefined/null stream.user
  if (!stream.user) {
    console.warn('⚠️ StreamPreviewCard: stream.user is null/undefined for stream:', stream.id);
    return null;
  }

  // Extract safe values with fallbacks
  const thumbnailUrl = stream.thumbnail_url || 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400&h=600&fit=crop';
  const title = stream.title || 'Untitled Stream';
  const viewerCount = stream.viewer_count ?? 0;
  const isLive = stream.is_live ?? false;
  const broadcasterId = stream.broadcaster_id || stream.user.id;
  
  // Safe user data extraction
  const userAvatar = stream.user.avatar || null;
  const displayName = stream.user.display_name || stream.user.username || 'Unknown';
  const verifiedStatus = stream.user.verified_status ?? false;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ uri: thumbnailUrl }}
          style={styles.thumbnail}
          resizeMode="cover"
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
              <IconSymbol
                ios_icon_name="checkmark.seal.fill"
                android_material_icon_name="verified"
                size={14}
                color={colors.brandPrimary}
              />
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
});
