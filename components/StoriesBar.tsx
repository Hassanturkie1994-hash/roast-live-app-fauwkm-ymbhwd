
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';

interface StoryProfile {
  username: string;
  display_name: string;
  avatar_url: string | null;
}

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  expires_at: string;
  created_at: string;
  profile: StoryProfile;
}

export default function StoriesBar() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [stories, setStories] = useState<Story[]>([]);
  const [userHasStory, setUserHasStory] = useState(false);

  const fetchStories = useCallback(async () => {
    if (!user) return;

    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          profile:profiles(username, display_name, avatar_url)
        `)
        .gt('expires_at', now)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching stories:', error);
        return;
      }

      if (data) {
        // Group stories by user, keep only the most recent per user
        const uniqueStories = data.reduce((acc: Story[], story: any) => {
          if (!acc.find((s) => s.user_id === story.user_id)) {
            acc.push(story);
          }
          return acc;
        }, []);

        // Check if current user has a story
        const hasUserStory = uniqueStories.some((s) => s.user_id === user.id);
        setUserHasStory(hasUserStory);

        // Filter out current user's story from the list
        const otherStories = uniqueStories.filter((s) => s.user_id !== user.id);
        setStories(otherStories);
      }
    } catch (error) {
      console.error('Error in fetchStories:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchStories();

    // Refresh stories every 30 seconds
    const interval = setInterval(fetchStories, 30000);
    return () => clearInterval(interval);
  }, [fetchStories]);

  const handleCreateStory = () => {
    router.push('/screens/CreateStoryScreen');
  };

  const handleViewStory = (story: Story) => {
    router.push({
      pathname: '/screens/StoryViewerScreen',
      params: { storyId: story.id },
    });
  };

  const handleViewOwnStory = async () => {
    if (!user) return;

    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', user.id)
        .gt('expires_at', now)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        console.error('Error fetching own story:', error);
        return;
      }

      router.push({
        pathname: '/screens/StoryViewerScreen',
        params: { storyId: data.id },
      });
    } catch (error) {
      console.error('Error in handleViewOwnStory:', error);
    }
  };

  if (!user) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Your Story */}
        <TouchableOpacity
          key="your-story"
          style={styles.storyItem}
          onPress={userHasStory ? handleViewOwnStory : handleCreateStory}
        >
          {userHasStory ? (
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.storyAvatarGradient}
            >
              <View style={[styles.storyAvatarInner, { backgroundColor: colors.background }]}>
                <Image
                  source={{
                    uri: user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
                  }}
                  style={styles.storyAvatar}
                />
              </View>
            </LinearGradient>
          ) : (
            <View style={[styles.addStoryContainer, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
              <View style={[styles.addStoryButton, { backgroundColor: colors.card }]}>
                <IconSymbol
                  ios_icon_name="plus"
                  android_material_icon_name="add"
                  size={24}
                  color={colors.text}
                />
              </View>
            </View>
          )}
          <Text style={[styles.storyUsername, { color: colors.text }]}>
            {userHasStory ? 'Your Story' : 'Add Story'}
          </Text>
        </TouchableOpacity>

        {/* Other Users' Stories */}
        {stories.map((story) => (
          <TouchableOpacity
            key={`story-${story.id}`}
            style={styles.storyItem}
            onPress={() => handleViewStory(story)}
          >
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.storyAvatarGradient}
            >
              <View style={[styles.storyAvatarInner, { backgroundColor: colors.background }]}>
                <Image
                  source={{
                    uri: story.profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
                  }}
                  style={styles.storyAvatar}
                />
              </View>
            </LinearGradient>
            <Text style={[styles.storyUsername, { color: colors.text }]} numberOfLines={1}>
              {story.profile.display_name || story.profile.username}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  storyItem: {
    alignItems: 'center',
    width: 70,
  },
  addStoryContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  addStoryButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAvatarGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 3,
    marginBottom: 4,
  },
  storyAvatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 29,
    padding: 2,
  },
  storyAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 27,
  },
  storyUsername: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
