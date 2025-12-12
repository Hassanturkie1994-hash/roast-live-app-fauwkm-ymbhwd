
import React, { useState } from 'react';
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
import { streamGuestService } from '@/app/services/streamGuestService';

interface GuestInvitationModalProps {
  visible: boolean;
  onClose: () => void;
  streamId: string;
  hostId: string;
  inviteeId: string;
  inviteeName: string;
}

export default function GuestInvitationModal({
  visible,
  onClose,
  streamId,
  hostId,
  inviteeId,
  inviteeName,
}: GuestInvitationModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleInvite = async () => {
    setIsLoading(true);

    try {
      const result = await streamGuestService.inviteGuest(streamId, hostId, inviteeId);

      if (result.success) {
        Alert.alert(
          'Invitation Sent',
          `${inviteeName} has been invited to join your live stream!\n\nThey have 20 seconds to accept.`,
          [{ text: 'OK' }]
        );
        onClose();
      } else {
        Alert.alert('Error', result.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error inviting guest:', error);
      Alert.alert('Error', 'Failed to send invitation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <IconSymbol
              ios_icon_name="person.badge.plus.fill"
              android_material_icon_name="person_add"
              size={48}
              color={colors.gradientEnd}
            />
            <Text style={styles.title}>Invite to Join Live</Text>
          </View>

          <Text style={styles.message}>
            Invite <Text style={styles.highlight}>{inviteeName}</Text> to join your live stream as
            a guest?
          </Text>

          <View style={styles.infoBox}>
            <IconSymbol
              ios_icon_name="info.circle.fill"
              android_material_icon_name="info"
              size={20}
              color={colors.gradientEnd}
            />
            <Text style={styles.infoText}>
              They will be able to appear on your stream with their camera and microphone. The
              invitation expires in 20 seconds.
            </Text>
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.inviteButtonContainer}>
              <GradientButton
                title={isLoading ? 'SENDING...' : 'SEND INVITE'}
                onPress={handleInvite}
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
  highlight: {
    fontWeight: '700',
    color: colors.text,
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
  cancelButton: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  inviteButtonContainer: {
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