
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { replayService, StreamReplay } from '@/app/services/replayService';
import { IconSymbol } from '@/components/IconSymbol';

interface ReplaysTabScreenProps {
  creatorId: string;
}

export default function ReplaysTabScreen({ creatorId }: ReplaysTabScreenProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [replays, setReplays] = useState<StreamReplay[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadReplays = useCallback(async () => {
    setLoading(true);
    try {
      const data = await replayService.getCreatorReplays(creatorId);
      setReplays(data);
    } catch (error) {
      console.error('Error loading replays:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [creatorId]);

  useEffect(() => {
    loadReplays();
  }, [loadReplays]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadReplays();
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderReplay = ({ item }: { item: StreamReplay }) => (
    <TouchableOpacity
      style={styles.replayCard}
      onPress={() => router.push(`/replay-player?replayId=${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.thumbnailContainer}>
        {item.thumbnail_url ? (
          <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnail} />
        ) : (
          <View style={styles.placeholderThumbnail}>
            <IconSymbol
              ios_icon_name="play.circle.fill"
              android_material_icon_name="play_circle_filled"
              size={48}
              color={colors.textSecondary}
            />
          </View>
        )}
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{formatDuration(item.total_duration_seconds)}</Text>
        </View>
      </View>

      <View style={styles.replayInfo}>
        <Text style={styles.replayTitle} numberOfLines={2}>
          {item.title}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <IconSymbol
              ios_icon_name="eye"
              android_material_icon_name="visibility"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.statText}>{item.views_count}</Text>
          </View>

          <View style={styles.statItem}>
            <IconSymbol
              ios_icon_name="heart"
              android_material_icon_name="favorite"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.statText}>{item.likes_count}</Text>
          </View>

          <View style={styles.statItem}>
            <IconSymbol
              ios_icon_name="bubble.left"
              android_material_icon_name="comment"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.statText}>{item.comments_count}</Text>
          </View>
        </View>

        <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (replays.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <IconSymbol
          ios_icon_name="video.slash"
          android_material_icon_name="videocam_off"
          size={64}
          color={colors.textSecondary}
        />
        <Text style={styles.emptyTitle}>No Replays Yet</Text>
        <Text style={styles.emptyDescription}>
          Saved livestream replays will appear here
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={replays}
        renderItem={renderReplay}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  replayCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumbnailContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.background,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderThumbnail: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  replayInfo: {
    padding: 12,
  },
  replayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
