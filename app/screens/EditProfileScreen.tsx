
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
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

export default function EditProfileScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url);
      setBannerUrl(profile.banner_url || null);
    }
  }, [profile]);

  const checkUsernameUnique = useCallback(async (newUsername: string): Promise<boolean> => {
    if (newUsername === profile?.username) return true;

    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', newUsername)
      .maybeSingle();

    if (error) {
      console.error('Error checking username:', error);
      return false;
    }

    return !data;
  }, [profile?.username]);

  const pickImage = useCallback(async (type: 'avatar' | 'banner') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: type === 'avatar' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === 'avatar') {
        setAvatarUrl(result.assets[0].uri);
      } else {
        setBannerUrl(result.assets[0].uri);
      }
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!user) return;

    // Validation
    if (displayName.length < 3) {
      Alert.alert('Error', 'Display name must be at least 3 characters');
      return;
    }

    if (username.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters');
      return;
    }

    setLoading(true);

    try {
      // Check username uniqueness
      const isUnique = await checkUsernameUnique(username);
      if (!isUnique) {
        Alert.alert('Error', 'Username is already taken');
        setLoading(false);
        return;
      }

      // Upload images using CDN service if changed
      let finalAvatarUrl = avatarUrl;
      let finalBannerUrl = bannerUrl;

      if (avatarUrl && avatarUrl.startsWith('file://')) {
        const response = await fetch(avatarUrl);
        const blob = await response.blob();
        const uploadResult = await cdnService.uploadProfileImage(user.id, blob);
        
        if (uploadResult.success && uploadResult.cdnUrl) {
          finalAvatarUrl = uploadResult.cdnUrl;
        }
      }

      if (bannerUrl && bannerUrl.startsWith('file://')) {
        const response = await fetch(bannerUrl);
        const blob = await response.blob();
        
        // Upload banner using generic media upload
        const uploadResult = await cdnService.uploadMedia({
          bucket: 'media',
          path: `banners/${user.id}/${Date.now()}.jpg`,
          file: blob,
          contentType: 'image/jpeg',
          tier: 'A',
          mediaType: 'profile',
        });
        
        if (uploadResult.success && uploadResult.cdnUrl) {
          finalBannerUrl = uploadResult.cdnUrl;
        }
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          username: username,
          bio: bio,
          avatar_url: finalAvatarUrl,
          banner_url: finalBannerUrl,
          unique_profile_link: `roastlive.com/@${username}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        Alert.alert('Error', 'Failed to update profile');
        setLoading(false);
        return;
      }

      await refreshProfile();
      Alert.alert('Success', 'Profile updated successfully with CDN optimization');
      router.back();
    } catch (error) {
      console.error('Error in handleSave:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [user, displayName, username, bio, avatarUrl, bannerUrl, checkUsernameUnique, refreshProfile]);

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <TouchableOpacity
          style={styles.bannerContainer}
          onPress={() => pickImage('banner')}
          activeOpacity={0.8}
        >
          {bannerUrl ? (
            <Image source={{ uri: bannerUrl }} style={styles.banner} />
          ) : (
            <View style={styles.bannerPlaceholder}>
              <IconSymbol
                ios_icon_name="photo"
                android_material_icon_name="add_photo_alternate"
                size={32}
                color={colors.textSecondary}
              />
              <Text style={styles.bannerText}>Add Banner</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => pickImage('avatar')}
            activeOpacity={0.8}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <IconSymbol
                  ios_icon_name="person.fill"
                  android_material_icon_name="person"
                  size={40}
                  color={colors.textSecondary}
                />
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <IconSymbol
                ios_icon_name="camera.fill"
                android_material_icon_name="camera_alt"
                size={16}
                color={colors.text}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your display name"
              placeholderTextColor={colors.placeholder}
              value={displayName}
              onChangeText={setDisplayName}
              maxLength={50}
            />
            <Text style={styles.hint}>{displayName.length}/50</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="username"
              placeholderTextColor={colors.placeholder}
              value={username}
              onChangeText={(text) => setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              maxLength={30}
              autoCapitalize="none"
            />
            <Text style={styles.hint}>@{username}</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell us about yourself..."
              placeholderTextColor={colors.placeholder}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              maxLength={150}
            />
            <Text style={styles.hint}>{bio.length}/150</Text>
          </View>

          <View style={styles.buttonContainer}>
            <GradientButton
              title={loading ? 'SAVING...' : 'SAVE CHANGES'}
              onPress={handleSave}
              disabled={loading}
            />
          </View>
        </View>
      </ScrollView>

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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  bannerContainer: {
    width: '100%',
    height: 200,
    backgroundColor: colors.backgroundAlt,
  },
  banner: {
    width: '100%',
    height: '100%',
  },
  bannerPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: -50,
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: colors.background,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 4,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gradientEnd,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  form: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: 4,
  },
  buttonContainer: {
    marginTop: 8,
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