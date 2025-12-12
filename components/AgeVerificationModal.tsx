
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';

interface AgeVerificationModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  streamerName: string;
}

export default function AgeVerificationModal({
  visible,
  onConfirm,
  onCancel,
  streamerName,
}: AgeVerificationModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🔞</Text>
          </View>

          <Text style={styles.title}>18+ Content Warning</Text>
          
          <Text style={styles.message}>
            This stream contains explicit roast content from{' '}
            <Text style={styles.streamerName}>{streamerName}</Text>.
          </Text>

          <View style={styles.warningBox}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={20}
              color={colors.gradientEnd}
            />
            <Text style={styles.warningText}>
              This content may include strong language, adult themes, and explicit roasting.
            </Text>
          </View>

          <Text style={styles.question}>
            Are you 18 years or older?
          </Text>

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>No, Go Back</Text>
            </TouchableOpacity>
            <View style={styles.confirmButton}>
              <GradientButton
                title="Yes, Continue"
                onPress={onConfirm}
                size="medium"
              />
            </View>
          </View>

          <Text style={styles.disclaimer}>
            By continuing, you confirm that you are 18 years or older and understand the nature of this content.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(164, 0, 40, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  streamerName: {
    fontWeight: '700',
    color: colors.gradientEnd,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderColor: colors.gradientEnd,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    gap: 8,
    width: '100%',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 18,
  },
  question: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 16,
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
  confirmButton: {
    flex: 1,
  },
  disclaimer: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});