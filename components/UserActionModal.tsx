
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { moderationService } from '@/app/services/moderationService';
import { router } from 'expo-router';

interface UserActionModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  username: string;
  streamId: string;
  streamerId: string;
  currentUserId: string;
  isStreamer: boolean;
  isModerator: boolean;
}

export default function UserActionModal({
  visible,
  onClose,
  userId,
  username,
  streamId,
  streamerId,
  currentUserId,
  isStreamer,
  isModerator,
}: UserActionModalProps) {
  const [showTimeoutPicker, setShowTimeoutPicker] = useState(false);
  const [timeoutDuration, setTimeoutDuration] = useState('5');
  const [isLoading, setIsLoading] = useState(false);
  const [userIsModerator, setUserIsModerator] = useState(false);
  const [userIsBanned, setUserIsBanned] = useState(false);

  useEffect(() => {
    if (visible) {
      checkUserStatus();
    }
  }, [visible, userId]);

  const checkUserStatus = async () => {
    const [isMod, isBan] = await Promise.all([
      moderationService.isModerator(streamerId, userId),
      moderationService.isBanned(streamerId, userId),
    ]);
    setUserIsModerator(isMod);
    setUserIsBanned(isBan);
  };

  const handleAddModerator = async () => {
    if (!isStreamer) {
      Alert.alert('Permission Denied', 'Only the streamer can add moderators.');
      return;
    }

    setIsLoading(true);
    const result = await moderationService.addModerator(streamerId, userId);
    setIsLoading(false);

    if (result.success) {
      Alert.alert('Success', `${username} has been added as a moderator.`);
      setUserIsModerator(true);
    } else {
      Alert.alert('Error', result.error || 'Failed to add moderator.');
    }
  };

  const handleRemoveModerator = async () => {
    if (!isStreamer) {
      Alert.alert('Permission Denied', 'Only the streamer can remove moderators.');
      return;
    }

    Alert.alert(
      'Remove Moderator',
      `Are you sure you want to remove ${username} as a moderator?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            const result = await moderationService.removeModerator(streamerId, userId);
            setIsLoading(false);

            if (result.success) {
              Alert.alert('Success', `${username} has been removed as a moderator.`);
              setUserIsModerator(false);
            } else {
              Alert.alert('Error', result.error || 'Failed to remove moderator.');
            }
          },
        },
      ]
    );
  };

  const handleBanUser = async () => {
    if (!isStreamer && !isModerator) {
      Alert.alert('Permission Denied', 'Only streamers and moderators can ban users.');
      return;
    }

    Alert.alert(
      'Ban User',
      `Are you sure you want to ban ${username}? They will be removed from this stream and all future streams.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Ban',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            const result = await moderationService.banUser(streamerId, userId);
            setIsLoading(false);

            if (result.success) {
              Alert.alert('Success', `${username} has been banned.`);
              setUserIsBanned(true);
              onClose();
            } else {
              Alert.alert('Error', result.error || 'Failed to ban user.');
            }
          },
        },
      ]
    );
  };

  const handleUnbanUser = async () => {
    if (!isStreamer) {
      Alert.alert('Permission Denied', 'Only the streamer can unban users.');
      return;
    }

    setIsLoading(true);
    const result = await moderationService.unbanUser(streamerId, userId);
    setIsLoading(false);

    if (result.success) {
      Alert.alert('Success', `${username} has been unbanned.`);
      setUserIsBanned(false);
    } else {
      Alert.alert('Error', result.error || 'Failed to unban user.');
    }
  };

  const handleTimeoutUser = async () => {
    if (!isStreamer && !isModerator) {
      Alert.alert('Permission Denied', 'Only streamers and moderators can timeout users.');
      return;
    }

    setShowTimeoutPicker(true);
  };

  const confirmTimeout = async () => {
    const duration = parseInt(timeoutDuration);
    if (isNaN(duration) || duration < 1 || duration > 60) {
      Alert.alert('Invalid Duration', 'Please enter a duration between 1 and 60 minutes.');
      return;
    }

    setIsLoading(true);
    setShowTimeoutPicker(false);
    const result = await moderationService.timeoutUser(streamId, userId, duration);
    setIsLoading(false);

    if (result.success) {
      Alert.alert('Success', `${username} has been timed out for ${duration} minutes.`);
      onClose();
    } else {
      Alert.alert('Error', result.error || 'Failed to timeout user.');
    }
  };

  const handleViewProfile = () => {
    onClose();
    // Navigate to user profile
    router.push(`/profile/${userId}`);
  };

  if (showTimeoutPicker) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.timeoutPickerContainer}>
            <Text style={styles.timeoutTitle}>Timeout Duration</Text>
            <Text style={styles.timeoutSubtitle}>Select duration (1-60 minutes)</Text>
            
            <View style={styles.timeoutInputContainer}>
              <TextInput
                style={styles.timeoutInput}
                value={timeoutDuration}
                onChangeText={setTimeoutDuration}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="5"
                placeholderTextColor={colors.placeholder}
              />
              <Text style={styles.timeoutUnit}>minutes</Text>
            </View>

            <View style={styles.quickTimeoutButtons}>
              {[1, 5, 10, 30, 60].map((duration) => (
                <TouchableOpacity
                  key={duration}
                  style={styles.quickTimeoutButton}
                  onPress={() => setTimeoutDuration(duration.toString())}
                >
                  <Text style={styles.quickTimeoutText}>{duration}m</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.timeoutActions}>
              <TouchableOpacity
                style={styles.timeoutCancelButton}
                onPress={() => {
                  setShowTimeoutPicker(false);
                  setTimeoutDuration('5');
                }}
              >
                <Text style={styles.timeoutCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.timeoutConfirmButton}
                onPress={confirmTimeout}
              >
                <Text style={styles.timeoutConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.username}>@{username}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.gradientEnd} />
            </View>
          )}

          <View style={styles.actions}>
            {/* View Profile - Available to everyone */}
            <TouchableOpacity style={styles.actionButton} onPress={handleViewProfile}>
              <IconSymbol
                ios_icon_name="person.circle.fill"
                android_material_icon_name="account_circle"
                size={24}
                color={colors.text}
              />
              <Text style={styles.actionText}>View Profile</Text>
            </TouchableOpacity>

            {/* Moderator Actions - Only for streamer */}
            {isStreamer && userId !== currentUserId && (
              <>
                {userIsModerator ? (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.dangerAction]}
                    onPress={handleRemoveModerator}
                  >
                    <IconSymbol
                      ios_icon_name="shield.slash.fill"
                      android_material_icon_name="shield"
                      size={24}
                      color={colors.gradientEnd}
                    />
                    <Text style={[styles.actionText, styles.dangerText]}>
                      Remove Moderator
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.actionButton} onPress={handleAddModerator}>
                    <IconSymbol
                      ios_icon_name="shield.fill"
                      android_material_icon_name="shield"
                      size={24}
                      color={colors.gradientEnd}
                    />
                    <Text style={styles.actionText}>Add Moderator</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* Ban/Unban - For streamer and moderators */}
            {(isStreamer || isModerator) && userId !== currentUserId && (
              <>
                {userIsBanned ? (
                  isStreamer && (
                    <TouchableOpacity style={styles.actionButton} onPress={handleUnbanUser}>
                      <IconSymbol
                        ios_icon_name="checkmark.circle.fill"
                        android_material_icon_name="check_circle"
                        size={24}
                        color="#4CAF50"
                      />
                      <Text style={styles.actionText}>Unban User</Text>
                    </TouchableOpacity>
                  )
                ) : (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.dangerAction]}
                    onPress={handleBanUser}
                  >
                    <IconSymbol
                      ios_icon_name="hand.raised.fill"
                      android_material_icon_name="block"
                      size={24}
                      color={colors.gradientEnd}
                    />
                    <Text style={[styles.actionText, styles.dangerText]}>Ban User</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* Timeout - For streamer and moderators */}
            {(isStreamer || isModerator) && userId !== currentUserId && !userIsBanned && (
              <TouchableOpacity
                style={[styles.actionButton, styles.warningAction]}
                onPress={handleTimeoutUser}
              >
                <IconSymbol
                  ios_icon_name="clock.fill"
                  android_material_icon_name="schedule"
                  size={24}
                  color="#FF9800"
                />
                <Text style={styles.actionText}>Timeout User</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  username: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  closeButton: {
    padding: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  actions: {
    padding: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dangerAction: {
    backgroundColor: 'rgba(227, 0, 82, 0.1)',
    borderColor: colors.gradientEnd,
  },
  warningAction: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderColor: '#FF9800',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  dangerText: {
    color: colors.gradientEnd,
  },
  timeoutPickerContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
  },
  timeoutTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  timeoutSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  timeoutInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  timeoutInput: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    minWidth: 100,
  },
  timeoutUnit: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  quickTimeoutButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  quickTimeoutButton: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  quickTimeoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  timeoutActions: {
    flexDirection: 'row',
    gap: 12,
  },
  timeoutCancelButton: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  timeoutCancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  timeoutConfirmButton: {
    flex: 1,
    backgroundColor: colors.gradientEnd,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  timeoutConfirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
});