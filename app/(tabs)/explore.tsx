
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/contexts/ThemeContext';
import AppLogo from '@/components/AppLogo';
import { CDNImage } from '@/components/CDNImage';
import { useExplorePrefetch } from '@/hooks/useExplorePrefetch';
import { cdnService } from '@/app/services/cdnService';
import { fetchLiveStreams } from '@/app/services/streamService';
import { NormalizedStream } from '@/utils/streamNormalizer';
import { IconSymbol } from '@/components/IconSymbol';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2;

interface ExploreItem {
  id: string;
  type: 'post' | 'story' | 'stream';
  mediaUrl: string;
  username: string;
  userId: string;
  avatarUrl?: string;
  caption?: string;
  createdAt: string;
  viewerCount?: number;
  isLive?: boolean;
}

export default function ExploreScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [items, setItems] = useState<ExploreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const {
    prefetchNextPage,
    handleScroll: handlePrefetchScroll,
    setCurrentPage,
    clearCache,
  } = useExplorePrefetch({
    enabled: true,
    itemsPerPage: 20,
    prefetchThreshold: 0.5,
  });

  const loadExploreContent = useCallback(async (pageNum: number = 0) => {
    try {
      setLoading(pageNum === 0);

      const itemsPerPage = 20;
      const start = pageNum * itemsPerPage;
      const end = start + itemsPerPage - 1;

      const liveStreams = await fetchLiveStreams();

      const { data: posts } = await supabase
        .from('posts')
        .select(`
          id,
          media_url,
          caption,
          created_at,
          profiles:user_id (
            id,
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .range(start, end);

      const { data: stories } = await supabase
        .from('stories')
        .select(`
          id,
          media_url,
          created_at,
          profiles:user_id (
            id,
            username,
            avatar_url
          )
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .range(start, end);

      const streamItems: ExploreItem[] = liveStreams.map(stream => ({
        id: stream.id,
        type: 'stream' as const,
        mediaUrl: stream.thumbnail_url,
        username: stream.user.username,
        userId: stream.user.id,
        avatarUrl: stream.user.avatar,
        caption: stream.title,
        createdAt: stream.start_time,
        viewerCount: stream.viewer_count,
        isLive: stream.is_live,
      }));

      const postItems: ExploreItem[] = (posts || []).map(post => ({
        id: post.id,
        type: 'post' as const,
        mediaUrl: post.media_url,
        username: (post.profiles as any)?.username || 'Unknown',
        userId: (post.profiles as any)?.id || '',
        avatarUrl: (post.profiles as any)?.avatar_url,
        caption: post.caption,
        createdAt: post.created_at,
      }));

      const storyItems: ExploreItem[] = (stories || []).map(story => ({
        id: story.id,
        type: 'story' as const,
        mediaUrl: story.media_url,
        username: (story.profiles as any)?.username || 'Unknown',
        userId: (story.profiles as any)?.id || '',
        avatarUrl: (story.profiles as any)?.avatar_url,
        createdAt: story.created_at,
      }));

      const allItems = [...streamItems, ...postItems, ...storyItems].sort(
        () => Math.random() - 0.5
      );

      if (pageNum === 0) {
        setItems(allItems);
      } else {
        setItems(prev => [...prev, ...allItems]);
      }

      setPage(pageNum);
      setCurrentPage(pageNum);

      if (allItems.length > 0) {
        await prefetchNextPage(pageNum);
      }
    } catch (error) {
      console.error('Error loading explore content:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [prefetchNextPage, setCurrentPage]);

  useEffect(() => {
    let mounted = true;

    if (mounted) {
      loadExploreContent();
    }

    return () => {
      mounted = false;
      clearCache();
    };
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    clearCache();
    loadExploreContent(0);
  }, [clearCache, loadExploreContent]);

  const handleLoadMore = useCallback(() => {
    if (!loading) {
      loadExploreContent(page + 1);
    }
  }, [loading, page, loadExploreContent]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;

      handlePrefetchScroll(
        contentOffset.y,
        contentSize.height,
        layoutMeasurement.height
      );

      const isNearBottom =
        contentOffset.y + layoutMeasurement.height >= contentSize.height - 500;

      if (isNearBottom && !loading) {
        handleLoadMore();
      }
    },
    [handlePrefetchScroll, loading, handleLoadMore]
  );

  const handleItemPress = useCallback((item: ExploreItem) => {
    if (item.type === 'stream') {
      router.push({
        pathname: '/live-player',
        params: { streamId: item.id },
      });
    } else if (item.type === 'post') {
      router.push(`/post/${item.id}`);
    } else {
      router.push(`/story/${item.userId}`);
    }
  }, [router]);

  const renderItem = useCallback((item: ExploreItem, index: number) => (
    <TouchableOpacity
      key={`${item.type}-${item.id}-${index}`}
      style={styles.item}
      onPress={() => handleItemPress(item)}
      activeOpacity={0.8}
    >
      <CDNImage
        source={item.mediaUrl}
        type="explore"
        style={styles.itemImage}
        showLoader={true}
      />
      
      <View style={styles.itemOverlay}>
        <View style={styles.itemInfo}>
          {item.avatarUrl && (
            <CDNImage
              source={item.avatarUrl}
              type="profile"
              style={styles.avatar}
            />
          )}
          <Text style={[styles.username, { color: colors.text }]} numberOfLines={1}>
            {item.username}
          </Text>
        </View>
        
        {item.type === 'story' && (
          <View style={[styles.storyBadge, { backgroundColor: colors.brandPrimary || '#A40028' }]}>
            <Text style={styles.storyBadgeText}>STORY</Text>
          </View>
        )}

        {item.type === 'stream' && item.isLive && (
          <View style={styles.liveBadgeContainer}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
            {item.viewerCount !== undefined && (
              <View style={styles.viewerBadge}>
                <IconSymbol
                  ios_icon_name="eye.fill"
                  android_material_icon_name="visibility"
                  size={12}
                  color="#FFFFFF"
                />
                <Text style={styles.viewerCount}>{item.viewerCount}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  ), [colors, handleItemPress]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <AppLogo size="small" alignment="left" />
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Discover trending content
        </Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.brandPrimary || '#A40028'}
            colors={[colors.brandPrimary || '#A40028']}
          />
        }
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {items.map((item, index) => renderItem(item, index))}

        {loading && page === 0 && (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.deviceTierIndicator}>
        <Text style={[styles.deviceTierText, { color: colors.textSecondary }]}>
          Device: {cdnService.getDeviceTier().toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    paddingBottom: 100,
  },
  item: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * 1.5,
    margin: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'space-between',
    padding: 12,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  username: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  storyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  storyBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  liveBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF0000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  viewerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  viewerCount: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    width: '100%',
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
  },
  deviceTierIndicator: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deviceTierText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
