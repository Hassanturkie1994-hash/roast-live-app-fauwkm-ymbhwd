
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
import UnifiedRoastIcon from '@/components/Icons/UnifiedRoastIcon';
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
          <UnifiedRoastIcon
            name="heart"
            size={24}
            color={colors.text}
          />
          <Text style={[styles.postActionText, { color: colors.text }]}>{post.likes_count}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.postAction}>
          <UnifiedRoastIcon
            name="comment"
            size={24}
            color={colors.text}
          />
          <Text style={[styles.postActionText, { color: colors.text }]}>{post.comments_count}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.postAction}>
          <UnifiedRoastIcon
            name="send"
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
  const [savedStreams, setSavedStreams] = useState<NormalizedStream[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'explore' | 'friends' | 'foryou'>('foryou');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLiveOnly, setShowLiveOnly] = useState(false);

  // Go Live modal states
  const [showGoLiveModal, setShowGoLiveModal] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [showContentLabelModal, setShowContentLabelModal] = useState(false);
  const [contentLabel, setContentLabel] = useState<ContentLabel | null>(null);
  const [showCreatorRulesModal, setShowCreatorRulesModal] = useState(false);

  // Fetch live streams
  const fetchStreams = useCallback(async () => {
    try {
      const data = await queryCache.getCached(
        'streams_live',
        async () => {
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

          return normalizeStreams((data || []) as RawStreamData[]);
        },
        30000
      );

      setStreams(data);
    } catch (error) {
      console.error('Error in fetchStreams:', error);
    }
  }, []);

  // Fetch saved streams (ONLY streams explicitly saved by users)
  const fetchSavedStreams = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('saved_streams')
        .select(`
          *,
          streams!inner (
            *,
            users:broadcaster_id (
              id,
              display_name,
              avatar,
              verified_status
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching saved streams:', error);
        return;
      }

      // Transform saved streams to normalized format
      const normalized = (data || []).map((saved: any) => {
        const stream = saved.streams;
        return {
          id: stream.id,
          title: saved.title || stream.title,
          broadcaster: {
            id: stream.users?.id || stream.broadcaster_id,
            username: stream.users?.display_name || 'Unknown',
            avatar: stream.users?.avatar || null,
            verified: stream.users?.verified_status || false,
          },
          viewerCount: stream.viewer_count || 0,
          thumbnailUrl: saved.thumbnail_url || null,
          status: stream.status,
          startedAt: stream.started_at,
          contentLabel: stream.content_label,
        };
      });

      setSavedStreams(normalized);
    } catch (error) {
      console.error('Error in fetchSavedStreams:', error);
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
        60000
      );

      setPosts(data as any);
    } catch (error) {
      console.error('Error in fetchPosts:', error);
    }
  }, []);

  // Memoize fetch data function
  const fetchData = useCallback(async () => {
    await Promise.all([fetchStreams(), fetchSavedStreams(), fetchPosts()]);
  }, [fetchStreams, fetchSavedStreams, fetchPosts]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Memoize refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    queryCache.invalidate('streams_live');
    queryCache.invalidate('posts_feed');
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

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
      Alert.alert('Fel', 'Du måste vara inloggad för att starta streaming');
      return;
    }

    try {
      const isLocked = await enhancedContentSafetyService.isUserLockedForReview(user.id);
      if (isLocked) {
        Alert.alert('Kan inte starta stream', 'Ditt konto är under granskning. Kontakta support.');
        return;
      }

      const canStream = await enhancedContentSafetyService.canUserLivestream(user.id);
      if (!canStream.canStream) {
        Alert.alert('Kan inte starta stream', canStream.reason, [{ text: 'OK' }]);
        return;
      }

      setShowGoLiveModal(true);
    } catch (error) {
      console.error('Error in handleGoLivePress:', error);
      Alert.alert('Fel', 'Kunde inte starta live-inställning. Försök igen.');
    }
  };

  const handleTitleNext = async () => {
    if (!streamTitle.trim()) {
      Alert.alert('Titel saknas', 'Ange en streamtitel');
      return;
    }

    if (!user) {
      Alert.alert('Fel', 'Du måste vara inloggad för att starta streaming');
      return;
    }

    try {
      const validation = await contentSafetyService.validateStreamStart(user.id);
      if (!validation.canStream) {
        Alert.alert(
          'Kan inte starta stream',
          validation.reason || 'Du får inte streama just nu.',
          [{ text: 'OK' }]
        );
        setShowGoLiveModal(false);
        return;
      }

      setShowGoLiveModal(false);
      setShowContentLabelModal(true);
    } catch (error) {
      console.error('Error in handleTitleNext:', error);
      Alert.alert('Fel', 'Kunde inte validera streamstart. Försök igen.');
    }
  };

  const handleContentLabelSelected = (label: ContentLabel) => {
    setContentLabel(label);
    setShowContentLabelModal(false);
    setShowCreatorRulesModal(true);
  };

  const handleCreatorRulesConfirm = async () => {
    if (!user || !contentLabel || !streamTitle.trim()) {
      Alert.alert('Fel', 'Information saknas');
      return;
    }

    console.log('✅ [CONFIRM] User confirmed creator rules');
    console.log('📝 [CONFIRM] Stream title:', streamTitle);
    console.log('🏷️ [CONFIRM] Content label:', contentLabel);

    try {
      try {
        await enhancedContentSafetyService.logCreatorRulesAcceptance(user.id);
        console.log('✅ [CONFIRM] Creator rules acceptance logged');
      } catch (rulesError) {
        console.warn('⚠️ [CONFIRM] Failed to log creator rules (continuing anyway):', rulesError);
      }

      setShowCreatorRulesModal(false);

      console.log('🚀 [CONFIRM] Navigating to broadcaster screen...');
      router.push({
        pathname: '/(tabs)/broadcast',
        params: {
          streamTitle: streamTitle,
          contentLabel: contentLabel,
        },
      });

      setStreamTitle('');
      setContentLabel(null);

      console.log('✅ [CONFIRM] Navigation complete - stream creation will happen in broadcaster screen');
    } catch (error) {
      console.error('❌ [CONFIRM-ERROR] Error in handleCreatorRulesConfirm:', error);
      Alert.alert('Fel', 'Kunde inte starta stream. Försök igen.');
    }
  };

  // Filter content based on active tab and live filter
  const filteredContent = useMemo(() => {
    // When Live filter is active, show ONLY live streams
    if (showLiveOnly) {
      return streams.filter(s => s.status === 'live');
    }
    
    // Otherwise, show saved streams + posts (NOT all streams)
    const mixed: any[] = [];
    
    // Add saved streams
    savedStreams.forEach(stream => {
      mixed.push({ type: 'stream', data: stream });
    });
    
    // Add posts
    posts.forEach(post => {
      mixed.push({ type: 'post', data: post });
    });
    
    return mixed;
  }, [streams, savedStreams, posts, showLiveOnly]);

  // Memoize render function
  const renderItem = useCallback(({ item }: { item: any }) => {
    if (showLiveOnly || item.type === 'stream') {
      const stream = showLiveOnly ? item : item.data;
      return (
        <StreamPreviewCard
          stream={stream}
          onPress={() => handleStreamPress(stream)}
        />
      );
    } else {
      return (
        <PostItem
          post={item.data}
          onPress={handlePostPress}
          colors={colors}
        />
      );
    }
  }, [showLiveOnly, handleStreamPress, handlePostPress, colors]);

  // Memoize key extractor
  const keyExtractor = useCallback((item: any, index: number) => {
    if (showLiveOnly) {
      return item.id;
    }
    return `${item.type}-${item.data.id}-${index}`;
  }, [showLiveOnly]);

  // Memoize header component
  const ListHeaderComponent = useMemo(() => <StoriesBar />, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Logo and Search */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <AppLogo size="small" alignment="center" withShadow />
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

      {/* Search Bar */}
      {showSearch && (
        <View style={[styles.searchBar, { backgroundColor: colors.backgroundAlt, borderBottomColor: colors.border }]}>
          <UnifiedRoastIcon
            name="search"
            size={20}
            color={colors.textSecondary}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Sök profiler, live-streams, inlägg..."
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

      {/* Tabs with Live Filter Button */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'explore' && { borderBottomColor: colors.brandPrimary }]}
          onPress={() => setActiveTab('explore')}
        >
          <Text style={[styles.tabButtonText, { color: activeTab === 'explore' ? colors.brandPrimary : colors.textSecondary }]}>
            Utforska
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'friends' && { borderBottomColor: colors.brandPrimary }]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabButtonText, { color: activeTab === 'friends' ? colors.brandPrimary : colors.textSecondary }]}>
            Följer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'foryou' && { borderBottomColor: colors.brandPrimary }]}
          onPress={() => setActiveTab('foryou')}
        >
          <Text style={[styles.tabButtonText, { color: activeTab === 'foryou' ? colors.brandPrimary : colors.textSecondary }]}>
            För dig
          </Text>
        </TouchableOpacity>

        {/* Live Filter Button - Now acts as a filter */}
        <TouchableOpacity
          style={[
            styles.liveButton,
            showLiveOnly && { backgroundColor: colors.brandPrimary }
          ]}
          onPress={() => setShowLiveOnly(!showLiveOnly)}
          activeOpacity={0.7}
        >
          <View style={[styles.liveDot, !showLiveOnly && { backgroundColor: '#FF0000' }]} />
          <Text style={[styles.liveButtonText, { color: showLiveOnly ? '#FFFFFF' : colors.text }]}>
            LIVE
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredContent}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
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

      {/* Go Live Title Modal */}
      <Modal visible={showGoLiveModal} transparent animationType="slide">
        <View style={styles.modal}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <AppLogo size="medium" alignment="center" style={styles.modalLogo} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Konfigurera din stream</Text>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Streamtitel</Text>
              <TextInput
                placeholder="Vad streamar du?"
                placeholderTextColor={colors.textSecondary}
                value={streamTitle}
                onChangeText={setStreamTitle}
                style={[styles.input, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, color: colors.text }]}
                maxLength={100}
                autoFocus
              />
            </View>

            <View style={styles.infoBox}>
              <UnifiedRoastIcon
                name="fire-info"
                size={20}
                color={colors.gradientEnd}
              />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Din stream kommer att sändas live till alla tittare. Se till att du har en stabil internetanslutning!
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
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Avbryt</Text>
              </TouchableOpacity>
              <View style={styles.startButtonContainer}>
                <GradientButton
                  title="NÄSTA"
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
    position: 'relative',
  },
  searchButton: {
    position: 'absolute',
    right: 16,
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
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    alignItems: 'center',
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
  liveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  liveButtonText: {
    fontSize: 12,
    fontWeight: '800',
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
