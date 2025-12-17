
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
import { unifiedVIPClubService } from '@/app/services/unifiedVIPClubService';

interface UnifiedBadgeEditorModalProps {
  visible: boolean;
  onClose: () => void;
  creatorId: string;
  currentClubName: string;
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

export default function UnifiedBadgeEditorModal({
  visible,
  onClose,
  creatorId,
  currentClubName,
  currentBadgeName,
  currentBadgeColor,
  onUpdate,
}: UnifiedBadgeEditorModalProps) {
  const [clubName, setClubName] = useState(currentClubName);
  const [badgeName, setBadgeName] = useState(currentBadgeName);
  const [selectedColor, setSelectedColor] = useState(currentBadgeColor);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!clubName.trim() || !badgeName.trim()) {
      Alert.alert('Error', 'Please enter both club name and badge name');
      return;
    }

    if (clubName.length > 32) {
      Alert.alert('Error', 'Club name must be 32 characters or less');
      return;
    }

    if (badgeName.length > 20) {
      Alert.alert('Error', 'Badge name must be 20 characters or less');
      return;
    }

    setIsLoading(true);
    const result = await unifiedVIPClubService.updateVIPClub(creatorId, {
      club_name: clubName.trim(),
      badge_name: badgeName.trim(),
      badge_color: selectedColor,
    });
    setIsLoading(false);

    if (result.success) {
      Alert.alert('Success', 'VIP Club updated successfully!');
      onUpdate();
      onClose();
    } else {
      Alert.alert('Error', result.error || 'Failed to update VIP Club');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Edit VIP Club</Text>
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
            <Text style={styles.previewLabel}>Badge Preview</Text>
            <View style={[styles.badgePreview, { backgroundColor: selectedColor }]}>
              <IconSymbol
                ios_icon_name="crown.fill"
                android_material_icon_name="workspace_premium"
                size={16}
                color="#FFFFFF"
              />
              <Text style={styles.badgePreviewText}>{badgeName || 'VIP'}²⁰</Text>
            </View>
            <Text style={styles.previewHint}>Level shown as superscript (1-20)</Text>
          </View>

          {/* Club Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Club Name (max 32 characters)</Text>
            <TextInput
              style={styles.input}
              placeholder="Elite Squad"
              placeholderTextColor={colors.placeholder}
              value={clubName}
              onChangeText={setClubName}
              maxLength={32}
            />
            <Text style={styles.charCount}>{clubName.length}/32</Text>
          </View>

          {/* Badge Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Badge Name (max 20 characters)</Text>
            <TextInput
              style={styles.input}
              placeholder="Rambo"
              placeholderTextColor={colors.placeholder}
              value={badgeName}
              onChangeText={setBadgeName}
              maxLength={20}
            />
            <Text style={styles.charCount}>{badgeName.length}/20</Text>
          </View>

          {/* Color Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Badge Color</Text>
            <View style={styles.colorGrid}>
              {BADGE_COLORS.map((color, index) => (
                <TouchableOpacity
                  key={`color-${index}`}
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
              <ActivityIndicator size="small" color="#FFFFFF" />
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
    marginBottom: 8,
  },
  badgePreviewText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  previewHint: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.textSecondary,
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
    backgroundColor: colors.brandPrimary,
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
    color: '#FFFFFF',
  },
});
