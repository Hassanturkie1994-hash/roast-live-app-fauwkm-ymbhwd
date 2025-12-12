
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';

export type ContentLabel = 'family_friendly' | 'roast_mode' | 'adult_only';

interface ContentLabelModalProps {
  visible: boolean;
  onSelect: (label: ContentLabel) => void;
  onCancel: () => void;
}

export default function ContentLabelModal({
  visible,
  onSelect,
  onCancel,
}: ContentLabelModalProps) {
  const [selectedLabel, setSelectedLabel] = useState<ContentLabel | null>(null);

  const handleConfirm = () => {
    if (selectedLabel) {
      onSelect(selectedLabel);
    }
  };

  const labels = [
    {
      value: 'family_friendly' as ContentLabel,
      icon: '⭐',
      title: 'Family Friendly',
      description: 'Suitable for all ages. Clean content with no explicit language or themes.',
      color: '#4CAF50',
    },
    {
      value: 'roast_mode' as ContentLabel,
      icon: '🔥',
      title: 'Roast & Comedy Mode',
      description: 'Comedic roasting and banter. May contain mild language and jokes.',
      color: '#FF9800',
    },
    {
      value: 'adult_only' as ContentLabel,
      icon: '🔞',
      title: '18+ Restricted',
      description: 'Explicit roast content. Strong language and adult themes. Age verification required.',
      color: colors.gradientEnd,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Content Label</Text>
            <Text style={styles.subtitle}>
              Choose the appropriate content rating for your stream
            </Text>
          </View>

          <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
            {labels.map((label) => (
              <TouchableOpacity
                key={label.value}
                style={[
                  styles.option,
                  selectedLabel === label.value && styles.optionSelected,
                  { borderColor: label.color },
                ]}
                onPress={() => setSelectedLabel(label.value)}
                activeOpacity={0.7}
              >
                <View style={styles.optionHeader}>
                  <Text style={styles.optionIcon}>{label.icon}</Text>
                  <View style={styles.optionTitleContainer}>
                    <Text style={styles.optionTitle}>{label.title}</Text>
                    {selectedLabel === label.value && (
                      <IconSymbol
                        ios_icon_name="checkmark.circle.fill"
                        android_material_icon_name="check_circle"
                        size={24}
                        color={label.color}
                      />
                    )}
                  </View>
                </View>
                <Text style={styles.optionDescription}>{label.description}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.warningBox}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={20}
              color={colors.gradientEnd}
            />
            <Text style={styles.warningText}>
              Misrepresenting your content may result in strikes or suspension
            </Text>
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.confirmButton}>
              <GradientButton
                title="Confirm"
                onPress={handleConfirm}
                size="medium"
                disabled={!selectedLabel}
              />
            </View>
          </View>
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
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  optionsContainer: {
    marginBottom: 16,
  },
  option: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  optionSelected: {
    borderWidth: 3,
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  optionTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    marginLeft: 44,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderColor: colors.gradientEnd,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 16,
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
  confirmButton: {
    flex: 1,
  },
});