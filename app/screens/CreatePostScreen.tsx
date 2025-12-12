
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import { cdnService } from '@/app/services/cdnService';

export default function CreatePostScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [caption, setCaption] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
      videoMaxDuration: 60,
    });

    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
      setMediaType(result.assets[0].type === 'video' ? 'video' : 'image');
    }
  };

  const handlePost = async () => {
    if (!user || !mediaUri) {
      Alert.alert('Error', 'Please select media to post');
      return;
    }

    setLoading(true);

    try {
      // Upload media using CDN service
      const response = await fetch(mediaUri);
      const blob = await response.blob();

      const uploadResult = await cdnService.uploadPostMedia(user.id, blob);

      if (!uploadResult.success || !uploadResult.cdnUrl) {
        Alert.alert('Error', uploadResult.error || 'Failed to upload media');
        setLoading(false);
        return;
      }

      // Create post with CDN URL
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        media_url: uploadResult.cdnUrl,
        caption: caption,
        likes_count: 0,
        comments_count: 0,
      });

      if (error) {
        console.error('Error creating post:', error);
        Alert.alert('Error', 'Failed to create post');
        setLoading(false);
        return;
      }

      Alert.alert('Success', 'Post created successfully');
      router.back();
    } catch (error) {
      console.error('Error in handlePost:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="xmark"
            android_material_icon_name="close"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {mediaUri ? (
          <View style={styles.mediaContainer}>
            <Image source={{ uri: mediaUri }} style={styles.media} />
            <TouchableOpacity style={styles.changeMediaButton} onPress={pickMedia}>
              <IconSymbol
                ios_icon_name="photo"
                android_material_icon_name="photo_library"
                size={20}
                color={colors.text}
              />
              <Text style={styles.changeMediaText}>Change Media</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadContainer} onPress={pickMedia}>
            <IconSymbol
              ios_icon_name="plus.circle.fill"
              android_material_icon_name="add_circle"
              size={64}
              color={colors.gradientEnd}
            />
            <Text style={styles.uploadText}>Tap to select photo or video</Text>
            <Text style={styles.uploadSubtext}>Max 60 seconds for videos</Text>
          </TouchableOpacity>
        )}

        <View style={styles.captionContainer}>
          <TextInput
            style={styles.captionInput}
            placeholder="Write a caption..."
            placeholderTextColor={colors.placeholder}
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={2200}
          />
          <Text style={styles.captionCount}>{caption.length}/2200</Text>
        </View>

        <View style={styles.buttonContainer}>
          <GradientButton
            title={loading ? 'POSTING...' : 'POST'}
            onPress={handlePost}
            disabled={loading || !mediaUri}
          />
        </View>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.gradientEnd} />
          <Text style={styles.loadingText}>Uploading with CDN optimization...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  uploadContainer: {
    width: '100%',
    aspectRatio: 9 / 16,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  uploadSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  mediaContainer: {
    width: '100%',
    aspectRatio: 9 / 16,
    position: 'relative',
  },
  media: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: colors.backgroundAlt,
  },
  changeMediaButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  changeMediaText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  captionContainer: {
    marginTop: 20,
  },
  captionInput: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  captionCount: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'right',
  },
  buttonContainer: {
    marginTop: 20,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});