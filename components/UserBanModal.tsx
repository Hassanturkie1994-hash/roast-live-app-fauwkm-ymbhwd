
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';

interface UserBanModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  username: string;
  onBanComplete?: () => void;
}

export default function UserBanModal({
  visible,
  onClose,
  userId,
  username,
  onBanComplete,
}: UserBanModalProps) {
  const { user } = useAuth();
  const [banType, setBanType] = useState<'temporary' | 'permanent'>('temporary');
  const [duration, setDuration] = useState('24');
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState('');
  const [policyRef, setPolicyRef] = useState('');
  const [isBanning, setIsBanning] = useState(false);

  const handleBan = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    if (!reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for the ban');
      return;
    }

    setIsBanning(true);
    try {
      const durationHours = banType === 'temporary' ? parseInt(duration) : null;
      const expiresAt = durationHours
        ? new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString()
        : null;

      // Insert ban into admin_penalties table
      const { error: banError } = await supabase
        .from('admin_penalties')
        .insert({
          user_id: userId,
          admin_id: user.id,
          severity: banType,
          reason: reason.trim(),
          duration_hours: durationHours,
          evidence_link: evidence.trim() || null,
          policy_reference: policyRef.trim() || null,
          expires_at: expiresAt,
          is_active: true,
        });

      if (banError) {
        console.error('Error banning user:', banError);
        Alert.alert('Error', 'Failed to ban user');
        return;
      }

      // Send notification to banned user
      await supabase
        .from('notifications')
        .insert({
          sender_id: user.id,
          receiver_id: userId,
          type: 'warning',
          message: `You have been ${banType === 'permanent' ? 'permanently banned' : `banned for ${duration} hours`}. Reason: ${reason}`,
          category: 'admin',
          read: false,
        });

      // Log admin action
      await supabase
        .from('admin_actions_log')
        .insert({
          admin_user_id: user.id,
          target_user_id: userId,
          action_type: 'BAN',
          reason: reason.trim(),
          expires_at: expiresAt,
          metadata: {
            ban_type: banType,
            duration_hours: durationHours,
            evidence: evidence.trim(),
            policy_reference: policyRef.trim(),
          },
        });

      Alert.alert(
        'Success',
        `User @${username} has been ${banType === 'permanent' ? 'permanently banned' : `banned for ${duration} hours`}`
      );

      onBanComplete?.();
      onClose();
    } catch (error) {
      console.error('Error in handleBan:', error);
      Alert.alert('Error', 'Failed to ban user');
    } finally {
      setIsBanning(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ban User @{username}</Text>
            <TouchableOpacity onPress={onClose}>
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="cancel"
                size={28}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Ban Type */}
            <Text style={styles.label}>Ban Type</Text>
            <View style={styles.banTypeToggle}>
              <TouchableOpacity
                style={[styles.banTypeButton, banType === 'temporary' && styles.banTypeButtonActive]}
                onPress={() => setBanType('temporary')}
              >
                <IconSymbol
                  ios_icon_name="clock.fill"
                  android_material_icon_name="schedule"
                  size={20}
                  color={banType === 'temporary' ? '#FFFFFF' : colors.text}
                />
                <Text style={[styles.banTypeText, banType === 'temporary' && styles.banTypeTextActive]}>
                  Temporary
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.banTypeButton, banType === 'permanent' && styles.banTypeButtonActive]}
                onPress={() => setBanType('permanent')}
              >
                <IconSymbol
                  ios_icon_name="hand.raised.fill"
                  android_material_icon_name="block"
                  size={20}
                  color={banType === 'permanent' ? '#FFFFFF' : '#DC143C'}
                />
                <Text style={[styles.banTypeText, banType === 'permanent' && styles.banTypeTextActive]}>
                  Permanent
                </Text>
              </TouchableOpacity>
            </View>

            {/* Duration (if temporary) */}
            {banType === 'temporary' && (
              <>
                <Text style={styles.label}>Duration (hours)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="24"
                  placeholderTextColor={colors.textSecondary}
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="number-pad"
                />
              </>
            )}

            {/* Reason */}
            <Text style={styles.label}>Reason *</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Explain why this user is being banned..."
              placeholderTextColor={colors.textSecondary}
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Evidence Link */}
            <Text style={styles.label}>Evidence Link (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://..."
              placeholderTextColor={colors.textSecondary}
              value={evidence}
              onChangeText={setEvidence}
            />

            {/* Policy Reference */}
            <Text style={styles.label}>Policy Reference (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Section 4.2 - Harassment"
              placeholderTextColor={colors.textSecondary}
              value={policyRef}
              onChangeText={setPolicyRef}
            />

            {/* Warning */}
            <View style={styles.warningBox}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle.fill"
                android_material_icon_name="warning"
                size={20}
                color="#FFA500"
              />
              <Text style={styles.warningText}>
                This action will {banType === 'permanent' ? 'permanently ban' : 'temporarily suspend'} the user 
                from accessing the platform. They will be notified immediately.
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.banButton}
                onPress={handleBan}
                disabled={isBanning}
              >
                {isBanning ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.banButtonText}>
                    {banType === 'permanent' ? 'Permanent Ban' : 'Temporary Ban'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: colors.background,
    borderRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  banTypeToggle: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  banTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  banTypeButtonActive: {
    backgroundColor: '#DC143C',
    borderColor: '#DC143C',
  },
  banTypeText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  banTypeTextActive: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  textArea: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    minHeight: 100,
    marginBottom: 16,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    borderColor: '#FFA500',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginTop: 8,
    marginBottom: 24,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 18,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  banButton: {
    flex: 1,
    backgroundColor: '#DC143C',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  banButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
