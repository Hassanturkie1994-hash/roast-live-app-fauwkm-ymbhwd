
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import LiveBadge from '@/components/LiveBadge';
import StoriesBar from '@/components/StoriesBar';
import { IconSymbol } from '@/components/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import { Tables } from '@/app/integrations/supabase/types';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

type Stream = Tables<'streams'>;

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

type FeedSegment = 'Live' | 'Posts';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedSegment, setSelectedSegment] = useState<FeedSegment>('Live');
  const [streams, setStreams] = useState<Stream[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (selectedSegment === 'Live') {
      fetchStreams();
    } else {
      fetchPosts();
    }
  }, [selectedSegment]);

  const fetchStreams = async () => {
    try {
      const { data, error } = await supabase
        .from('streams')
        .select('*')
        .eq('status', 'live')
        .order('started_at', { ascending: false });

      if (error) {
        console.error('Error fetching streams:', error);
        return;
      }

      if (data) {
        setStreams(data);
      }
    } catch (error) {
      console.error('Error in fetchStreams:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(*)')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching posts:', error);
        return;
      }

      if (data) {
        setPosts(data as any);
      }
    } catch (error) {
      console.error('Error in fetchPosts:', error);
    }
  };

  const handleStreamPress = (streamId: string) => {
    router.push({
      pathname: '/live-player',
      params: { streamId },
    });
  };

  const handleLike = (postId: string) => {
    setLikedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const renderStream = ({ item, index }: { item: Stream; index: number }) => (
    <TouchableOpacity
      key={index}
      style={styles.streamContainer}
      activeOpacity={1}
      onPress={() => handleStreamPress(item.id)}
    >
      <View style={styles.streamPlaceholder}>
        <Text style={styles.streamPlaceholderText}>LIVE STREAM</Text>
      </View>
      <LinearGradient
        colors={['transparent', 'rgba(0, 0, 0, 0.8)']}
        style={styles.gradient}
      />

      <View style={styles.topBar}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>ROAST LIVE</Text>
        </View>
        <View style={styles.viewerContainer}>
          <IconSymbol
            ios_icon_name="eye.fill"
            android_material_icon_name="visibility"
            size={14}
            color={colors.text}
          />
          <Text style={styles.viewerCount}>{item.viewer_count || 0}</Text>
        </View>
      </View>

      <View style={styles.liveBadgeContainer}>
        <LiveBadge size="small" />
      </View>

      <View style={styles.bottomInfo}>
        <Text style={styles.streamTitle} numberOfLines={2}>
          {item.title}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderPost = ({ item, index }: { item: Post; index: number }) => (
    <TouchableOpacity
      key={index}
      style={styles.streamContainer}
      activeOpacity={1}
    >
      <Image source={{ uri: item.media_url }} style={styles.thumbnail} />
      <LinearGradient
        colors={['transparent', 'rgba(0, 0, 0, 0.8)']}
        style={styles.gradient}
      />

      <View style={styles.topBar}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>ROAST LIVE</Text>
        </View>
      </View>

      <View style={styles.rightActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLike(item.id)}
        >
          <IconSymbol
            ios_icon_name={likedPosts.has(item.id) ? 'heart.fill' : 'heart'}
            android_material_icon_name="favorite"
            size={32}
            color={likedPosts.has(item.id) ? colors.gradientEnd : colors.text}
          />
          <Text style={styles.actionText}>{formatCount(item.likes_count)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <IconSymbol
            ios_icon_name="bubble.left.fill"
            android_material_icon_name="chat_bubble"
            size={32}
            color={colors.text}
          />
          <Text style={styles.actionText}>{formatCount(item.comments_count)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <IconSymbol
            ios_icon_name="arrowshape.turn.up.right.fill"
            android_material_icon_name="share"
            size={32}
            color={colors.text}
          />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.creatorAvatarButton}>
          <Image
            source={{
              uri: item.profiles.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
            }}
            style={styles.creatorAvatar}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomInfo}>
        <Text style={styles.creatorName}>
          @{item.profiles.username}
        </Text>
        <Text style={styles.streamTitle} numberOfLines={2}>
          {item.caption}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.segmentControl}>
        {(['Live', 'Posts'] as FeedSegment[]).map((segment, index) => (
          <TouchableOpacity
            key={index}
            style={styles.segmentButton}
            onPress={() => setSelectedSegment(segment)}
          >
            <Text
              style={[
                styles.segmentText,
                selectedSegment === segment && styles.segmentTextActive,
              ]}
            >
              {segment}
            </Text>
            {selectedSegment === segment && (
              <View style={styles.segmentIndicator} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.storiesContainer}>
        <StoriesBar />
      </View>

      <FlatList
        data={selectedSegment === 'Live' ? streams : posts}
        renderItem={selectedSegment === 'Live' ? renderStream : renderPost}
        keyExtractor={(item, index) => index.toString()}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={screenHeight - 100}
        decelerationRate="fast"
        snapToAlignment="start"
        contentContainerStyle={styles.listContent}
      />
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
    backgroundColor: colors.background,
  },
  segmentControl: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    paddingHorizontal: 20,
    gap: 24,
  },
  segmentButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  segmentTextActive: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  segmentIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.text,
  },
  storiesContainer: {
    position: 'absolute',
    top: 110,
    left: 0,
    right: 0,
    zIndex: 9,
  },
  listContent: {
    paddingTop: 180,
    paddingBottom: 0,
  },
  streamContainer: {
    width: screenWidth,
    height: screenHeight - 280,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.backgroundAlt,
  },
  streamPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streamPlaceholderText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  topBar: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 5,
  },
  logoContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 2,
  },
  viewerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  viewerCount: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  liveBadgeContainer: {
    position: 'absolute',
    top: 70,
    left: 16,
  },
  rightActions: {
    position: 'absolute',
    right: 12,
    bottom: 100,
    alignItems: 'center',
    gap: 24,
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  creatorAvatarButton: {
    marginTop: 8,
  },
  creatorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.text,
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 60,
    left: 16,
    right: 80,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  streamTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 20,
  },
});