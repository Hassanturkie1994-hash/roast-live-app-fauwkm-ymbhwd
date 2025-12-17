
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import { supabase } from '@/app/integrations/supabase/client';
import { moderationService } from '@/app/services/moderationService';

interface ViewerProfileModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  streamerId: string;
  onAction?: () => void;
}

export default function ViewerProfileModal({
  visible,
  onClose,
  userId,
  streamerId,
  onAction,
}: ViewerProfileModalProps) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [showTimeoutInput, setShowTimeoutInput] = useState(false);
  const [timeoutMinutes, setTimeoutMinutes] = useState('5');

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (visible && userId) {
      fetchProfile();
    }
  }, [visible, userId, fetchProfile]);

  const handleTimeout = async () => {
    const minutes = parseInt(timeoutMinutes);
    if (isNaN(minutes) || minutes < 1) {
      Alert.alert('Invalid Duration', 'Please enter a valid timeout duration');
      return;
    }

    Alert.alert(
      'Timeout User',
      `Timeout ${profile?.display_name || 'this user'} for ${minutes} minutes?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Timeout',
          style: 'destructive',
          onPress: async () => {
            const result = await moderationService.timeoutUser(
              streamerId,
              userId,
              minutes * 60
            );
            if (result.success) {
              Alert.alert('Success', `User has been timed out for ${minutes} minutes`);
              onAction?.();
              onClose();
            } else {
              Alert.alert('Error', result.error || 'Failed to timeout user');
            }
          },
        },
      ]
    );
  };

  const handleBan = async () => {
    Alert.alert(
      'Ban User',
      `Permanently ban ${profile?.display_name || 'this user'} from your streams?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Ban',
          style: 'destructive',
          onPress: async () => {
            const result = await moderationService.banUser(streamerId, userId);
            if (result.success) {
              Alert.alert('Success', 'User has been banned');
              onAction?.();
              onClose();
            } else {
              Alert.alert('Error', result.error || 'Failed to ban user');
            }
          },
        },
      ]
    );
  };

  const handlePromoteToModerator = async () => {
    Alert.alert(
      'Promote to Moderator',
      `Make ${profile?.display_name || 'this user'} a moderator?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Promote',
          onPress: async () => {
            const result = await moderationService.addModerator(streamerId, userId);
            if (result.success) {
              Alert.alert('Success', 'User has been promoted to moderator');
              onAction?.();
              onClose();
            } else {
              Alert.alert('Error', result.error || 'Failed to promote user');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Viewer Profile</Text>
            <TouchableOpacity onPress={onClose}>
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="cancel"
                size={28}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.brandPrimary} />
            </View>
          ) : profile ? (
            <View style={styles.modalBody}>
              {/* Profile Info */}
              <View style={styles.profileSection}>
                {profile.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.backgroundAlt }]}>
                    <IconSymbol
                      ios_icon_name="person.fill"
                      android_material_icon_name="person"
                      size={32}
                      color={colors.textSecondary}
                    />
                  </View>
                )}
                <Text style={[styles.displayName, { color: colors.text }]}>{profile.display_name}</Text>
                <Text style={[styles.username, { color: colors.textSecondary }]}>@{profile.username}</Text>
                {profile.bio && (
                  <Text style={[styles.bio, { color: colors.text }]}>{profile.bio}</Text>
                )}
              </View>

              {/* Actions */}
              <View style={styles.actionsSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Moderation Actions</Text>

                {/* Timeout */}
                <View style={styles.actionGroup}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}
                    onPress={() => setShowTimeoutInput(!showTimeoutInput)}
                  >
                    <IconSymbol
                      ios_icon_name="clock.fill"
                      android_material_icon_name="schedule"
                      size={20}
                      color={colors.text}
                    />
                    <Text style={[styles.actionButtonText, { color: colors.text }]}>Timeout</Text>
                  </TouchableOpacity>

                  {showTimeoutInput && (
                    <View style={styles.timeoutInputContainer}>
                      <TextInput
                        style={[styles.timeoutInput, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, color: colors.text }]}
                        placeholder="Minutes"
                        placeholderTextColor={colors.placeholder}
                        keyboardType="number-pad"
                        value={timeoutMinutes}
                        onChangeText={setTimeoutMinutes}
                      />
                      <TouchableOpacity
                        style={[styles.timeoutConfirmButton, { backgroundColor: colors.brandPrimary }]}
                        onPress={handleTimeout}
                      >
                        <Text style={styles.timeoutConfirmButtonText}>Apply</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Ban */}
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}
                  onPress={handleBan}
                >
                  <IconSymbol
                    ios_icon_name="hand.raised.fill"
                    android_material_icon_name="block"
                    size={20}
                    color={colors.brandPrimary}
                  />
                  <Text style={[styles.actionButtonText, { color: colors.brandPrimary }]}>Ban</Text>
                </TouchableOpacity>

                {/* Promote to Moderator */}
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}
                  onPress={handlePromoteToModerator}
                >
                  <IconSymbol
                    ios_icon_name="shield.fill"
                    android_material_icon_name="shield"
                    size={20}
                    color={colors.brandPrimary}
                  />
                  <Text style={[styles.actionButtonText, { color: colors.brandPrimary }]}>Promote to Moderator</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: colors.text }]}>Failed to load profile</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  modalBody: {
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  displayName: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionsSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  actionGroup: {
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  timeoutInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  timeoutInput: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    fontSize: 16,
  },
  timeoutConfirmButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeoutConfirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
  },
});