
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { searchService } from '@/app/services/searchService';

interface SearchResult {
  users: any[];
  posts: any[];
  streams: any[];
}

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult>({
    users: [],
    posts: [],
    streams: [],
  });
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'posts' | 'streams'>('all');

  // Memoize search function to prevent recreation on every render
  const performSearch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await searchService.searchAll(searchQuery);
      if (result.success) {
        setResults(result.data);
      }
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (searchQuery.length > 0) {
      const delaySearch = setTimeout(() => {
        performSearch();
      }, 300);

      return () => clearTimeout(delaySearch);
    } else {
      setResults({ users: [], posts: [], streams: [] });
    }
  }, [searchQuery, performSearch]);

  const handleUserPress = useCallback((userId: string) => {
    router.push(`/screens/UserProfileScreen?userId=${userId}`);
  }, []);

  const handlePostPress = useCallback((postId: string) => {
    router.push(`/screens/PostDetailScreen?postId=${postId}`);
  }, []);

  const handleStreamPress = useCallback((streamId: string) => {
    router.push({
      pathname: '/live-player',
      params: { streamId },
    });
  }, []);

  const renderUsers = useCallback(() => {
    const users = results.users;
    if (users.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Users</Text>
        {users.map((user, index) => (
          <TouchableOpacity
            key={user.id || `user-${index}`}
            style={styles.userCard}
            onPress={() => handleUserPress(user.id)}
            activeOpacity={0.7}
          >
            <Image
              source={{
                uri: user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
              }}
              style={styles.userAvatar}
            />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.display_name || user.username}</Text>
              <Text style={styles.userUsername}>@{user.username}</Text>
              {user.bio && <Text style={styles.userBio} numberOfLines={1}>{user.bio}</Text>}
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  }, [results.users, handleUserPress]);

  const renderPosts = useCallback(() => {
    const posts = results.posts;
    if (posts.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Posts</Text>
        <View style={styles.postsGrid}>
          {posts.map((post, index) => (
            <TouchableOpacity
              key={post.id || `post-${index}`}
              style={styles.postCard}
              onPress={() => handlePostPress(post.id)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: post.media_url }} style={styles.postImage} />
              <View style={styles.postOverlay}>
                <View style={styles.postStats}>
                  <View style={styles.postStat}>
                    <IconSymbol
                      ios_icon_name="heart.fill"
                      android_material_icon_name="favorite"
                      size={14}
                      color={colors.text}
                    />
                    <Text style={styles.postStatText}>{post.likes_count}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }, [results.posts, handlePostPress]);

  const renderStreams = useCallback(() => {
    const streams = results.streams;
    if (streams.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Live Streams</Text>
        {streams.map((stream, index) => (
          <TouchableOpacity
            key={stream.id || `stream-${index}`}
            style={styles.streamCard}
            onPress={() => handleStreamPress(stream.id)}
            activeOpacity={0.7}
          >
            <Image
              source={{
                uri:
                  stream.users?.avatar ||
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
              }}
              style={styles.streamThumbnail}
            />
            <View style={styles.streamInfo}>
              <Text style={styles.streamTitle} numberOfLines={1}>{stream.title}</Text>
              <Text style={styles.streamBroadcaster}>{stream.users?.display_name}</Text>
              <View style={styles.streamMeta}>
                <View style={styles.liveBadge}>
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
                <Text style={styles.viewerCount}>{stream.viewer_count || 0} viewers</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  }, [results.streams, handleStreamPress]);

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="arrow.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <IconSymbol
            ios_icon_name="magnifyingglass"
            android_material_icon_name="search"
            size={20}
            color={colors.textSecondary}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users, posts, streams..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="cancel"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.gradientEnd} />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : searchQuery.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="magnifyingglass"
              android_material_icon_name="search"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>Search for users, posts, or streams</Text>
            <Text style={styles.emptySubtext}>Start typing to see results</Text>
          </View>
        ) : results.users.length === 0 && results.posts.length === 0 && results.streams.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="exclamationmark.magnifyingglass"
              android_material_icon_name="search_off"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>No results found</Text>
            <Text style={styles.emptySubtext}>Try a different search term</Text>
          </View>
        ) : (
          <>
            {renderUsers()}
            {renderPosts()}
            {renderStreams()}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  section: {
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.backgroundAlt,
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  userUsername: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  userBio: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: 2,
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 18,
    gap: 4,
  },
  postCard: {
    width: '32%',
    aspectRatio: 9 / 16,
    backgroundColor: colors.card,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  postOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 8,
    justifyContent: 'flex-end',
  },
  postStats: {
    flexDirection: 'row',
    gap: 8,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postStatText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  streamCard: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  streamThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: colors.backgroundAlt,
  },
  streamInfo: {
    flex: 1,
    gap: 4,
  },
  streamTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  streamBroadcaster: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  streamMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  liveBadge: {
    backgroundColor: colors.gradientEnd,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 1,
  },
  viewerCount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});