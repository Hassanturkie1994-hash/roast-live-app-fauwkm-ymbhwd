
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';

interface EndStreamModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveStream: () => Promise<void>;
  onDeleteStream: () => Promise<void>;
  streamTitle: string;
  isPracticeMode?: boolean;
  duration?: number;
  peakViewers?: number;
  totalViewers?: number;
}

export default function EndStreamModal({
  visible,
  onClose,
  onSaveStream,
  onDeleteStream,
  streamTitle,
  isPracticeMode = false,
  duration = 0,
  peakViewers = 0,
  totalViewers = 0,
}: EndStreamModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'save' | 'delete' | null>(null);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const handleSave = async () => {
    setIsProcessing(true);
    setSelectedAction('save');
    try {
      await onSaveStream();
    } catch (error) {
      console.error('Error saving stream:', error);
    } finally {
      setIsProcessing(false);
      setSelectedAction(null);
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    setSelectedAction('delete');
    try {
      await onDeleteStream();
    } catch (error) {
      console.error('Error deleting stream:', error);
    } finally {
      setIsProcessing(false);
      setSelectedAction(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.iconContainer}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={64}
              color={colors.gradientEnd}
            />
          </View>

          <Text style={styles.title}>
            {isPracticeMode ? 'End Practice Session?' : 'End Stream?'}
          </Text>

          <Text style={styles.subtitle}>{streamTitle}</Text>

          {!isPracticeMode && (
            <View style={styles.statsBox}>
              <View style={styles.statItem}>
                <IconSymbol
                  ios_icon_name="clock.fill"
                  android_material_icon_name="schedule"
                  size={20}
                  color={colors.brandPrimary}
                />
                <Text style={styles.statLabel}>Duration</Text>
                <Text style={styles.statValue}>{formatDuration(duration)}</Text>
              </View>
              <View style={styles.statItem}>
                <IconSymbol
                  ios_icon_name="chart.line.uptrend.xyaxis"
                  android_material_icon_name="trending_up"
                  size={20}
                  color={colors.brandPrimary}
                />
                <Text style={styles.statLabel}>Peak Viewers</Text>
                <Text style={styles.statValue}>{peakViewers}</Text>
              </View>
              <View style={styles.statItem}>
                <IconSymbol
                  ios_icon_name="person.2.fill"
                  android_material_icon_name="people"
                  size={20}
                  color={colors.brandPrimary}
                />
                <Text style={styles.statLabel}>Total Viewers</Text>
                <Text style={styles.statValue}>{totalViewers}</Text>
              </View>
            </View>
          )}

          <Text style={styles.description}>
            {isPracticeMode
              ? 'Your practice session will end. All settings will be saved for when you go live.'
              : 'Choose what to do with your stream recording:'}
          </Text>

          {!isPracticeMode && (
            <View style={styles.optionsContainer}>
              <View style={styles.optionCard}>
                <View style={styles.optionHeader}>
                  <IconSymbol
                    ios_icon_name="square.and.arrow.down.fill"
                    android_material_icon_name="save"
                    size={32}
                    color="#4CAF50"
                  />
                  <Text style={styles.optionTitle}>Save Stream</Text>
                </View>
                <Text style={styles.optionDescription}>
                  Stream will be archived and appear in:
                  {'\n'}• Profile → Saved Streams
                  {'\n'}• Stream History
                </Text>
                <View style={styles.optionButton}>
                  <GradientButton
                    title={
                      isProcessing && selectedAction === 'save'
                        ? 'Saving...'
                        : 'Save Stream'
                    }
                    onPress={handleSave}
                    size="medium"
                    disabled={isProcessing}
                  />
                </View>
              </View>

              <View style={styles.optionCard}>
                <View style={styles.optionHeader}>
                  <IconSymbol
                    ios_icon_name="trash.fill"
                    android_material_icon_name="delete"
                    size={32}
                    color="#FF1744"
                  />
                  <Text style={styles.optionTitle}>Delete Stream</Text>
                </View>
                <Text style={styles.optionDescription}>
                  Stream will be permanently removed.
                  {'\n'}This action cannot be undone.
                </Text>
                <TouchableOpacity
                  style={[
                    styles.deleteButton,
                    isProcessing && styles.deleteButtonDisabled,
                  ]}
                  onPress={handleDelete}
                  disabled={isProcessing}
                >
                  {isProcessing && selectedAction === 'delete' ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.deleteButtonText}>Delete Stream</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {isPracticeMode && (
            <View style={styles.practiceActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                disabled={isProcessing}
              >
                <Text style={styles.cancelButtonText}>Continue Practice</Text>
              </TouchableOpacity>
              <View style={styles.endPracticeButton}>
                <GradientButton
                  title={isProcessing ? 'Ending...' : 'End Practice'}
                  onPress={handleSave}
                  size="medium"
                  disabled={isProcessing}
                />
              </View>
            </View>
          )}

          {!isPracticeMode && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isProcessing}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  statsBox: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  description: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  optionsContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 20,
  },
  optionCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  optionDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  optionButton: {
    width: '100%',
  },
  deleteButton: {
    backgroundColor: '#FF1744',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  practiceActions: {
    width: '100%',
    gap: 12,
    marginBottom: 12,
  },
  endPracticeButton: {
    width: '100%',
  },
  cancelButton: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
});
