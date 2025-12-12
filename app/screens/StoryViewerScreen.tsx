
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { storyService } from '@/app/services/storyService';
import { supabase } from '@/app/integrations/supabase/client';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  created_at: string;
  expires_at: string;
  views_count: number;
  likes_count: number;
  profile: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export default function StoryViewerScreen() {
  const { storyId } = useLocalSearchParams<{ storyId: string }>();
  const { user } = useAuth();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);

  const fetchStory = useCallback(async () => {
    if (!storyId) return;

    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*, profile:profiles(username, display_name, avatar_url)')
        .eq('id', storyId)
        .single();

      if (error) {
        console.error('Error fetching story:', error);
        Alert.alert('Error', 'Story not found');
        router.back();
        return;
      }

      setStory(data as any);
      setViewerCount(data.views_count || 0);

      // Mark as viewed
      if (user) {
        await storyService.viewStory(user.id, storyId);
      }

      // Check if user has liked
      if (user) {
        const { data: likeData } = await supabase
          .from('story_likes')
          .select('*')
          .eq('user_id', user.id)
          .eq('story_id', storyId)
          .single();

        setLiked(!!likeData);
      }
    } catch (error) {
      console.error('Error in fetchStory:', error);
    } finally {
      setLoading(false);
    }
  }, [storyId, user]);

  useEffect(() => {
    fetchStory();
  }, [fetchStory]);

  const handleLike = async () => {
    if (!user || !story) {
      Alert.alert('Login Required', 'Please login to like stories');
      return;
    }

    try {
      if (liked) {
        await storyService.unlikeStory(user.id, story.id);
        setLiked(false);
        setStory((prev) => prev ? { ...prev, likes_count: prev.likes_count - 1 } : null);
      } else {
        await storyService.likeStory(user.id, story.id);
        setLiked(true);
        setStory((prev) => prev ? { ...prev, likes_count: prev.likes_count + 1 } : null);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('Error', 'Failed to update like status');
    }
  };

  const handleDelete = async () => {
    if (!user || !story || story.user_id !== user.id) return;

    Alert.alert(
      'Delete Story',
      'Are you sure you want to delete this story?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await storyService.deleteStory(user.id, story.id);
            if (result.success) {
              Alert.alert('Success', 'Story deleted');
              router.back();
            } else {
              Alert.alert('Error', 'Failed to delete story');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.gradientEnd} />
      </View>
    );
  }

  if (!story) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Story not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: story.media_url }} style={styles.storyImage} resizeMode="cover" />

      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <View style={styles.userInfo}>
            <Image
              source={{
                uri: story.profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
              }}
              style={styles.avatar}
            />
            <View style={styles.userTextContainer}>
              <Text style={styles.username}>{story.profile.display_name || story.profile.username}</Text>
              <Text style={styles.timestamp}>
                {new Date(story.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>

          <View style={styles.topActions}>
            {user?.id === story.user_id && (
              <TouchableOpacity onPress={handleDelete} style={styles.iconButton}>
                <IconSymbol
                  ios_icon_name="trash.fill"
                  android_material_icon_name="delete"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomBar}>
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <IconSymbol
                ios_icon_name="eye.fill"
                android_material_icon_name="visibility"
                size={20}
                color={colors.text}
              />
              <Text style={styles.statText}>{viewerCount}</Text>
            </View>
            <View style={styles.stat}>
              <IconSymbol
                ios_icon_name="heart.fill"
                android_material_icon_name="favorite"
                size={20}
                color={liked ? colors.gradientEnd : colors.text}
              />
              <Text style={styles.statText}>{story.likes_count}</Text>
            </View>
          </View>

          {user && user.id !== story.user_id && (
            <TouchableOpacity onPress={handleLike} style={styles.likeButton}>
              <IconSymbol
                ios_icon_name={liked ? 'heart.fill' : 'heart'}
                android_material_icon_name={liked ? 'favorite' : 'favorite_border'}
                size={32}
                color={liked ? colors.gradientEnd : colors.text}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyImage: {
    width: screenWidth,
    height: screenHeight,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.gradientEnd,
  },
  userTextContainer: {
    gap: 2,
  },
  username: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  topActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  likeButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: colors.gradientEnd,
    borderRadius: 25,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
});