
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';

interface EndStreamModalProps {
  visible: boolean;
  onClose: () => void;
  onEndStream: () => void;
  streamTitle: string;
  duration: number;
  peakViewers: number;
  totalViewers: number;
  isEnding?: boolean;
}

export default function EndStreamModal({
  visible,
  onClose,
  onEndStream,
  streamTitle,
  duration,
  peakViewers,
  totalViewers,
  isEnding = false,
}: EndStreamModalProps) {
  const { colors } = useTheme();

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <IconSymbol
              ios_icon_name="stop.circle.fill"
              android_material_icon_name="stop_circle"
              size={48}
              color={colors.brandPrimary}
            />
            <Text style={[styles.title, { color: colors.text }]}>
              End Stream?
            </Text>
          </View>

          <View style={styles.stats}>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Stream Title:
              </Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {streamTitle}
              </Text>
            </View>

            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Duration:
              </Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatDuration(duration)}
              </Text>
            </View>

            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Peak Viewers:
              </Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {peakViewers}
              </Text>
            </View>

            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Total Viewers:
              </Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {totalViewers}
              </Text>
            </View>
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={onClose}
              disabled={isEnding}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.endButton, { backgroundColor: colors.brandPrimary }]}
              onPress={onEndStream}
              disabled={isEnding}
            >
              {isEnding ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                  End Stream
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 12,
  },
  stats: {
    marginBottom: 24,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  endButton: {
    // backgroundColor set via props
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
