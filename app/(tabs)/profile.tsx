
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react';
import { router } from 'expo-router';
import UnifiedRoastIcon from '@/components/Icons/UnifiedRoastIcon';
import GradientButton from '@/components/GradientButton';
import AppLogo from '@/components/AppLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/app/integrations/supabase/client';

const { width: screenWidth } = Dimensions.get('window');

interface Post {
  id: string;
  media_url: string;
  caption: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'replays' | 'posts' | 'stories'>('replays');
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);

  const fetchUserData = useCallback(async () => {
    if (!user) return;

    try {
      const [postsData, likedData, profileData, walletData] = await Promise.all([
        supabase
          .from('posts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .then(res => ({ data: res.data || [], error: res.error })),
        supabase
          .from('post_likes')
          .select('post_id, posts(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .then(res => ({ data: res.data || [], error: res.error })),
        supabase
          .from('profiles')
          .select('followers_count, following_count')
          .eq('id', user.id)
          .single()
          .then(res => ({ data: res.data, error: res.error })),
        supabase
          .from('wallet')
          .select('balance')
          .eq('user_id', user.id)
          .single()
          .then(res => ({ data: res.data, error: res.error })),
      ]);

      if (postsData.data) setPosts(postsData.data);
      if (likedData.data) {
        const liked = likedData.data.map((item: any) => item.posts).filter(Boolean);
        setLikedPosts(liked);
      }
      if (profileData.data) {
        setFollowersCount(profileData.data.followers_count || 0);
        setFollowingCount(profileData.data.following_count || 0);
      }
      if (walletData.data) {
        setWalletBalance(parseFloat(walletData.data.balance) || 0);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, [user]);

  useEffect(() => {
    let mounted = true;

    if (!user) {
      router.replace('/auth/login');
    } else if (mounted) {
      fetchUserData();
    }

    return () => {
      mounted = false;
    };
  }, [user, fetchUserData]);

  const handleEditProfile = () => {
    router.push('/screens/EditProfileScreen');
  };

  const handleSettings = () => {
    router.push('/screens/AccountSettingsScreen');
  };

  const handleShare = () => {
    const profileLink = profile?.unique_profile_link || `roastlive.com/@${profile?.username}`;
    Alert.alert('Share Profile', profileLink);
  };

  const handleCreatePost = () => {
    router.push('/screens/CreatePostScreen');
  };

  const handleCreateStory = () => {
    router.push('/screens/CreateStoryScreen');
  };

  const handleSavedStreams = () => {
    router.push('/screens/SavedStreamsScreen');
  };

  const handleArchivedStreams = () => {
    router.push('/screens/ArchivedStreamsScreen');
  };

  const renderContent = () => {
    if (activeTab === 'replays') {
      return (
        <View style={styles.emptyState}>
          <UnifiedRoastIcon
            name="video"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: colors.text }]}>Inga live-repriser än</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Dina tidigare livestreams kommer att visas här
          </Text>
          <TouchableOpacity style={[styles.viewAllButton, { backgroundColor: colors.brandPrimary }]} onPress={handleArchivedStreams}>
            <Text style={styles.viewAllButtonText}>Visa streamhistorik</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (activeTab === 'posts') {
      if (posts.length === 0) {
        return (
          <View style={styles.emptyState}>
            <UnifiedRoastIcon
              name="burned-photo"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: colors.text }]}>Inga inlägg än</Text>
            <TouchableOpacity 
              style={[styles.createButton, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]} 
              onPress={handleCreatePost}
            >
              <Text style={[styles.createButtonText, { color: colors.text }]}>Skapa ditt första inlägg</Text>
            </TouchableOpacity>
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
                    <UnifiedRoastIcon
                      name="heart"
                      size={16}
                      color="#FFFFFF"
                    />
                    <Text style={styles.postStatText}>{post.likes_count}</Text>
                  </View>
                  <View style={styles.postStat}>
                    <UnifiedRoastIcon
                      name="comment"
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

    // Stories tab
    return (
      <View style={styles.emptyState}>
        <UnifiedRoastIcon
          name="hot-circle"
          size={48}
          color={colors.textSecondary}
        />
        <Text style={[styles.emptyText, { color: colors.text }]}>Inga story-höjdpunkter</Text>
        <TouchableOpacity 
          style={[styles.createButton, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]} 
          onPress={handleCreateStory}
        >
          <Text style={[styles.createButtonText, { color: colors.text }]}>Skapa en story</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (!profile) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Laddar profil...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Fixed Header with Logo and Settings */}
        <View style={[styles.fixedHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft} />
            <AppLogo size="small" alignment="center" />
            <TouchableOpacity onPress={handleSettings} style={styles.settingsButton}>
              <UnifiedRoastIcon
                name="heated-gear"
                size={28}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Banner */}
        {profile.banner_url && (
          <Image source={{ uri: profile.banner_url }} style={[styles.banner, { backgroundColor: colors.backgroundAlt }]} />
        )}

        {/* Profile Header */}
        <View style={styles.header}>
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
              <Text style={[styles.statValue, { color: colors.text }]}>{formatCount(followersCount)}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Följare</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.text }]}>{formatCount(followingCount)}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Följer</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.text }]}>{posts.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Inlägg</Text>
            </View>
          </View>

          {/* Wallet Balance - Clickable */}
          <TouchableOpacity 
            style={[styles.walletCard, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]} 
            onPress={() => router.push('/screens/WalletScreen')}
            activeOpacity={0.7}
          >
            <View style={styles.walletLeft}>
              <UnifiedRoastIcon name="lava-wallet" size={24} />
              <Text style={[styles.walletLabel, { color: colors.text }]}>Saldo</Text>
            </View>
            <View style={styles.walletRight}>
              <Text style={[styles.walletAmount, { color: colors.brandPrimary }]}>{walletBalance.toFixed(2)} SEK</Text>
              <UnifiedRoastIcon
                name="chevron-right"
                size={16}
                color={colors.textSecondary}
              />
            </View>
          </TouchableOpacity>

          {/* Saved Streams Link */}
          <TouchableOpacity 
            style={[styles.savedStreamsCard, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]} 
            onPress={handleSavedStreams}
            activeOpacity={0.7}
          >
            <View style={styles.savedStreamsLeft}>
              <UnifiedRoastIcon name="video" size={24} />
              <Text style={[styles.savedStreamsLabel, { color: colors.text }]}>Sparade streams</Text>
            </View>
            <UnifiedRoastIcon
              name="chevron-right"
              size={16}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {/* Archived Streams Link */}
          <TouchableOpacity 
            style={[styles.savedStreamsCard, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]} 
            onPress={handleArchivedStreams}
            activeOpacity={0.7}
          >
            <View style={styles.savedStreamsLeft}>
              <UnifiedRoastIcon name="history" size={24} />
              <Text style={[styles.savedStreamsLabel, { color: colors.text }]}>Streamhistorik</Text>
            </View>
            <UnifiedRoastIcon
              name="chevron-right"
              size={16}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <View style={styles.buttonRow}>
            <View style={styles.buttonFlex}>
              <GradientButton title="Redigera profil" onPress={handleEditProfile} size="medium" />
            </View>
            <TouchableOpacity 
              style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]} 
              onPress={handleShare}
            >
              <UnifiedRoastIcon
                name="share"
                size={20}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]} 
              onPress={handleCreatePost}
            >
              <UnifiedRoastIcon name="burned-photo" size={24} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Inlägg</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]} 
              onPress={handleCreateStory}
            >
              <UnifiedRoastIcon name="hot-circle" size={24} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Story</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'replays' && { borderBottomColor: colors.brandPrimary }]}
            onPress={() => setActiveTab('replays')}
          >
            <UnifiedRoastIcon
              name="video"
              size={20}
              color={activeTab === 'replays' ? colors.brandPrimary : colors.textSecondary}
            />
            <Text style={[styles.tabText, { color: activeTab === 'replays' ? colors.brandPrimary : colors.textSecondary }]}>
              LIVE
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'posts' && { borderBottomColor: colors.brandPrimary }]}
            onPress={() => setActiveTab('posts')}
          >
            <UnifiedRoastIcon
              name="burned-photo"
              size={20}
              color={activeTab === 'posts' ? colors.brandPrimary : colors.textSecondary}
            />
            <Text style={[styles.tabText, { color: activeTab === 'posts' ? colors.brandPrimary : colors.textSecondary }]}>
              INLÄGG
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'stories' && { borderBottomColor: colors.brandPrimary }]}
            onPress={() => setActiveTab('stories')}
          >
            <UnifiedRoastIcon
              name="hot-circle"
              size={20}
              color={activeTab === 'stories' ? colors.brandPrimary : colors.textSecondary}
            />
            <Text style={[styles.tabText, { color: activeTab === 'stories' ? colors.brandPrimary : colors.textSecondary }]}>
              STORIES
            </Text>
          </TouchableOpacity>
        </View>

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
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 60,
    paddingBottom: 100,
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingTop: 48,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerLeft: {
    width: 40,
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    width: '100%',
    height: 150,
    marginTop: 60,
  },
  header: {
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
    marginBottom: 16,
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
  actionButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 16,
    width: '100%',
  },
  walletLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  walletRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  savedStreamsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    width: '100%',
  },
  savedStreamsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  savedStreamsLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
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
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  viewAllButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  viewAllButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
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
});
