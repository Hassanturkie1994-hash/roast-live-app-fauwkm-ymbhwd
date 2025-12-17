
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import GlobalLeaderboard from '@/components/GlobalLeaderboard';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/app/integrations/supabase/client';
import { followService } from '@/app/services/followService';
import { privateMessagingService } from '@/app/services/privateMessagingService';

const { width: screenWidth } = Dimensions.get('window');

interface ProfileData {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  banner_url: string | null;
  unique_profile_link: string | null;
  followers_count: number;
  following_count: number;
  total_streaming_hours: number;
}

interface Post {
  id: string;
  media_url: string;
  caption: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

interface SavedStream {
  id: string;
  title: string;
  thumbnail_url: string | null;
  duration: number;
  views_count: number;
  created_at: string;
}

export default function PublicProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'streams' | 'stories' | 'supporters'>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedStreams, setSavedStreams] = useState<SavedStream[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const fetchProfileData = useCallback(async () => {
    if (!userId) return;

    try {
      const [profileData, postsData, streamsData, followData] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single(),
        supabase
          .from('posts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(12),
        supabase
          .from('saved_streams')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(12),
        user
          ? supabase
              .from('followers')
              .select('id')
              .eq('follower_id', user.id)
              .eq('following_id', userId)
              .single()
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (profileData.data) {
        setProfile(profileData.data);
      }
      if (postsData.data) {
        setPosts(postsData.data);
      }
      if (streamsData.data) {
        setSavedStreams(streamsData.data);
      }
      if (followData.data) {
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, user]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleFollow = async () => {
    if (!user || !userId) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await followService.unfollowUser(user.id, userId);
        setIsFollowing(false);
      } else {
        await followService.followUser(user.id, userId);
        setIsFollowing(true);
      }
      fetchProfileData();
    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert('Error', 'Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMessage = async () => {
    if (!user || !userId) return;

    try {
      // Get or create conversation
      const conversation = await privateMessagingService.getOrCreateConversation(user.id, userId);
      
      if (conversation) {
        router.push({
          pathname: '/screens/ChatScreen',
          params: {
            conversationId: conversation.id,
            otherUserId: userId,
            otherUserName: profile?.display_name || profile?.username || 'User',
          },
        });
      } else {
        Alert.alert('Error', 'Failed to start conversation');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      Alert.alert('Error', 'Failed to start conversation');
    }
  };

  const renderContent = () => {
    if (activeTab === 'posts') {
      if (posts.length === 0) {
        return (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="photo.on.rectangle"
              android_material_icon_name="photo_library"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: colors.text }]}>No posts yet</Text>
          </View>
        );
      }

      return (
        <View style={styles.postsGrid}>
          {posts.map((post, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.postCard, { backgroundColor: colors.card }]}
              activeOpacity={0.8}
            >
              <Image source={{ uri: post.media_url }} style={styles.postImage} />
              <View style={styles.postOverlay}>
                <View style={styles.postStats}>
                  <View style={styles.postStat}>
                    <IconSymbol
                      ios_icon_name="heart.fill"
                      android_material_icon_name="favorite"
                      size={16}
                      color="#FFFFFF"
                    />
                    <Text style={styles.postStatText}>{post.likes_count}</Text>
                  </View>
                  <View style={styles.postStat}>
                    <IconSymbol
                      ios_icon_name="bubble.left.fill"
                      android_material_icon_name="comment"
                      size={16}
                      color="#FFFFFF"
                    />
                    <Text style={styles.postStatText}>{post.comments_count}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    if (activeTab === 'streams') {
      if (savedStreams.length === 0) {
        return (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="video.fill"
              android_material_icon_name="videocam"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: colors.text }]}>No saved streams</Text>
          </View>
        );
      }

      return (
        <View style={styles.streamsList}>
          {savedStreams.map((stream, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.streamCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.8}
            >
              <Image
                source={{
                  uri: stream.thumbnail_url || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400',
                }}
                style={styles.streamThumbnail}
              />
              <View style={styles.streamInfo}>
                <Text style={[styles.streamTitle, { color: colors.text }]} numberOfLines={2}>
                  {stream.title}
                </Text>
                <View style={styles.streamMeta}>
                  <View style={styles.streamMetaItem}>
                    <IconSymbol
                      ios_icon_name="eye.fill"
                      android_material_icon_name="visibility"
                      size={14}
                      color={colors.textSecondary}
                    />
                    <Text style={[styles.streamMetaText, { color: colors.textSecondary }]}>
                      {stream.views_count} views
                    </Text>
                  </View>
                  <View style={styles.streamMetaItem}>
                    <IconSymbol
                      ios_icon_name="clock.fill"
                      android_material_icon_name="schedule"
                      size={14}
                      color={colors.textSecondary}
                    />
                    <Text style={[styles.streamMetaText, { color: colors.textSecondary }]}>
                      {Math.floor(stream.duration / 60)}m
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    if (activeTab === 'supporters') {
      return (
        <View style={styles.supportersContainer}>
          <GlobalLeaderboard creatorId={userId || ''} type="weekly" limit={10} />
          <GlobalLeaderboard creatorId={userId || ''} type="alltime" limit={10} />
        </View>
      );
    }

    // Stories tab
    return (
      <View style={styles.emptyState}>
        <IconSymbol
          ios_icon_name="clock.fill"
          android_material_icon_name="history"
          size={48}
          color={colors.textSecondary}
        />
        <Text style={[styles.emptyText, { color: colors.text }]}>No story highlights</Text>
      </View>
    );
  };

  if (loading || !profile) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>@{profile.username}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        {profile.banner_url && (
          <Image source={{ uri: profile.banner_url }} style={[styles.banner, { backgroundColor: colors.backgroundAlt }]} />
        )}

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image
            source={{
              uri: profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
            }}
            style={[styles.avatar, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}
          />
          <Text style={[styles.displayName, { color: colors.text }]}>{profile.display_name || profile.username}</Text>
          <Text style={[styles.username, { color: colors.textSecondary }]}>@{profile.username}</Text>

          {profile.bio && <Text style={[styles.bio, { color: colors.text }]}>{profile.bio}</Text>}

          {profile.unique_profile_link && (
            <Text style={[styles.profileLink, { color: colors.brandPrimary }]}>{profile.unique_profile_link}</Text>
          )}

          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.text }]}>{formatCount(profile.followers_count || 0)}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Followers</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.text }]}>{formatCount(profile.following_count || 0)}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Following</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.text }]}>{posts.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Posts</Text>
            </View>
          </View>

          {/* Action Buttons */}
          {user && user.id !== userId && (
            <View style={styles.buttonRow}>
              <View style={styles.buttonFlex}>
                <GradientButton
                  title={isFollowing ? 'Following' : 'Follow'}
                  onPress={handleFollow}
                  size="medium"
                  disabled={followLoading}
                />
              </View>
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={handleMessage}
              >
                <IconSymbol
                  ios_icon_name="message.fill"
                  android_material_icon_name="message"
                  size={20}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'posts' && { borderBottomColor: colors.brandPrimary }]}
            onPress={() => setActiveTab('posts')}
          >
            <IconSymbol
              ios_icon_name="square.grid.3x3.fill"
              android_material_icon_name="grid_on"
              size={20}
              color={activeTab === 'posts' ? colors.brandPrimary : colors.textSecondary}
            />
            <Text style={[styles.tabText, { color: activeTab === 'posts' ? colors.brandPrimary : colors.textSecondary }]}>
              POSTS
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'streams' && { borderBottomColor: colors.brandPrimary }]}
            onPress={() => setActiveTab('streams')}
          >
            <IconSymbol
              ios_icon_name="video.fill"
              android_material_icon_name="videocam"
              size={20}
              color={activeTab === 'streams' ? colors.brandPrimary : colors.textSecondary}
            />
            <Text style={[styles.tabText, { color: activeTab === 'streams' ? colors.brandPrimary : colors.textSecondary }]}>
              STREAMS
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'supporters' && { borderBottomColor: colors.brandPrimary }]}
            onPress={() => setActiveTab('supporters')}
          >
            <IconSymbol
              ios_icon_name="star.fill"
              android_material_icon_name="star"
              size={20}
              color={activeTab === 'supporters' ? colors.brandPrimary : colors.textSecondary}
            />
            <Text style={[styles.tabText, { color: activeTab === 'supporters' ? colors.brandPrimary : colors.textSecondary }]}>
              SUPPORTERS
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'stories' && { borderBottomColor: colors.brandPrimary }]}
            onPress={() => setActiveTab('stories')}
          >
            <IconSymbol
              ios_icon_name="clock.fill"
              android_material_icon_name="history"
              size={20}
              color={activeTab === 'stories' ? colors.brandPrimary : colors.textSecondary}
            />
            <Text style={[styles.tabText, { color: activeTab === 'stories' ? colors.brandPrimary : colors.textSecondary }]}>
              STORIES
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Content */}
        {renderContent()}
      </ScrollView>
    </View>
  );
}

function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  banner: {
    width: '100%',
    height: 150,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 3,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  bio: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
  profileLink: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stat: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '400',
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  buttonFlex: {
    flex: 1,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 2,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 1,
    gap: 2,
  },
  postCard: {
    width: (screenWidth - 6) / 3,
    aspectRatio: 9 / 16,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  postOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 8,
    justifyContent: 'flex-end',
  },
  postStats: {
    flexDirection: 'row',
    gap: 12,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postStatText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  streamsList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  streamCard: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  streamThumbnail: {
    width: 120,
    height: 90,
  },
  streamInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  streamTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  streamMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  streamMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streamMetaText: {
    fontSize: 12,
    fontWeight: '400',
  },
  supportersContainer: {
    paddingHorizontal: 20,
  },
  emptyState: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
  },
});
