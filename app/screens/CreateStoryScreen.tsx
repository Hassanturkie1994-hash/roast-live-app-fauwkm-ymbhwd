
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions, FlashMode } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import { storyService } from '@/app/services/storyService';
import { cdnService } from '@/app/services/cdnService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function CreateStoryScreen() {
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [showCamera, setShowCamera] = useState(true);
  const [postType, setPostType] = useState<'story' | 'post' | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const requestPermissionCallback = useCallback(() => {
    requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permission]);

  const toggleCameraType = () => {
    setCameraType((current) => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlashMode((current) => {
      if (current === 'off') return 'on';
      if (current === 'on') return 'auto';
      return 'off';
    });
  };

  const takePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (photo) {
        setMediaUri(photo.uri);
        setShowCamera(false);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
      videoMaxDuration: 15,
    });

    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
      setShowCamera(false);
    }
  };

  const handlePostToStory = async () => {
    if (!user || !mediaUri) {
      Alert.alert('Error', 'Please capture or select media first');
      return;
    }

    setLoading(true);
    setPostType('story');

    try {
      // Upload media using CDN service
      const response = await fetch(mediaUri);
      const blob = await response.blob();

      const uploadResult = await cdnService.uploadStoryMedia(user.id, blob, false);

      if (!uploadResult.success || !uploadResult.cdnUrl) {
        Alert.alert('Error', uploadResult.error || 'Failed to upload media');
        setLoading(false);
        return;
      }

      // Create story with CDN URL
      const result = await storyService.createStory(user.id, uploadResult.cdnUrl);

      if (!result.success) {
        Alert.alert('Error', 'Failed to create story');
        setLoading(false);
        return;
      }

      Alert.alert('Success', 'Story posted successfully!');
      router.back();
    } catch (error) {
      console.error('Error in handlePostToStory:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setPostType(null);
    }
  };

  const handlePostToFeed = async () => {
    if (!user || !mediaUri) {
      Alert.alert('Error', 'Please capture or select media first');
      return;
    }

    setLoading(true);
    setPostType('post');

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
        caption: '',
        likes_count: 0,
        comments_count: 0,
        views_count: 0,
      });

      if (error) {
        console.error('Error creating post:', error);
        Alert.alert('Error', 'Failed to create post');
        setLoading(false);
        return;
      }

      Alert.alert('Success', 'Post created successfully!');
      router.back();
    } catch (error) {
      console.error('Error in handlePostToFeed:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setPostType(null);
    }
  };

  const retakePhoto = () => {
    setMediaUri(null);
    setShowCamera(true);
  };

  if (!permission) {
    return (
      <View style={commonStyles.container}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={commonStyles.container}>
        <View style={styles.permissionContainer}>
          <IconSymbol
            ios_icon_name="camera.fill"
            android_material_icon_name="camera_alt"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={styles.permissionText}>Camera permission is required</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermissionCallback}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      {showCamera ? (
        <>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={cameraType}
            flash={flashMode}
          >
            <View style={styles.cameraOverlay}>
              <View style={styles.topControls}>
                <TouchableOpacity onPress={() => router.back()} style={styles.controlButton}>
                  <IconSymbol
                    ios_icon_name="xmark"
                    android_material_icon_name="close"
                    size={28}
                    color={colors.text}
                  />
                </TouchableOpacity>

                <TouchableOpacity onPress={toggleFlash} style={styles.controlButton}>
                  <IconSymbol
                    ios_icon_name={
                      flashMode === 'off'
                        ? 'bolt.slash.fill'
                        : flashMode === 'on'
                        ? 'bolt.fill'
                        : 'bolt.badge.automatic.fill'
                    }
                    android_material_icon_name={
                      flashMode === 'off' ? 'flash_off' : flashMode === 'on' ? 'flash_on' : 'flash_auto'
                    }
                    size={28}
                    color={flashMode === 'off' ? colors.textSecondary : colors.text}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.bottomControls}>
                <TouchableOpacity onPress={pickFromGallery} style={styles.galleryButton}>
                  <IconSymbol
                    ios_icon_name="photo.fill"
                    android_material_icon_name="photo_library"
                    size={32}
                    color={colors.text}
                  />
                </TouchableOpacity>

                <TouchableOpacity onPress={takePhoto} style={styles.captureButton}>
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>

                <TouchableOpacity onPress={toggleCameraType} style={styles.flipButton}>
                  <IconSymbol
                    ios_icon_name="arrow.triangle.2.circlepath.camera.fill"
                    android_material_icon_name="flip_camera_android"
                    size={32}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        </>
      ) : (
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <TouchableOpacity onPress={retakePhoto} style={styles.backButton}>
              <IconSymbol
                ios_icon_name="arrow.left"
                android_material_icon_name="arrow_back"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Choose Destination</Text>
            <View style={styles.placeholder} />
          </View>

          <Image source={{ uri: mediaUri || '' }} style={styles.previewImage} />

          <View style={styles.actionButtons}>
            <View style={styles.actionButtonContainer}>
              <GradientButton
                title={loading && postType === 'story' ? 'POSTING...' : 'POST TO STORY'}
                onPress={handlePostToStory}
                disabled={loading}
              />
              <Text style={styles.actionHint}>Disappears in 24 hours • CDN optimized</Text>
            </View>

            <View style={styles.actionButtonContainer}>
              <TouchableOpacity
                style={styles.feedButton}
                onPress={handlePostToFeed}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.feedButtonText}>
                  {loading && postType === 'post' ? 'POSTING...' : 'POST TO FEED'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.actionHint}>Permanent post • CDN optimized</Text>
            </View>
          </View>
        </View>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.gradientEnd} />
          <Text style={styles.loadingText}>
            Uploading with device-optimized CDN...
          </Text>
          <Text style={styles.loadingSubtext}>
            Device tier: {cdnService.getDeviceTier().toUpperCase()}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 20,
  },
  permissionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: colors.gradientEnd,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  permissionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  camera: {
    flex: 1,
    width: screenWidth,
    height: screenHeight,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.text,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.text,
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewContainer: {
    flex: 1,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: colors.background,
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
  previewImage: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.backgroundAlt,
  },
  actionButtons: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: colors.background,
    gap: 16,
  },
  actionButtonContainer: {
    gap: 8,
  },
  actionHint: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  feedButton: {
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  loadingSubtext: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
  },
});
