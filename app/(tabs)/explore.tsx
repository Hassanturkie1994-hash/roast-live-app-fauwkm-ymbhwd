
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
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/app/integrations/supabase/client';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import AppLogo from '@/components/AppLogo';
import { CDNImage } from '@/components/CDNImage';
import { useExplorePrefetch } from '@/hooks/useExplorePrefetch';
import { cdnService } from '@/app/services/cdnService';
import { fetchLiveStreams } from '@/app/services/streamService';
import { NormalizedStream } from '@/utils/streamNormalizer';
import UnifiedRoastIcon from '@/components/Icons/UnifiedRoastIcon';
import StoriesBar from '@/components/StoriesBar';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2;

interface FriendContent {
  id: string;
  type: 'post' | 'story' | 'stream' | 'reel';
  mediaUrl: string;
  username: string;
  userId: string;
  avatarUrl?: string;
  caption?: string;
  createdAt: string;
  viewerCount?: number;
  isLive?: boolean;
}

export default function FriendsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [items, setItems] = useState<FriendContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
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

  const loadFriendsContent = useCallback(async (pageNum: number = 0) => {
    if (!user) return;

    try {
      setLoading(pageNum === 0);

      const itemsPerPage = 20;
      const start = pageNum * itemsPerPage;
      const end = start + itemsPerPage - 1;

      // Get user's following list
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const followingIds = following?.map(f => f.following_id) || [];

      if (followingIds.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      // Fetch friends' live streams
      const liveStreams = await fetchLiveStreams();
      const friendStreams = liveStreams.filter(stream => 
        followingIds.includes(stream.user.id)
      );

      // Fetch friends' posts
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
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .range(start, end);

      // Fetch friends' stories
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
        .in('user_id', followingIds)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .range(start, end);

      const streamItems: FriendContent[] = friendStreams.map(stream => ({
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

      const postItems: FriendContent[] = (posts || []).map(post => ({
        id: post.id,
        type: 'post' as const,
        mediaUrl: post.media_url,
        username: (post.profiles as any)?.username || 'Unknown',
        userId: (post.profiles as any)?.id || '',
        avatarUrl: (post.profiles as any)?.avatar_url,
        caption: post.caption,
        createdAt: post.created_at,
      }));

      const storyItems: FriendContent[] = (stories || []).map(story => ({
        id: story.id,
        type: 'story' as const,
        mediaUrl: story.media_url,
        username: (story.profiles as any)?.username || 'Unknown',
        userId: (story.profiles as any)?.id || '',
        avatarUrl: (story.profiles as any)?.avatar_url,
        createdAt: story.created_at,
      }));

      const allItems = [...streamItems, ...postItems, ...storyItems].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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
      console.error('Error loading friends content:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, prefetchNextPage, setCurrentPage]);

  useEffect(() => {
    let mounted = true;

    if (mounted && user) {
      loadFriendsContent();
    }

    return () => {
      mounted = false;
      clearCache();
    };
  }, [user, loadFriendsContent, clearCache]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    clearCache();
    loadFriendsContent(0);
  }, [clearCache, loadFriendsContent]);

  const handleLoadMore = useCallback(() => {
    if (!loading) {
      loadFriendsContent(page + 1);
    }
  }, [loading, page, loadFriendsContent]);

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

  const handleItemPress = useCallback((item: FriendContent) => {
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

  const filteredItems = searchQuery.trim() 
    ? items.filter(item => 
        item.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.caption?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items;

  const renderItem = useCallback((item: FriendContent, index: number) => (
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

        {item.type === 'reel' && (
          <View style={[styles.reelBadge, { backgroundColor: '#8B00FF' }]}>
            <UnifiedRoastIcon name="video" size={12} color="#FFFFFF" />
            <Text style={styles.reelBadgeText}>REEL</Text>
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
                <UnifiedRoastIcon
                  name="people"
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

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <AppLogo size="small" alignment="center" />
        </View>
        <View style={styles.emptyState}>
          <UnifiedRoastIcon name="people" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.text }]}>Logga in för att se vänners innehåll</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <AppLogo size="small" alignment="center" />
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => setShowSearch(!showSearch)}
        >
          <UnifiedRoastIcon
            name="search"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      {showSearch && (
        <View style={[styles.searchBar, { backgroundColor: colors.backgroundAlt, borderBottomColor: colors.border }]}>
          <UnifiedRoastIcon
            name="search"
            size={20}
            color={colors.textSecondary}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Sök bland följda profiler..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <UnifiedRoastIcon
                name="close"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      )}

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Innehåll från personer du följer
      </Text>

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
        ListHeaderComponent={<StoriesBar />}
      >
        {filteredItems.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <UnifiedRoastIcon name="people" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.text }]}>
              {searchQuery ? 'Inga resultat' : 'Följ personer för att se deras innehåll här'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity 
                style={[styles.exploreButton, { backgroundColor: colors.brandPrimary }]}
                onPress={() => router.push('/(tabs)/(home)/')}
              >
                <Text style={styles.exploreButtonText}>Utforska</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredItems.map((item, index) => renderItem(item, index))
        )}

        {loading && page === 0 && (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Laddar...</Text>
          </View>
        )}
      </ScrollView>
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  searchButton: {
    position: 'absolute',
    right: 20,
    top: 60,
    padding: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
  },
  subtitle: {
    fontSize: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
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
  reelBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  reelBadgeText: {
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
  emptyState: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  exploreButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 8,
  },
  exploreButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
