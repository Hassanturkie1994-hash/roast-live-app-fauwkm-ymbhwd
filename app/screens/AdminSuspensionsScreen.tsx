
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';

export default function AdminSuspensionsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [suspensions, setSuspensions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSuspension, setSelectedSuspension] = useState<any | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  useEffect(() => {
    fetchSuspensions();
  }, []);

  const fetchSuspensions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('suspension_history')
        .select('*, profiles!suspension_history_user_id_fkey(*)')
        .or('end_at.is.null,end_at.gte.' + new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching suspensions:', error);
      } else {
        setSuspensions(data || []);
      }
    } catch (error) {
      console.error('Error in fetchSuspensions:', error);
    }
    setIsLoading(false);
  };

  const handleLiftBan = async () => {
    if (!selectedSuspension) return;

    Alert.alert(
      'Lift Ban',
      'Are you sure you want to lift this suspension?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Lift Ban',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('suspension_history')
                .update({ end_at: new Date().toISOString() })
                .eq('id', selectedSuspension.id);

              if (error) {
                Alert.alert('Error', 'Failed to lift ban');
              } else {
                Alert.alert('Success', 'Ban lifted successfully');
                setShowActionModal(false);
                setSelectedSuspension(null);
                fetchSuspensions();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to lift ban');
            }
          },
        },
      ]
    );
  };

  const handleExtendDuration = async () => {
    if (!selectedSuspension) return;

    Alert.prompt(
      'Extend Duration',
      'Enter number of days to extend:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Extend',
          onPress: async (days) => {
            const daysNum = parseInt(days || '0');
            if (isNaN(daysNum) || daysNum <= 0) {
              Alert.alert('Error', 'Please enter a valid number of days');
              return;
            }

            try {
              const currentEndAt = selectedSuspension.end_at
                ? new Date(selectedSuspension.end_at)
                : new Date();
              currentEndAt.setDate(currentEndAt.getDate() + daysNum);

              const { error } = await supabase
                .from('suspension_history')
                .update({ end_at: currentEndAt.toISOString() })
                .eq('id', selectedSuspension.id);

              if (error) {
                Alert.alert('Error', 'Failed to extend duration');
              } else {
                Alert.alert('Success', `Duration extended by ${daysNum} days`);
                setShowActionModal(false);
                setSelectedSuspension(null);
                fetchSuspensions();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to extend duration');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleSendWarning = async () => {
    if (!selectedSuspension || !user || !warningMessage.trim()) {
      Alert.alert('Error', 'Please enter a warning message');
      return;
    }

    try {
      const { error } = await supabase.from('notifications').insert({
        type: 'message',
        sender_id: user.id,
        receiver_id: selectedSuspension.user_id,
        message: `Admin Warning: ${warningMessage}`,
      });

      if (error) {
        Alert.alert('Error', 'Failed to send warning');
      } else {
        Alert.alert('Success', 'Warning sent successfully');
        setWarningMessage('');
        setShowActionModal(false);
        setSelectedSuspension(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send warning');
    }
  };

  const getStatusColor = (suspension: any) => {
    if (!suspension.end_at) return '#DC143C'; // Permanent
    const endDate = new Date(suspension.end_at);
    const now = new Date();
    if (endDate > now) return '#FFA500'; // Active
    return colors.textSecondary; // Expired
  };

  const getStatusText = (suspension: any) => {
    if (!suspension.end_at) return 'Permanent';
    const endDate = new Date(suspension.end_at);
    const now = new Date();
    if (endDate > now) {
      const diff = endDate.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      return `${days} days remaining`;
    }
    return 'Expired';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Active Suspensions</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {suspensions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No active suspensions
              </Text>
            </View>
          ) : (
            suspensions.map((suspension, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.suspensionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => {
                  setSelectedSuspension(suspension);
                  setShowActionModal(true);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.suspensionHeader}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(suspension) },
                    ]}
                  >
                    <Text style={styles.statusText}>{suspension.suspension_type}</Text>
                  </View>
                  <Text style={[styles.statusDuration, { color: colors.textSecondary }]}>
                    {getStatusText(suspension)}
                  </Text>
                </View>

                <View style={styles.suspensionContent}>
                  <Text style={[styles.suspensionUser, { color: colors.text }]}>
                    {suspension.profiles?.display_name || suspension.profiles?.username || 'Unknown User'}
                  </Text>
                  <Text style={[styles.suspensionReason, { color: colors.textSecondary }]}>
                    {suspension.reason}
                  </Text>
                  <Text style={[styles.suspensionDate, { color: colors.textSecondary }]}>
                    Started: {new Date(suspension.start_at).toLocaleDateString()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* Action Modal */}
      <Modal
        visible={showActionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Suspension Actions</Text>
              <TouchableOpacity onPress={() => setShowActionModal(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            {selectedSuspension && (
              <>
                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>User</Text>
                  <Text style={[styles.modalValue, { color: colors.text }]}>
                    {selectedSuspension.profiles?.display_name || selectedSuspension.profiles?.username}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Reason</Text>
                  <Text style={[styles.modalValue, { color: colors.text }]}>
                    {selectedSuspension.reason}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Send Warning Message</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: colors.backgroundAlt, color: colors.text, borderColor: colors.border }]}
                    placeholder="Enter warning message..."
                    placeholderTextColor={colors.placeholder}
                    value={warningMessage}
                    onChangeText={setWarningMessage}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalActionButton, { backgroundColor: '#4ECDC4' }]}
                    onPress={handleSendWarning}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalActionButtonText}>Send Warning</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalActionButton, { backgroundColor: '#FFA500' }]}
                    onPress={handleExtendDuration}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalActionButtonText}>Extend Duration</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalActionButton, { backgroundColor: colors.brandPrimary }]}
                    onPress={handleLiftBan}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalActionButtonText}>Lift Ban</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  suspensionCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  suspensionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  statusDuration: {
    fontSize: 12,
    fontWeight: '600',
  },
  suspensionContent: {
    gap: 6,
  },
  suspensionUser: {
    fontSize: 18,
    fontWeight: '700',
  },
  suspensionReason: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  suspensionDate: {
    fontSize: 12,
    fontWeight: '400',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalSection: {
    marginBottom: 20,
    gap: 8,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalValue: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
  },
  modalInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
  },
  modalActions: {
    gap: 12,
    marginTop: 8,
  },
  modalActionButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalActionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});