
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/app/integrations/supabase/client';
import { colors } from '@/styles/commonStyles';
import { CDNImage } from '@/components/CDNImage';
import { useExplorePrefetch } from '@/hooks/useExplorePrefetch';
import { cdnService } from '@/app/services/cdnService';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2; // 2 columns with padding

interface ExploreItem {
  id: string;
  type: 'post' | 'story';
  mediaUrl: string;
  username: string;
  userId: string;
  avatarUrl?: string;
  caption?: string;
  createdAt: string;
}

export default function ExploreScreen() {
  const router = useRouter();
  const [items, setItems] = useState<ExploreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Use prefetch hook for instant scrolling
  const {
    prefetchNextPage,
    handleScroll: handlePrefetchScroll,
    setCurrentPage,
    clearCache,
  } = useExplorePrefetch({
    enabled: true,
    itemsPerPage: 20,
    prefetchThreshold: 0.5, // Prefetch when scrolled past 50%
  });

  const loadExploreContent = useCallback(async (pageNum: number = 0) => {
    try {
      setLoading(pageNum === 0);

      const itemsPerPage = 20;
      const start = pageNum * itemsPerPage;
      const end = start + itemsPerPage - 1;

      // Fetch posts
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

      // Fetch stories
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

      // Combine and format items
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

      // Combine and shuffle
      const allItems = [...postItems, ...storyItems].sort(
        () => Math.random() - 0.5
      );

      if (pageNum === 0) {
        setItems(allItems);
      } else {
        setItems(prev => [...prev, ...allItems]);
      }

      setPage(pageNum);
      setCurrentPage(pageNum);

      // Prefetch next page
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
    loadExploreContent();

    return () => {
      // Cleanup prefetch cache on unmount
      clearCache();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // Handle prefetch scroll
      handlePrefetchScroll(
        contentOffset.y,
        contentSize.height,
        layoutMeasurement.height
      );

      // Load more when near bottom
      const isNearBottom =
        contentOffset.y + layoutMeasurement.height >= contentSize.height - 500;

      if (isNearBottom && !loading) {
        handleLoadMore();
      }
    },
    [handlePrefetchScroll, loading, handleLoadMore]
  );

  const handleItemPress = (item: ExploreItem) => {
    if (item.type === 'post') {
      // Navigate to post detail
      router.push(`/post/${item.id}`);
    } else {
      // Navigate to story viewer
      router.push(`/story/${item.userId}`);
    }
  };

  const renderItem = (item: ExploreItem) => (
    <TouchableOpacity
      key={item.id}
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
          <Text style={styles.username} numberOfLines={1}>
            {item.username}
          </Text>
        </View>
        
        {item.type === 'story' && (
          <View style={styles.storyBadge}>
            <Text style={styles.storyBadgeText}>STORY</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
        <Text style={styles.headerSubtitle}>
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
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {items.map(renderItem)}

        {loading && page === 0 && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}
      </ScrollView>

      {/* Device tier indicator (for debugging) */}
      <View style={styles.deviceTierIndicator}>
        <Text style={styles.deviceTierText}>
          Device: {cdnService.getDeviceTier().toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
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
    color: colors.text,
    flex: 1,
  },
  storyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  storyBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.text,
  },
  loadingContainer: {
    width: '100%',
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
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
    color: colors.textSecondary,
    fontWeight: '600',
  },
});