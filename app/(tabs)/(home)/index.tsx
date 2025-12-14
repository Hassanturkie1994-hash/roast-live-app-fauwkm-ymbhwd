
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
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import StreamPreviewCard from '@/components/StreamPreviewCard';
import StoriesBar from '@/components/StoriesBar';
import AppLogo from '@/components/AppLogo';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import ContentLabelModal, { ContentLabel } from '@/components/ContentLabelModal';
import CreatorRulesModal from '@/components/CreatorRulesModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import { queryCache } from '@/app/services/queryCache';
import { normalizeStreams, NormalizedStream, RawStreamData } from '@/utils/streamNormalizer';
import { enhancedContentSafetyService } from '@/app/services/enhancedContentSafetyService';
import { contentSafetyService } from '@/app/services/contentSafetyService';

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

  // Go Live modal states
  const [showGoLiveModal, setShowGoLiveModal] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [showContentLabelModal, setShowContentLabelModal] = useState(false);
  const [contentLabel, setContentLabel] = useState<ContentLabel | null>(null);
  const [showCreatorRulesModal, setShowCreatorRulesModal] = useState(false);

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

  // Go Live handlers
  const handleGoLivePress = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to start streaming');
      return;
    }

    try {
      // Check if user is under forced review lock
      const isLocked = await enhancedContentSafetyService.isUserLockedForReview(user.id);
      if (isLocked) {
        Alert.alert('Cannot Start Stream', 'Your account is under review. Please contact support.');
        return;
      }

      // Check if user has accepted safety guidelines
      const canStream = await enhancedContentSafetyService.canUserLivestream(user.id);
      if (!canStream.canStream) {
        Alert.alert('Cannot Start Stream', canStream.reason, [{ text: 'OK' }]);
        return;
      }

      setShowGoLiveModal(true);
    } catch (error) {
      console.error('Error in handleGoLivePress:', error);
      Alert.alert('Error', 'Failed to start live setup. Please try again.');
    }
  };

  const handleTitleNext = async () => {
    if (!streamTitle.trim()) {
      Alert.alert('Missing title', 'Please enter a stream title');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to start streaming');
      return;
    }

    try {
      // Validate stream start (check for suspensions and strikes)
      const validation = await contentSafetyService.validateStreamStart(user.id);
      if (!validation.canStream) {
        Alert.alert(
          'Cannot Start Stream',
          validation.reason || 'You are not allowed to stream at this time.',
          [{ text: 'OK' }]
        );
        setShowGoLiveModal(false);
        return;
      }

      // Close title modal and show content label modal
      setShowGoLiveModal(false);
      setShowContentLabelModal(true);
    } catch (error) {
      console.error('Error in handleTitleNext:', error);
      Alert.alert('Error', 'Failed to validate stream start. Please try again.');
    }
  };

  const handleContentLabelSelected = (label: ContentLabel) => {
    setContentLabel(label);
    setShowContentLabelModal(false);
    // Show creator rules modal
    setShowCreatorRulesModal(true);
  };

  const handleCreatorRulesConfirm = async () => {
    if (!user || !contentLabel || !streamTitle.trim()) {
      Alert.alert('Error', 'Missing required information');
      return;
    }

    console.log('✅ [CONFIRM] User confirmed creator rules');
    console.log('📝 [CONFIRM] Stream title:', streamTitle);
    console.log('🏷️ [CONFIRM] Content label:', contentLabel);

    try {
      // Log creator rules acceptance (non-blocking)
      try {
        await enhancedContentSafetyService.logCreatorRulesAcceptance(user.id);
        console.log('✅ [CONFIRM] Creator rules acceptance logged');
      } catch (rulesError) {
        console.warn('⚠️ [CONFIRM] Failed to log creator rules (continuing anyway):', rulesError);
      }

      // Close modal
      setShowCreatorRulesModal(false);

      // CRITICAL: Navigate IMMEDIATELY to broadcaster screen
      // Pass title and content label as params
      console.log('🚀 [CONFIRM] Navigating to broadcaster screen...');
      router.push({
        pathname: '/(tabs)/broadcaster',
        params: {
          streamTitle: streamTitle,
          contentLabel: contentLabel,
        },
      });

      // Reset state
      setStreamTitle('');
      setContentLabel(null);

      console.log('✅ [CONFIRM] Navigation complete - stream creation will happen in broadcaster screen');
    } catch (error) {
      console.error('❌ [CONFIRM-ERROR] Error in handleCreatorRulesConfirm:', error);
      Alert.alert('Error', 'Failed to start stream. Please try again.');
    }
  };

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
      {/* Header with Logo - Go Live button removed */}
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

      {/* Go Live Title Modal */}
      <Modal visible={showGoLiveModal} transparent animationType="slide">
        <View style={styles.modal}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <AppLogo size="medium" alignment="center" style={styles.modalLogo} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Setup Your Stream</Text>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Stream Title</Text>
              <TextInput
                placeholder="What are you streaming?"
                placeholderTextColor={colors.textSecondary}
                value={streamTitle}
                onChangeText={setStreamTitle}
                style={[styles.input, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, color: colors.text }]}
                maxLength={100}
                autoFocus
              />
            </View>

            <View style={styles.infoBox}>
              <IconSymbol
                ios_icon_name="info.circle.fill"
                android_material_icon_name="info"
                size={20}
                color={colors.gradientEnd}
              />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Your stream will be broadcast live to all viewers. Make sure you have a stable internet connection!
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}
                onPress={() => {
                  setShowGoLiveModal(false);
                  setStreamTitle('');
                }}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <View style={styles.startButtonContainer}>
                <GradientButton
                  title="NEXT"
                  onPress={handleTitleNext}
                  disabled={!streamTitle.trim()}
                  size="medium"
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Content Label Modal */}
      <ContentLabelModal
        visible={showContentLabelModal}
        onSelect={handleContentLabelSelected}
        onCancel={() => {
          setShowContentLabelModal(false);
          setShowGoLiveModal(true);
        }}
      />

      {/* Creator Rules Modal */}
      <CreatorRulesModal
        visible={showCreatorRulesModal}
        onConfirm={handleCreatorRulesConfirm}
        onCancel={() => {
          setShowCreatorRulesModal(false);
          setShowGoLiveModal(true);
        }}
        isLoading={false}
      />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  modal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
  },
  modalLogo: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderColor: '#A40028',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  startButtonContainer: {
    flex: 1,
  },
});
