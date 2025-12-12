
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

interface StreamDelaySelectorProps {
  selectedDelay: 0 | 3 | 5 | 10;
  onSelectDelay: (delay: 0 | 3 | 5 | 10) => void;
}

const DELAY_OPTIONS: { value: 0 | 3 | 5 | 10; label: string; description: string }[] = [
  { value: 0, label: 'No Delay', description: 'Real-time streaming' },
  { value: 3, label: '3 Seconds', description: 'Quick moderation window' },
  { value: 5, label: '5 Seconds', description: 'Balanced delay' },
  { value: 10, label: '10 Seconds', description: 'Maximum moderation time' },
];

export default function StreamDelaySelector({
  selectedDelay,
  onSelectDelay,
}: StreamDelaySelectorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconSymbol
          ios_icon_name="clock.fill"
          android_material_icon_name="schedule"
          size={20}
          color={colors.gradientEnd}
        />
        <Text style={styles.title}>Stream Delay</Text>
      </View>

      <Text style={styles.description}>
        Add a delay to your stream to give moderators time to remove inappropriate comments before they appear to viewers. This only affects UI rendering, not the actual stream.
      </Text>

      <View style={styles.optionsContainer}>
        {DELAY_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              selectedDelay === option.value && styles.optionButtonSelected,
            ]}
            onPress={() => onSelectDelay(option.value)}
            activeOpacity={0.7}
          >
            <View style={styles.optionLeft}>
              <Text
                style={[
                  styles.optionLabel,
                  selectedDelay === option.value && styles.optionLabelSelected,
                ]}
              >
                {option.label}
              </Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </View>
            {selectedDelay === option.value && (
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={24}
                color={colors.text}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.infoBox}>
        <IconSymbol
          ios_icon_name="info.circle.fill"
          android_material_icon_name="info"
          size={16}
          color={colors.gradientEnd}
        />
        <Text style={styles.infoText}>
          Stream delay does not affect Cloudflare publishing or re-encode your stream. It only delays when chat messages appear in the UI.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  description: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  optionButtonSelected: {
    backgroundColor: colors.gradientEnd,
    borderColor: colors.gradientEnd,
  },
  optionLeft: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  optionLabelSelected: {
    color: colors.text,
  },
  optionDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderColor: colors.gradientEnd,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 16,
  },
});