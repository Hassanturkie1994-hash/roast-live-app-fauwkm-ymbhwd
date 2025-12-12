
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { appealsService } from '@/app/services/appealsService';

export default function AdminAppealsReviewScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [appeals, setAppeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAppeal, setSelectedAppeal] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [resolutionMessage, setResolutionMessage] = useState('');

  useEffect(() => {
    loadAppeals();
  }, []);

  const loadAppeals = async () => {
    setLoading(true);
    try {
      const data = await appealsService.getPendingAppeals();
      setAppeals(data);
    } catch (error) {
      console.error('Error loading appeals:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppeals();
    setRefreshing(false);
  };

  const handleViewAppeal = async (appeal: any) => {
    const fullAppeal = await appealsService.getAppealWithContext(appeal.id);
    setSelectedAppeal(fullAppeal);
    setResolutionMessage('');
    setModalVisible(true);
  };

  const handleAcceptAppeal = async () => {
    if (!user || !selectedAppeal || !resolutionMessage) {
      Alert.alert('Error', 'Please provide a resolution message');
      return;
    }

    const result = await appealsService.acceptAppeal(
      selectedAppeal.id,
      user.id,
      resolutionMessage
    );

    if (result.success) {
      Alert.alert('Success', 'Appeal accepted');
      setModalVisible(false);
      loadAppeals();
    } else {
      Alert.alert('Error', result.error || 'Failed to accept appeal');
    }
  };

  const handleDenyAppeal = async () => {
    if (!user || !selectedAppeal || !resolutionMessage) {
      Alert.alert('Error', 'Please provide a resolution message');
      return;
    }

    const result = await appealsService.denyAppeal(
      selectedAppeal.id,
      user.id,
      resolutionMessage
    );

    if (result.success) {
      Alert.alert('Success', 'Appeal denied');
      setModalVisible(false);
      loadAppeals();
    } else {
      Alert.alert('Error', result.error || 'Failed to deny appeal');
    }
  };

  const renderAppeal = (appeal: any) => {
    return (
      <TouchableOpacity
        key={appeal.id}
        style={[styles.appealCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => handleViewAppeal(appeal)}
      >
        <View style={styles.appealHeader}>
          <View style={styles.userInfo}>
            <Text style={[styles.username, { color: colors.text }]}>
              {appeal.user?.username || 'Unknown User'}
            </Text>
            <Text style={[styles.appealId, { color: colors.textSecondary }]}>
              Appeal #{appeal.id.substring(0, 8)}
            </Text>
          </View>
          <View style={[styles.pendingBadge, { backgroundColor: '#FF9500' }]}>
            <Text style={styles.pendingText}>PENDING</Text>
          </View>
        </View>

        {appeal.penalty && (
          <View style={[styles.penaltyInfo, { backgroundColor: colors.background }]}>
            <Text style={[styles.penaltyLabel, { color: colors.textSecondary }]}>
              Penalty:
            </Text>
            <Text style={[styles.penaltyText, { color: colors.text }]}>
              {appeal.penalty.severity === 'permanent' ? 'Permanent Ban' : 'Temporary Ban'}
            </Text>
            <Text style={[styles.penaltyReason, { color: colors.text }]}>
              {appeal.penalty.reason}
            </Text>
          </View>
        )}

        <Text style={[styles.appealReason, { color: colors.text }]} numberOfLines={3}>
          {appeal.appeal_reason}
        </Text>

        <View style={styles.appealFooter}>
          <Text style={[styles.timeText, { color: colors.textSecondary }]}>
            {new Date(appeal.created_at).toLocaleString()}
          </Text>
          <TouchableOpacity style={[styles.reviewButton, { backgroundColor: colors.gradientEnd }]}>
            <Text style={styles.reviewButtonText}>Review</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={16}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Appeals Review</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {appeals.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="checkmark.circle"
              android_material_icon_name="check_circle"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No pending appeals
            </Text>
          </View>
        ) : (
          appeals.map(renderAppeal)
        )}
      </ScrollView>

      {/* Review Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Review Appeal
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedAppeal && (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Original Violation
                  </Text>
                  {selectedAppeal.penalty && (
                    <View style={[styles.infoBox, { backgroundColor: colors.background }]}>
                      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                        Penalty Type:
                      </Text>
                      <Text style={[styles.infoText, { color: colors.text }]}>
                        {selectedAppeal.penalty.severity === 'permanent' ? 'Permanent Ban' : 'Temporary Ban'}
                      </Text>
                      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                        Reason:
                      </Text>
                      <Text style={[styles.infoText, { color: colors.text }]}>
                        {selectedAppeal.penalty.reason}
                      </Text>
                    </View>
                  )}

                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Appeal Reason
                  </Text>
                  <Text style={[styles.appealReasonText, { color: colors.text }]}>
                    {selectedAppeal.appeal_reason}
                  </Text>

                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    User History
                  </Text>
                  <View style={[styles.historyBox, { backgroundColor: colors.background }]}>
                    <Text style={[styles.historyItem, { color: colors.text }]}>
                      Violations: {selectedAppeal.user_history?.violations?.length || 0}
                    </Text>
                    <Text style={[styles.historyItem, { color: colors.text }]}>
                      Strikes: {selectedAppeal.user_history?.strikes?.length || 0}
                    </Text>
                    <Text style={[styles.historyItem, { color: colors.text }]}>
                      Penalties: {selectedAppeal.user_history?.penalties?.length || 0}
                    </Text>
                  </View>

                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
                    Resolution Message:
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    placeholder="Enter resolution message..."
                    placeholderTextColor={colors.textSecondary}
                    value={resolutionMessage}
                    onChangeText={setResolutionMessage}
                    multiline
                    numberOfLines={3}
                  />

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#34C759' }]}
                      onPress={handleAcceptAppeal}
                    >
                      <IconSymbol
                        ios_icon_name="checkmark"
                        android_material_icon_name="check"
                        size={20}
                        color="#FFFFFF"
                      />
                      <Text style={styles.actionButtonText}>Accept Appeal</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#FF3B30' }]}
                      onPress={handleDenyAppeal}
                    >
                      <IconSymbol
                        ios_icon_name="xmark"
                        android_material_icon_name="close"
                        size={20}
                        color="#FFFFFF"
                      />
                      <Text style={styles.actionButtonText}>Deny Appeal</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  appealCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  appealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  appealId: {
    fontSize: 13,
    fontWeight: '500',
  },
  pendingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  penaltyInfo: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  penaltyLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  penaltyText: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  penaltyReason: {
    fontSize: 13,
  },
  appealReason: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  appealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reviewButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalBody: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 12,
  },
  infoBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
  },
  appealReasonText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  historyBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  historyItem: {
    fontSize: 14,
    marginBottom: 4,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});