
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
} from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import RoastLiveLogo from '@/components/RoastLiveLogo';
import { useAuth } from '@/contexts/AuthContext';
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
  const [activeTab, setActiveTab] = useState<'posts' | 'liked' | 'stories'>('posts');
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

  const renderPosts = () => {
    const displayPosts = activeTab === 'posts' ? posts : likedPosts;

    if (displayPosts.length === 0) {
      return (
        <View style={styles.emptyState}>
          <IconSymbol
            ios_icon_name="photo.on.rectangle"
            android_material_icon_name="photo_library"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyText}>
            {activeTab === 'posts' ? 'No posts yet' : 'No liked posts'}
          </Text>
          {activeTab === 'posts' && (
            <TouchableOpacity style={styles.createButton} onPress={handleCreatePost}>
              <Text style={styles.createButtonText}>Create your first post</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <View style={styles.postsGrid}>
        {displayPosts.map((post, index) => (
          <TouchableOpacity
            key={index}
            style={styles.postCard}
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
                    color={colors.text}
                  />
                  <Text style={styles.postStatText}>{post.likes_count}</Text>
                </View>
                <View style={styles.postStat}>
                  <IconSymbol
                    ios_icon_name="bubble.left.fill"
                    android_material_icon_name="comment"
                    size={16}
                    color={colors.text}
                  />
                  <Text style={styles.postStatText}>{post.comments_count}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (!profile) {
    return (
      <View style={[commonStyles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoHeader}>
          <RoastLiveLogo size="small" />
          <TouchableOpacity onPress={handleSettings} style={styles.settingsButton}>
            <IconSymbol
              ios_icon_name="gearshape.fill"
              android_material_icon_name="settings"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Banner */}
        {profile.banner_url && (
          <Image source={{ uri: profile.banner_url }} style={styles.banner} />
        )}

        {/* Profile Header */}
        <View style={styles.header}>
          <Image
            source={{
              uri: profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
            }}
            style={styles.avatar}
          />
          <Text style={styles.displayName}>{profile.display_name || profile.username}</Text>
          <Text style={styles.username}>@{profile.username}</Text>

          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

          {profile.unique_profile_link && (
            <Text style={styles.profileLink}>{profile.unique_profile_link}</Text>
          )}

          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatCount(followersCount)}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatCount(followingCount)}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{posts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
          </View>

          {/* Wallet Balance - Clickable */}
          <TouchableOpacity 
            style={styles.walletCard} 
            onPress={() => router.push('/screens/WalletScreen')}
            activeOpacity={0.7}
          >
            <View style={styles.walletLeft}>
              <IconSymbol
                ios_icon_name="wallet.pass.fill"
                android_material_icon_name="account_balance_wallet"
                size={20}
                color={colors.gradientEnd}
              />
              <Text style={styles.walletLabel}>Saldo Balance</Text>
            </View>
            <View style={styles.walletRight}>
              <Text style={styles.walletAmount}>{walletBalance.toFixed(2)} SEK</Text>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron_right"
                size={16}
                color={colors.textSecondary}
              />
            </View>
          </TouchableOpacity>

          <View style={styles.buttonRow}>
            <View style={styles.buttonFlex}>
              <GradientButton title="Edit Profile" onPress={handleEditProfile} size="medium" />
            </View>
            <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
              <IconSymbol
                ios_icon_name="square.and.arrow.up"
                android_material_icon_name="share"
                size={20}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={handleCreatePost}>
              <IconSymbol
                ios_icon_name="plus.square.fill"
                android_material_icon_name="add_box"
                size={20}
                color={colors.text}
              />
              <Text style={styles.actionButtonText}>Post</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleCreateStory}>
              <IconSymbol
                ios_icon_name="plus.circle.fill"
                android_material_icon_name="add_circle"
                size={20}
                color={colors.text}
              />
              <Text style={styles.actionButtonText}>Story</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'posts' && styles.tabActive]}
            onPress={() => setActiveTab('posts')}
          >
            <IconSymbol
              ios_icon_name="square.grid.3x3.fill"
              android_material_icon_name="grid_on"
              size={20}
              color={activeTab === 'posts' ? colors.text : colors.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === 'posts' && styles.tabTextActive]}>
              POSTS
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'liked' && styles.tabActive]}
            onPress={() => setActiveTab('liked')}
          >
            <IconSymbol
              ios_icon_name="heart.fill"
              android_material_icon_name="favorite"
              size={20}
              color={activeTab === 'liked' ? colors.text : colors.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === 'liked' && styles.tabTextActive]}>
              LIKED
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'stories' && styles.tabActive]}
            onPress={() => setActiveTab('stories')}
          >
            <IconSymbol
              ios_icon_name="clock.fill"
              android_material_icon_name="history"
              size={20}
              color={activeTab === 'stories' ? colors.text : colors.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === 'stories' && styles.tabTextActive]}>
              STORIES
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {renderPosts()}
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 60,
    paddingBottom: 100,
  },
  logoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    backgroundColor: colors.backgroundAlt,
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
    backgroundColor: colors.backgroundAlt,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: colors.border,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  bio: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
  profileLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gradientEnd,
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
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
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
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.text,
  },
  walletRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gradientEnd,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.text,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.text,
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
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 16,
  },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  postCard: {
    width: (screenWidth - 6) / 3,
    aspectRatio: 9 / 16,
    backgroundColor: colors.card,
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
    color: colors.text,
  },
});