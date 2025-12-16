
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import { streamGuestService, StreamGuestInvitation } from '@/app/services/streamGuestService';

interface GuestInvitationReceivedModalProps {
  visible: boolean;
  onClose: () => void;
  invitation: StreamGuestInvitation | null;
  onAccept: () => void;
  onDecline: () => void;
}

export default function GuestInvitationReceivedModal({
  visible,
  onClose,
  invitation,
  onAccept,
  onDecline,
}: GuestInvitationReceivedModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(20);

  useEffect(() => {
    if (!visible || !invitation) {
      setTimeRemaining(20);
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
        Alert.alert('Invitation Expired', 'The invitation has expired.');
        onClose();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, invitation, onClose]);

  const handleAccept = async () => {
    if (!invitation) return;

    setIsLoading(true);
    try {
      onAccept();
    } catch (error) {
      console.error('Error accepting invitation:', error);
      Alert.alert('Error', 'Failed to accept invitation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!invitation) return;

    setIsLoading(true);
    try {
      onDecline();
    } catch (error) {
      console.error('Error declining invitation:', error);
      Alert.alert('Error', 'Failed to decline invitation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!invitation) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <IconSymbol
              ios_icon_name="video.fill"
              android_material_icon_name="videocam"
              size={48}
              color={colors.gradientEnd}
            />
            <Text style={styles.title}>Join Live Stream</Text>
          </View>

          <Text style={styles.message}>
            You&apos;ve been invited to join a live stream as a guest!
          </Text>

          <View style={styles.timerContainer}>
            <IconSymbol
              ios_icon_name="clock.fill"
              android_material_icon_name="schedule"
              size={20}
              color={timeRemaining <= 5 ? '#FF0000' : colors.brandPrimary}
            />
            <Text style={[styles.timerText, timeRemaining <= 5 && styles.timerTextUrgent]}>
              {timeRemaining}s remaining
            </Text>
          </View>

          <View style={styles.infoBox}>
            <IconSymbol
              ios_icon_name="info.circle.fill"
              android_material_icon_name="info"
              size={20}
              color={colors.gradientEnd}
            />
            <Text style={styles.infoText}>
              You&apos;ll appear on the stream with your camera and microphone. 
              Make sure you&apos;re ready before accepting!
            </Text>
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.declineButton}
              onPress={handleDecline}
              disabled={isLoading}
            >
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
            <View style={styles.acceptButtonContainer}>
              <GradientButton
                title={isLoading ? 'JOINING...' : 'ACCEPT'}
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
  header: {
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  timerText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  timerTextUrgent: {
    color: '#FF0000',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderColor: colors.gradientEnd,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 18,
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
  acceptButtonContainer: {
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
