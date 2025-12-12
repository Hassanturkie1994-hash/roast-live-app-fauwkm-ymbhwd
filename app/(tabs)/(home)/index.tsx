
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import StreamPreviewCard from '@/components/StreamPreviewCard';
import StoriesBar from '@/components/StoriesBar';
import AppLogo from '@/components/AppLogo';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import { queryCache } from '@/app/services/queryCache';
import { normalizeStreams, NormalizedStream, RawStreamData } from '@/utils/streamNormalizer';

interface Post {
  id: string;
  user_id: string;
  media_url: string;
  caption: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

const { width: screenWidth } = Dimensions.get('window');

// Memoized post component
const PostItem = React.memo(({ 
  post, 
  onPress,
  colors 
}: { 
  post: Post; 
  onPress: (post: Post) => void;
  colors: any;
}) => {
  const handlePress = useCallback(() => {
    onPress(post);
  }, [post, onPress]);

  return (
    <TouchableOpacity
      style={[styles.postContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]}
      onPress={handlePress}
      activeOpacity={0.95}
    >
      <View style={styles.postHeader}>
        <Image
          source={{
            uri: post.profiles.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
          }}
          style={[styles.postAvatar, { backgroundColor: colors.backgroundAlt }]}
        />
        <View style={styles.postHeaderText}>
          <Text style={[styles.postDisplayName, { color: colors.text }]}>
            {post.profiles.display_name || post.profiles.username}
          </Text>
          <Text style={[styles.postUsername, { color: colors.textSecondary }]}>@{post.profiles.username}</Text>
        </View>
      </View>

      <Image source={{ uri: post.media_url }} style={[styles.postImage, { backgroundColor: colors.backgroundAlt }]} />

      <View style={styles.postActions}>
        <TouchableOpacity style={styles.postAction}>
          <IconSymbol
            ios_icon_name="heart"
            android_material_icon_name="favorite_border"
            size={24}
            color={colors.text}
          />
          <Text style={[styles.postActionText, { color: colors.text }]}>{post.likes_count}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.postAction}>
          <IconSymbol
            ios_icon_name="bubble.left"
            android_material_icon_name="comment"
            size={24}
            color={colors.text}
          />
          <Text style={[styles.postActionText, { color: colors.text }]}>{post.comments_count}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.postAction}>
          <IconSymbol
            ios_icon_name="paperplane"
            android_material_icon_name="send"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      {post.caption && (
        <View style={styles.postCaption}>
          <Text style={[styles.postCaptionUsername, { color: colors.text }]}>@{post.profiles.username}</Text>
          <Text style={[styles.postCaptionText, { color: colors.text }]}> {post.caption}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

PostItem.displayName = 'PostItem';

export default function HomeScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [streams, setStreams] = useState<NormalizedStream[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'posts'>('live');

  // Memoize fetch streams function
  const fetchStreams = useCallback(async () => {
    try {
      const data = await queryCache.getCached(
        'streams_live',
        async () => {
          // Query with user join to get profile data
          const { data, error } = await supabase
            .from('streams')
            .select(`
              *,
              users:broadcaster_id (
                id,
                display_name,
                avatar,
                verified_status
              )
            `)
            .eq('status', 'live')
            .order('started_at', { ascending: false });

          if (error) {
            console.error('Error fetching streams:', error);
            return [];
          }

          // Normalize streams to ensure consistent data shape
          return normalizeStreams((data || []) as RawStreamData[]);
        },
        30000 // 30 seconds cache for live streams
      );

      setStreams(data);
    } catch (error) {
      console.error('Error in fetchStreams:', error);
    }
  }, []);

  // Memoize fetch posts function
  const fetchPosts = useCallback(async () => {
    try {
      const data = await queryCache.getCached(
        'posts_feed',
        async () => {
          const { data, error } = await supabase
            .from('posts')
            .select('*, profiles(*)')
            .order('created_at', { ascending: false })
            .limit(20);

          if (error) {
            console.error('Error fetching posts:', error);
            return [];
          }

          return data || [];
        },
        60000 // 1 minute cache for posts
      );

      setPosts(data as any);
    } catch (error) {
      console.error('Error in fetchPosts:', error);
    }
  }, []);

  // Memoize fetch data function
  const fetchData = useCallback(async () => {
    if (activeTab === 'live') {
      await fetchStreams();
    } else {
      await fetchPosts();
    }
  }, [activeTab, fetchStreams, fetchPosts]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Memoize refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    
    // Invalidate cache
    if (activeTab === 'live') {
      queryCache.invalidate('streams_live');
    } else {
      queryCache.invalidate('posts_feed');
    }
    
    await fetchData();
    setRefreshing(false);
  }, [activeTab, fetchData]);

  // Memoize stream press handler
  const handleStreamPress = useCallback((stream: NormalizedStream) => {
    router.push({
      pathname: '/live-player',
      params: { streamId: stream.id },
    });
  }, []);

  // Memoize post press handler
  const handlePostPress = useCallback((post: Post) => {
    console.log('Post pressed:', post.id);
  }, []);

  // Memoize stream render function
  const renderStream = useCallback(({ item }: { item: NormalizedStream }) => (
    <StreamPreviewCard
      stream={item}
      onPress={() => handleStreamPress(item)}
    />
  ), [handleStreamPress]);

  // Memoize post render function
  const renderPost = useCallback(({ item }: { item: Post }) => (
    <PostItem
      post={item}
      onPress={handlePostPress}
      colors={colors}
    />
  ), [handlePostPress, colors]);

  // Memoize key extractors
  const streamKeyExtractor = useCallback((item: NormalizedStream) => item.id, []);
  const postKeyExtractor = useCallback((item: Post) => item.id, []);

  // Memoize tab change handlers
  const handleLiveTab = useCallback(() => {
    setActiveTab('live');
  }, []);

  const handlePostsTab = useCallback(() => {
    setActiveTab('posts');
  }, []);

  // Memoize header component
  const ListHeaderComponent = useMemo(() => <StoriesBar />, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Logo */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <AppLogo size="small" alignment="center" withShadow />
      </View>

      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'live' && { borderBottomColor: colors.brandPrimary }]}
          onPress={handleLiveTab}
        >
          <IconSymbol
            ios_icon_name="video.fill"
            android_material_icon_name="videocam"
            size={20}
            color={activeTab === 'live' ? colors.brandPrimary : colors.textSecondary}
          />
          <Text style={[styles.tabButtonText, { color: activeTab === 'live' ? colors.brandPrimary : colors.textSecondary }]}>
            LIVE
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'posts' && { borderBottomColor: colors.brandPrimary }]}
          onPress={handlePostsTab}
        >
          <IconSymbol
            ios_icon_name="square.grid.2x2.fill"
            android_material_icon_name="grid_view"
            size={20}
            color={activeTab === 'posts' ? colors.brandPrimary : colors.textSecondary}
          />
          <Text style={[styles.tabButtonText, { color: activeTab === 'posts' ? colors.brandPrimary : colors.textSecondary }]}>
            POSTS
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'live' ? (
        <FlatList
          data={streams}
          keyExtractor={streamKeyExtractor}
          renderItem={renderStream}
          ListHeaderComponent={ListHeaderComponent}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.brandPrimary}
            />
          }
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          updateCellsBatchingPeriod={50}
          initialNumToRender={5}
          windowSize={5}
        />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={postKeyExtractor}
          renderItem={renderPost}
          ListHeaderComponent={ListHeaderComponent}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.brandPrimary}
            />
          }
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          updateCellsBatchingPeriod={50}
          initialNumToRender={5}
          windowSize={5}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 100,
  },
  postContainer: {
    marginBottom: 16,
    borderBottomWidth: 1,
    paddingBottom: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  postHeaderText: {
    flex: 1,
  },
  postDisplayName: {
    fontSize: 14,
    fontWeight: '700',
  },
  postUsername: {
    fontSize: 12,
    fontWeight: '400',
  },
  postImage: {
    width: screenWidth,
    aspectRatio: 9 / 16,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 16,
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  postCaption: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  postCaptionUsername: {
    fontSize: 14,
    fontWeight: '700',
  },
  postCaptionText: {
    fontSize: 14,
    fontWeight: '400',
    flex: 1,
  },
});
