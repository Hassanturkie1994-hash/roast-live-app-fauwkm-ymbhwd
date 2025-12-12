
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import { streamGuestService, StreamGuestInvitation } from '@/app/services/streamGuestService';

interface GuestInvitationReceivedModalProps {
  visible: boolean;
  onClose: () => void;
  invitation: StreamGuestInvitation | null;
  hostName: string;
  onAccept: () => void;
  onDecline: () => void;
}

export default function GuestInvitationReceivedModal({
  visible,
  onClose,
  invitation,
  hostName,
  onAccept,
  onDecline,
}: GuestInvitationReceivedModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(20);
  const [showPreview, setShowPreview] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const autoDeclineTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleAutoDeclineCallback = useCallback(async () => {
    if (!invitation) return;
    
    console.log('⏰ Auto-declining invitation after 20 seconds');
    
    try {
      await streamGuestService.declineInvitation(invitation.id, invitation.invitee_id);
      Alert.alert('Invitation Expired', 'The invitation has expired.');
      onClose();
    } catch (error) {
      console.error('Error auto-declining invitation:', error);
      onClose();
    }
  }, [invitation, onClose]);

  useEffect(() => {
    if (!visible || !invitation) {
      setTimeRemaining(20);
      setShowPreview(false);
      // Clear auto-decline timer
      if (autoDeclineTimerRef.current) {
        clearTimeout(autoDeclineTimerRef.current);
        autoDeclineTimerRef.current = null;
      }
      return;
    }

    // Calculate time remaining
    const expiresAt = new Date(invitation.expires_at).getTime();
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
    setTimeRemaining(remaining);

    // Countdown timer
    const interval = setInterval(() => {
      const expiresAt = new Date(invitation.expires_at).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        handleAutoDeclineCallback();
      }
    }, 1000);

    // Set auto-decline timer for 20 seconds
    autoDeclineTimerRef.current = setTimeout(() => {
      handleAutoDeclineCallback();
    }, 20000);

    return () => {
      clearInterval(interval);
      if (autoDeclineTimerRef.current) {
        clearTimeout(autoDeclineTimerRef.current);
        autoDeclineTimerRef.current = null;
      }
    };
  }, [visible, invitation, handleAutoDeclineCallback]);

  const handleAccept = async () => {
    if (!invitation) return;
    
    // Clear auto-decline timer
    if (autoDeclineTimerRef.current) {
      clearTimeout(autoDeclineTimerRef.current);
      autoDeclineTimerRef.current = null;
    }
    
    setIsLoading(true);
    try {
      const result = await streamGuestService.acceptInvitation(
        invitation.id,
        invitation.invitee_id
      );

      if (result.success) {
        Alert.alert('Success', `You joined live with ${hostName}!`);
        onAccept();
        onClose();
      } else {
        Alert.alert('Error', result.error || 'Failed to join stream');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      Alert.alert('Error', 'Failed to join stream. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!invitation) return;
    
    // Clear auto-decline timer
    if (autoDeclineTimerRef.current) {
      clearTimeout(autoDeclineTimerRef.current);
      autoDeclineTimerRef.current = null;
    }
    
    setIsLoading(true);
    try {
      await streamGuestService.declineInvitation(invitation.id, invitation.invitee_id);
      Alert.alert('Declined', 'You declined the invitation.');
      onDecline();
      onClose();
    } catch (error) {
      console.error('Error declining invitation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePreview = async () => {
    if (!showPreview && !permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Camera Permission Required', 'Please grant camera permission to preview yourself.');
        return;
      }
    }
    setShowPreview(!showPreview);
  };

  if (!invitation) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Timer */}
          <View style={styles.timerContainer}>
            <IconSymbol
              ios_icon_name="clock.fill"
              android_material_icon_name="schedule"
              size={16}
              color={timeRemaining <= 5 ? colors.gradientEnd : colors.textSecondary}
            />
            <Text
              style={[
                styles.timerText,
                timeRemaining <= 5 && styles.timerTextUrgent,
              ]}
            >
              {timeRemaining}s remaining
            </Text>
          </View>

          <View style={styles.header}>
            <IconSymbol
              ios_icon_name="video.fill"
              android_material_icon_name="videocam"
              size={48}
              color={colors.gradientEnd}
            />
            <Text style={styles.title}>Live Invitation</Text>
          </View>

          <Text style={styles.message}>
            <Text style={styles.highlight}>{hostName}</Text> invited you to join live.
          </Text>

          <View style={styles.warningBox}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={20}
              color={colors.gradientEnd}
            />
            <Text style={styles.warningText}>
              You will appear on camera if accepted. Make sure you&apos;re ready!
            </Text>
          </View>

          {/* Preview toggle */}
          <TouchableOpacity style={styles.previewToggle} onPress={togglePreview}>
            <IconSymbol
              ios_icon_name={showPreview ? 'eye.slash.fill' : 'eye.fill'}
              android_material_icon_name={showPreview ? 'visibility_off' : 'visibility'}
              size={20}
              color={colors.text}
            />
            <Text style={styles.previewToggleText}>
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Text>
          </TouchableOpacity>

          {/* Camera preview */}
          {showPreview && (
            <View style={styles.previewContainer}>
              {permission?.granted ? (
                <CameraView 
                  style={styles.previewCamera}
                  facing="front"
                />
              ) : (
                <View style={styles.previewPlaceholder}>
                  <IconSymbol
                    ios_icon_name="video.fill"
                    android_material_icon_name="videocam"
                    size={48}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.previewText}>Camera Preview</Text>
                  <Text style={styles.previewSubtext}>
                    Grant camera permission to preview
                  </Text>
                </View>
              )}
              <View style={styles.previewOverlay}>
                <Text style={styles.previewLabel}>This is how you&apos;ll appear</Text>
              </View>
            </View>
          )}

          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.declineButton}
              onPress={handleDecline}
              disabled={isLoading}
            >
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
            <View style={styles.joinButtonContainer}>
              <GradientButton
                title={isLoading ? 'JOINING...' : 'JOIN NOW'}
                onPress={handleAccept}
                size="medium"
                disabled={isLoading}
              />
            </View>
          </View>

          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.gradientEnd} />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 16,
    gap: 6,
    alignSelf: 'center',
  },
  timerText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  timerTextUrgent: {
    color: colors.gradientEnd,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 26,
  },
  highlight: {
    fontWeight: '700',
    color: colors.text,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(164, 0, 40, 0.15)',
    borderColor: colors.gradientEnd,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 20,
  },
  previewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  previewToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  previewContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  previewCamera: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  previewPlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  previewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  previewText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  previewSubtext: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  joinButtonContainer: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
});