
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from './IconSymbol';

interface ForcedReviewLockModalProps {
  visible: boolean;
  onClose: () => void;
  reportCount: number;
}

export default function ForcedReviewLockModal({
  visible,
  onClose,
  reportCount,
}: ForcedReviewLockModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <IconSymbol
              ios_icon_name="lock.shield.fill"
              android_material_icon_name="lock"
              size={64}
              color={colors.gradientEnd}
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>Temporarily Paused</Text>

          {/* Message */}
          <Text style={styles.message}>
            You are temporarily paused due to safety review. You will be notified after review.
          </Text>

          {/* Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle.fill"
                android_material_icon_name="warning"
                size={20}
                color={colors.textSecondary}
              />
              <Text style={styles.detailText}>
                Your account received {reportCount} reports within 3 days
              </Text>
            </View>
          </View>

          {/* Restrictions */}
          <View style={styles.restrictionsContainer}>
            <Text style={styles.restrictionsTitle}>Current Restrictions:</Text>
            
            <View style={styles.restrictionRow}>
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="cancel"
                size={20}
                color={colors.gradientEnd}
              />
              <Text style={styles.restrictionText}>GO LIVE button</Text>
            </View>

            <View style={styles.restrictionRow}>
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="cancel"
                size={20}
                color={colors.gradientEnd}
              />
              <Text style={styles.restrictionText}>Comment posting</Text>
            </View>
          </View>

          {/* Allowed */}
          <View style={styles.allowedContainer}>
            <Text style={styles.allowedTitle}>You can still:</Text>
            
            <View style={styles.allowedRow}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={20}
                color="#4CAF50"
              />
              <Text style={styles.allowedText}>View inbox</Text>
            </View>

            <View style={styles.allowedRow}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={20}
                color="#4CAF50"
              />
              <Text style={styles.allowedText}>Edit profile</Text>
            </View>

            <View style={styles.allowedRow}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={20}
                color="#4CAF50"
              />
              <Text style={styles.allowedText}>Browse other streams</Text>
            </View>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <IconSymbol
              ios_icon_name="info.circle.fill"
              android_material_icon_name="info"
              size={20}
              color={colors.gradientEnd}
            />
            <Text style={styles.infoText}>
              Our admin team will review your account. You&apos;ll receive a notification once the review is complete.
            </Text>
          </View>

          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.closeButtonText}>I Understand</Text>
          </TouchableOpacity>
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
  modalContainer: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: 20,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 20,
  },
  restrictionsContainer: {
    width: '100%',
    gap: 12,
  },
  restrictionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  restrictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 8,
  },
  restrictionText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  allowedContainer: {
    width: '100%',
    gap: 12,
  },
  allowedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  allowedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 8,
  },
  allowedText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderColor: 'rgba(164, 0, 40, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 12,
    width: '100%',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  closeButton: {
    backgroundColor: colors.gradientEnd,
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
});