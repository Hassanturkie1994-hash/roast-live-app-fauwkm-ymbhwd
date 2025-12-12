
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { fanClubService } from '@/app/services/fanClubService';

interface BadgeEditorModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  currentBadgeName: string;
  currentBadgeColor: string;
  onUpdate: () => void;
}

const BADGE_COLORS = [
  '#FF1493', // Deep Pink
  '#FFD700', // Gold
  '#FF4500', // Orange Red
  '#9370DB', // Medium Purple
  '#00CED1', // Dark Turquoise
  '#FF69B4', // Hot Pink
  '#32CD32', // Lime Green
  '#FF6347', // Tomato
  '#FF1744', // Red
  '#00E676', // Green
  '#00B0FF', // Blue
  '#FF9100', // Orange
];

export default function BadgeEditorModal({
  visible,
  onClose,
  userId,
  currentBadgeName,
  currentBadgeColor,
  onUpdate,
}: BadgeEditorModalProps) {
  const [badgeName, setBadgeName] = useState(currentBadgeName);
  const [selectedColor, setSelectedColor] = useState(currentBadgeColor);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!badgeName.trim()) {
      Alert.alert('Error', 'Please enter a badge name');
      return;
    }

    if (badgeName.length > 5) {
      Alert.alert('Error', 'Badge name must be 5 characters or less');
      return;
    }

    setIsLoading(true);
    const result = await fanClubService.updateFanClub(userId, badgeName.trim(), selectedColor);
    setIsLoading(false);

    if (result.success) {
      Alert.alert('Success', 'Badge updated successfully!');
      onUpdate();
      onClose();
    } else {
      Alert.alert('Error', result.error || 'Failed to update badge');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Creator Badge Editor</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          {/* Badge Preview */}
          <View style={styles.previewContainer}>
            <Text style={styles.previewLabel}>Preview</Text>
            <View style={[styles.badgePreview, { backgroundColor: selectedColor }]}>
              <IconSymbol
                ios_icon_name="heart.fill"
                android_material_icon_name="favorite"
                size={16}
                color={colors.text}
              />
              <Text style={styles.badgePreviewText}>{badgeName || 'VIP'}</Text>
            </View>
          </View>

          {/* Badge Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Badge Text (max 5 characters)</Text>
            <TextInput
              style={styles.input}
              placeholder="VIP"
              placeholderTextColor={colors.placeholder}
              value={badgeName}
              onChangeText={setBadgeName}
              maxLength={5}
              autoCapitalize="characters"
            />
            <Text style={styles.charCount}>{badgeName.length}/5</Text>
          </View>

          {/* Color Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Badge Color</Text>
            <View style={styles.colorGrid}>
              {BADGE_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                >
                  {selectedColor === color && (
                    <IconSymbol
                      ios_icon_name="checkmark"
                      android_material_icon_name="check"
                      size={20}
                      color="#FFFFFF"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  closeButton: {
    padding: 8,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 20,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  badgePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgePreviewText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 16,
  },
  charCount: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'right',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: colors.text,
  },
  saveButton: {
    backgroundColor: colors.gradientEnd,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
});