
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

interface CreatorBurnoutProtectionProps {
  creatorId: string;
  streamDurationMinutes: number;
}

export default function CreatorBurnoutProtection({
  creatorId,
  streamDurationMinutes,
}: CreatorBurnoutProtectionProps) {
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [burnoutMetrics, setBurnoutMetrics] = useState({
    consecutiveDays: 0,
    avgDailyHours: 0,
    lastBreakDays: 0,
  });

  const loadBurnoutMetrics = useCallback(async () => {
    console.log('Loading burnout metrics for creator:', creatorId);
    setBurnoutMetrics({
      consecutiveDays: 5,
      avgDailyHours: 6.5,
      lastBreakDays: 7,
    });
  }, [creatorId]);

  const showWarning = useCallback(() => {
    if (streamDurationMinutes > 180) {
      setShowWarningModal(true);
    }
  }, [streamDurationMinutes]);

  useEffect(() => {
    loadBurnoutMetrics();
  }, [loadBurnoutMetrics]);

  useEffect(() => {
    showWarning();
  }, [showWarning]);

  return (
    <>
      <Modal
        visible={showWarningModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWarningModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={48}
              color="#FFA500"
            />
            <Text style={styles.modalTitle}>Take a Break</Text>
            <Text style={styles.modalDescription}>
              You&apos;ve been streaming for over 3 hours. Consider taking a break to avoid burnout.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowWarningModal(false)}
            >
              <Text style={styles.modalButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 16,
    maxWidth: 400,
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
