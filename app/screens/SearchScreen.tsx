
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { searchService } from '@/app/services/searchService';
import { followService } from '@/app/services/followService';
import { useAuth } from '@/contexts/AuthContext';

interface SearchUserResult {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export default function SearchScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<SearchUserResult[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const performSearch = useCallback(async (query: string) => {
    if (!query || query.trim().length === 0) {
      setUsers([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await searchService.searchUsers(query);
      
      if (result.success) {
        setUsers(result.data as SearchUserResult[]);

        if (user) {
          const followingStatuses: Record<string, boolean> = {};
          for (const searchUser of result.data) {
            try {
              const isFollowing = await followService.isFollowing(user.id, searchUser.id);
              followingStatuses[searchUser.id] = isFollowing;
            } catch (followError) {
              console.error('Error checking follow status:', followError);
              followingStatuses[searchUser.id] = false;
            }
          }
          setFollowingMap(followingStatuses);
        }
      } else {
        setError('Failed to search users. Please try again.');
        setUsers([]);
      }
    } catch (error) {
      console.error('Error performing search:', error);
      setError('An error occurred while searching. Please try again.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (searchQuery.length > 0) {
      debounceTimerRef.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 300);
    } else {
      setUsers([]);
      setError(null);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, performSearch]);

  const handleUserPress = useCallback((userId: string) => {
    if (!userId) {
      console.error('Invalid user ID');
      return;
    }

    try {
      console.log('Navigating to profile:', userId);
      router.push({
        pathname: '/screens/PublicProfileScreen',
        params: { userId },
      });
    } catch (error) {
      console.error('Error navigating to profile:', error);
    }
  }, []);

  const handleFollowToggle = useCallback(async (userId: string) => {
    if (!user) return;

    const isCurrentlyFollowing = followingMap[userId];

    try {
      if (isCurrentlyFollowing) {
        const result = await followService.unfollowUser(user.id, userId);
        if (result.success) {
          setFollowingMap(prev => ({ ...prev, [userId]: false }));
        }
      } else {
        const result = await followService.followUser(user.id, userId);
        if (result.success) {
          setFollowingMap(prev => ({ ...prev, [userId]: true }));
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  }, [user, followingMap]);

  const renderUsers = useCallback(() => {
    if (users.length === 0) return null;

    return (
      <View style={styles.section}>
        {users.map((searchUser) => {
          const isFollowing = followingMap[searchUser.id];
          const isCurrentUser = user?.id === searchUser.id;

          return (
            <TouchableOpacity
              key={`user-${searchUser.id}`}
              style={[styles.userCard, { backgroundColor: colors.card }]}
              onPress={() => handleUserPress(searchUser.id)}
              activeOpacity={0.7}
            >
              <Image
                source={{
                  uri: searchUser.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
                }}
                style={styles.userAvatar}
              />
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: colors.text }]}>
                  {searchUser.display_name || searchUser.username}
                </Text>
                <Text style={[styles.userUsername, { color: colors.textSecondary }]}>
                  @{searchUser.username}
                </Text>
                {searchUser.bio && (
                  <Text style={[styles.userBio, { color: colors.textSecondary }]} numberOfLines={1}>
                    {searchUser.bio}
                  </Text>
                )}
              </View>
              {!isCurrentUser && (
                <TouchableOpacity
                  style={[
                    styles.followButton,
                    isFollowing
                      ? { backgroundColor: colors.backgroundAlt, borderColor: colors.border }
                      : { backgroundColor: colors.brandPrimary },
                  ]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleFollowToggle(searchUser.id);
                  }}
                >
                  <Text
                    style={[
                      styles.followButtonText,
                      { color: isFollowing ? colors.text : '#FFFFFF' },
                    ]}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }, [users, followingMap, user, colors, handleUserPress, handleFollowToggle]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="arrow.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <View style={[styles.searchContainer, { backgroundColor: colors.backgroundAlt }]}>
          <IconSymbol
            ios_icon_name="magnifyingglass"
            android_material_icon_name="search"
            size={20}
            color={colors.textSecondary}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search users..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
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
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.brandPrimary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Searching...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle"
              android_material_icon_name="error"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: colors.text }]}>Search Error</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              {error}
            </Text>
          </View>
        ) : searchQuery.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="magnifyingglass"
              android_material_icon_name="search"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: colors.text }]}>Search for users</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Find and follow other users on Roast Live
            </Text>
          </View>
        ) : users.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="exclamationmark.magnifyingglass"
              android_material_icon_name="search_off"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: colors.text }]}>No users found</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Try a different search term
            </Text>
          </View>
        ) : (
          renderUsers()
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
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
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
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
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 8,
    textAlign: 'center',
  },
  section: {
    paddingVertical: 16,
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
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
  },
  userUsername: {
    fontSize: 14,
    fontWeight: '400',
  },
  userBio: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
  },
  followButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
