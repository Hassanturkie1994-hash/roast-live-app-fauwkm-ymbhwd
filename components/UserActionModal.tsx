
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import { moderationService } from '@/app/services/moderationService';

interface UserActionModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  username: string;
  displayName: string;
  streamerId: string;
  currentUserId: string;
  isHost: boolean;
  isModerator: boolean;
  isTargetModerator: boolean;
}

const TIMEOUT_DURATIONS = [1, 5, 10, 30, 60];

export default function UserActionModal({
  visible,
  onClose,
  userId,
  username,
  displayName,
  streamerId,
  currentUserId,
  isHost,
  isModerator,
  isTargetModerator,
}: UserActionModalProps) {
  const [selectedAction, setSelectedAction] = useState<'timeout' | 'ban' | 'moderator' | null>(null);
  const [timeoutDuration, setTimeoutDuration] = useState(5);
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);

  const checkUserStatus = useCallback(async () => {
    const [bannedStatus, timedOutStatus] = await Promise.all([
      moderationService.isUserBanned(streamerId, userId),
      moderationService.isUserTimedOut(streamerId, userId),
    ]);
    
    setIsBanned(bannedStatus);
    setIsTimedOut(timedOutStatus);
  }, [streamerId, userId]);

  useEffect(() => {
    if (visible) {
      checkUserStatus();
    }
  }, [visible, checkUserStatus]);

  const handleTimeout = async () => {
    if (!reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for the timeout');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await moderationService.timeoutUser(
        streamerId,
        userId,
        timeoutDuration,
        reason,
        currentUserId
      );

      if (result.success) {
        Alert.alert('Success', `${displayName} has been timed out for ${timeoutDuration} minutes`);
        onClose();
      } else {
        Alert.alert('Error', result.error || 'Failed to timeout user');
      }
    } catch (error) {
      console.error('Error timing out user:', error);
      Alert.alert('Error', 'Failed to timeout user');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBan = async () => {
    if (!reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for the ban');
      return;
    }

    Alert.alert(
      'Confirm Ban',
      `Are you sure you want to ban ${displayName} from all your streams?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Ban',
          style: 'destructive',
          onPress: async () => {
            setIsProcessing(true);
            try {
              const result = await moderationService.banUser(
                streamerId,
                userId,
                reason,
                currentUserId
              );

              if (result.success) {
                Alert.alert('Success', `${displayName} has been banned from your streams`);
                onClose();
              } else {
                Alert.alert('Error', result.error || 'Failed to ban user');
              }
            } catch (error) {
              console.error('Error banning user:', error);
              Alert.alert('Error', 'Failed to ban user');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleUnban = async () => {
    setIsProcessing(true);
    try {
      const result = await moderationService.unbanUser(streamerId, userId);

      if (result.success) {
        Alert.alert('Success', `${displayName} has been unbanned`);
        onClose();
      } else {
        Alert.alert('Error', result.error || 'Failed to unban user');
      }
    } catch (error) {
      console.error('Error unbanning user:', error);
      Alert.alert('Error', 'Failed to unban user');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleModerator = async () => {
    if (!isHost) {
      Alert.alert('Permission Denied', 'Only the host can manage moderators');
      return;
    }

    setIsProcessing(true);
    try {
      if (isTargetModerator) {
        const result = await moderationService.removeModerator(streamerId, userId, currentUserId);
        if (result.success) {
          Alert.alert('Success', `${displayName} is no longer a moderator`);
          onClose();
        } else {
          Alert.alert('Error', result.error || 'Failed to remove moderator');
        }
      } else {
        const result = await moderationService.addModerator(streamerId, userId, currentUserId);
        if (result.success) {
          Alert.alert('Success', `${displayName} is now a moderator`);
          onClose();
        } else {
          Alert.alert('Error', result.error || 'Failed to add moderator');
        }
      }
    } catch (error) {
      console.error('Error toggling moderator:', error);
      Alert.alert('Error', 'Failed to update moderator status');
    } finally {
      setIsProcessing(false);
    }
  };

  const canModerate = isHost || isModerator;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <View style={styles.userAvatar}>
                <IconSymbol
                  ios_icon_name="person.fill"
                  android_material_icon_name="person"
                  size={24}
                  color={colors.textSecondary}
                />
              </View>
              <View>
                <Text style={styles.displayName}>{displayName}</Text>
                <Text style={styles.username}>@{username}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Status Indicators */}
            {(isBanned || isTimedOut || isTargetModerator) && (
              <View style={styles.statusSection}>
                {isTargetModerator && (
                  <View style={styles.statusBadge}>
                    <IconSymbol
                      ios_icon_name="shield.fill"
                      android_material_icon_name="shield"
                      size={16}
                      color="#FFD700"
                    />
                    <Text style={styles.statusText}>Moderator</Text>
                  </View>
                )}
                {isBanned && (
                  <View style={[styles.statusBadge, styles.bannedBadge]}>
                    <IconSymbol
                      ios_icon_name="hand.raised.fill"
                      android_material_icon_name="block"
                      size={16}
                      color="#FF1744"
                    />
                    <Text style={styles.statusText}>Banned</Text>
                  </View>
                )}
                {isTimedOut && (
                  <View style={[styles.statusBadge, styles.timedOutBadge]}>
                    <IconSymbol
                      ios_icon_name="clock.fill"
                      android_material_icon_name="schedule"
                      size={16}
                      color="#FFA500"
                    />
                    <Text style={styles.statusText}>Timed Out</Text>
                  </View>
                )}
              </View>
            )}

            {/* Actions */}
            {canModerate && !selectedAction && (
              <View style={styles.actionsGrid}>
                {!isBanned && !isTimedOut && (
                  <>
                    <TouchableOpacity
                      style={styles.actionCard}
                      onPress={() => setSelectedAction('timeout')}
                    >
                      <IconSymbol
                        ios_icon_name="clock.fill"
                        android_material_icon_name="schedule"
                        size={32}
                        color="#FFA500"
                      />
                      <Text style={styles.actionTitle}>Timeout</Text>
                      <Text style={styles.actionDescription}>
                        Temporarily mute user
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionCard}
                      onPress={() => setSelectedAction('ban')}
                    >
                      <IconSymbol
                        ios_icon_name="hand.raised.fill"
                        android_material_icon_name="block"
                        size={32}
                        color="#FF1744"
                      />
                      <Text style={styles.actionTitle}>Ban</Text>
                      <Text style={styles.actionDescription}>
                        Ban from all streams
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                {isBanned && (
                  <TouchableOpacity
                    style={[styles.actionCard, styles.actionCardFull]}
                    onPress={handleUnban}
                    disabled={isProcessing}
                  >
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check_circle"
                      size={32}
                      color="#4CAF50"
                    />
                    <Text style={styles.actionTitle}>Unban User</Text>
                    <Text style={styles.actionDescription}>
                      Remove ban from this user
                    </Text>
                  </TouchableOpacity>
                )}

                {isHost && (
                  <TouchableOpacity
                    style={[styles.actionCard, styles.actionCardFull]}
                    onPress={handleToggleModerator}
                    disabled={isProcessing}
                  >
                    <IconSymbol
                      ios_icon_name={isTargetModerator ? 'shield.slash.fill' : 'shield.fill'}
                      android_material_icon_name={isTargetModerator ? 'shield' : 'shield'}
                      size={32}
                      color={isTargetModerator ? '#FF1744' : '#FFD700'}
                    />
                    <Text style={styles.actionTitle}>
                      {isTargetModerator ? 'Remove Moderator' : 'Make Moderator'}
                    </Text>
                    <Text style={styles.actionDescription}>
                      {isTargetModerator ? 'Remove moderator privileges' : 'Grant moderator privileges'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Timeout Form */}
            {selectedAction === 'timeout' && (
              <View style={styles.form}>
                <Text style={styles.formTitle}>Timeout Duration</Text>
                <View style={styles.durationGrid}>
                  {TIMEOUT_DURATIONS.map((duration) => (
                    <TouchableOpacity
                      key={duration}
                      style={[
                        styles.durationButton,
                        timeoutDuration === duration && styles.durationButtonActive,
                      ]}
                      onPress={() => setTimeoutDuration(duration)}
                    >
                      <Text
                        style={[
                          styles.durationText,
                          timeoutDuration === duration && styles.durationTextActive,
                        ]}
                      >
                        {duration} min
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.formTitle}>Reason</Text>
                <TextInput
                  style={styles.reasonInput}
                  placeholder="Enter reason for timeout..."
                  placeholderTextColor={colors.placeholder}
                  value={reason}
                  onChangeText={setReason}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setSelectedAction(null);
                      setReason('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <View style={styles.confirmButton}>
                    <GradientButton
                      title={isProcessing ? 'Processing...' : 'Timeout User'}
                      onPress={handleTimeout}
                      size="medium"
                      disabled={isProcessing}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Ban Form */}
            {selectedAction === 'ban' && (
              <View style={styles.form}>
                <Text style={styles.formTitle}>Reason for Ban</Text>
                <TextInput
                  style={styles.reasonInput}
                  placeholder="Enter reason for ban..."
                  placeholderTextColor={colors.placeholder}
                  value={reason}
                  onChangeText={setReason}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                <View style={styles.warningBox}>
                  <IconSymbol
                    ios_icon_name="exclamationmark.triangle.fill"
                    android_material_icon_name="warning"
                    size={20}
                    color="#FF1744"
                  />
                  <Text style={styles.warningText}>
                    This user will be banned from all your streams permanently.
                  </Text>
                </View>

                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setSelectedAction(null);
                      setReason('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <View style={styles.confirmButton}>
                    <GradientButton
                      title={isProcessing ? 'Processing...' : 'Ban User'}
                      onPress={handleBan}
                      size="medium"
                      disabled={isProcessing}
                    />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  displayName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  username: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  content: {
    padding: 20,
  },
  statusSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  bannedBadge: {
    backgroundColor: 'rgba(255, 23, 68, 0.1)',
    borderColor: 'rgba(255, 23, 68, 0.3)',
  },
  timedOutBadge: {
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    borderColor: 'rgba(255, 165, 0, 0.3)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  actionCardFull: {
    minWidth: '100%',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  actionDescription: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  durationButton: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  durationButtonActive: {
    backgroundColor: 'rgba(164, 0, 40, 0.2)',
    borderColor: colors.brandPrimary,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  durationTextActive: {
    color: colors.brandPrimary,
  },
  reasonInput: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    minHeight: 80,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 23, 68, 0.1)',
    borderColor: 'rgba(255, 23, 68, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 18,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  confirmButton: {
    flex: 1,
  },
});
