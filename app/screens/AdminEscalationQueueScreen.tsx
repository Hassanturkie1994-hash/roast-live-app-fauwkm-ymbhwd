
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
import { escalationService } from '@/app/services/escalationService';

export default function AdminEscalationQueueScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [escalations, setEscalations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [userHistory, setUserHistory] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [penaltyModalVisible, setPenaltyModalVisible] = useState(false);
  const [reason, setReason] = useState('');
  const [evidenceLink, setEvidenceLink] = useState('');
  const [policyReference, setPolicyReference] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<number | null>(24);

  useEffect(() => {
    loadEscalations();
  }, []);

  const loadEscalations = async () => {
    setLoading(true);
    try {
      const items = await escalationService.getAdminEscalationQueue();
      setEscalations(items);
    } catch (error) {
      console.error('Error loading escalations:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEscalations();
    setRefreshing(false);
  };

  const handleViewDetails = async (item: any) => {
    setSelectedItem(item);
    
    // Load user history
    const history = await escalationService.getUserHistory(item.user_id);
    setUserHistory(history);
    
    setModalVisible(true);
  };

  const handleApplyPenalty = () => {
    setModalVisible(false);
    setPenaltyModalVisible(true);
    setReason('');
    setEvidenceLink('');
    setPolicyReference('');
    setSelectedDuration(24);
  };

  const confirmPenalty = async (severity: 'temporary' | 'permanent') => {
    if (!user || !selectedItem || !reason) {
      Alert.alert('Error', 'Please provide a reason for the penalty');
      return;
    }

    const result = await escalationService.adminApplyPenalty(
      selectedItem.user_id,
      user.id,
      severity,
      reason,
      severity === 'temporary' ? selectedDuration || undefined : undefined,
      evidenceLink || undefined,
      policyReference || undefined
    );

    if (result.success) {
      Alert.alert('Success', 'Penalty applied successfully');
      setPenaltyModalVisible(false);
      loadEscalations();
    } else {
      Alert.alert('Error', result.error || 'Failed to apply penalty');
    }
  };

  const renderEscalationItem = (item: any) => {
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.escalationCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => handleViewDetails(item)}
      >
        <View style={styles.escalationHeader}>
          <View style={styles.userInfo}>
            <Text style={[styles.username, { color: colors.text }]}>
              {item.profiles?.username || 'Unknown User'}
            </Text>
            <Text style={[styles.moderatorText, { color: colors.textSecondary }]}>
              Escalated by: {item.moderator?.username || 'Unknown'}
            </Text>
          </View>
          <View style={[styles.urgentBadge, { backgroundColor: '#FF3B30' }]}>
            <Text style={styles.urgentText}>URGENT</Text>
          </View>
        </View>

        <View style={[styles.categoryBadge, { backgroundColor: colors.background }]}>
          <Text style={[styles.categoryText, { color: colors.text }]}>
            {item.category.replace('_', ' ').toUpperCase()}
          </Text>
        </View>

        <Text style={[styles.contentPreview, { color: colors.text }]} numberOfLines={2}>
          {item.content_preview}
        </Text>

        <Text style={[styles.moderatorNotes, { color: colors.textSecondary }]} numberOfLines={2}>
          Notes: {item.moderator_notes || 'No notes provided'}
        </Text>

        <View style={styles.escalationFooter}>
          <Text style={[styles.timeText, { color: colors.textSecondary }]}>
            {new Date(item.created_at).toLocaleString()}
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Admin Escalation Queue</Text>
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
        {escalations.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="checkmark.circle"
              android_material_icon_name="check_circle"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No escalated items
            </Text>
          </View>
        ) : (
          escalations.map(renderEscalationItem)
        )}
      </ScrollView>

      {/* Details Modal */}
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
                User History & Details
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
              {selectedItem && userHistory && (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Last 20 Messages
                  </Text>
                  <Text style={[styles.historyCount, { color: colors.textSecondary }]}>
                    {userHistory.messages.length} violations found
                  </Text>

                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Strike Logs
                  </Text>
                  <Text style={[styles.historyCount, { color: colors.textSecondary }]}>
                    {userHistory.strikes.length} strikes
                  </Text>

                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Timeout History
                  </Text>
                  <Text style={[styles.historyCount, { color: colors.textSecondary }]}>
                    {userHistory.timeouts.length} timeouts
                  </Text>

                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Ban Status
                  </Text>
                  <Text style={[styles.historyCount, { color: colors.textSecondary }]}>
                    {userHistory.bans.length} bans
                  </Text>

                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Admin Penalties
                  </Text>
                  <Text style={[styles.historyCount, { color: colors.textSecondary }]}>
                    {userHistory.penalties.length} penalties
                  </Text>

                  <TouchableOpacity
                    style={[styles.applyPenaltyButton, { backgroundColor: colors.gradientEnd }]}
                    onPress={handleApplyPenalty}
                  >
                    <Text style={styles.applyPenaltyButtonText}>Apply Penalty</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Penalty Modal */}
      <Modal
        visible={penaltyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPenaltyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Apply Admin Penalty
              </Text>
              <TouchableOpacity onPress={() => setPenaltyModalVisible(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
                Reason (Required):
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Enter reason for penalty..."
                placeholderTextColor={colors.textSecondary}
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={3}
              />

              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
                Evidence Link (Optional):
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="https://..."
                placeholderTextColor={colors.textSecondary}
                value={evidenceLink}
                onChangeText={setEvidenceLink}
              />

              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
                Policy Reference (Optional):
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Section 3.2..."
                placeholderTextColor={colors.textSecondary}
                value={policyReference}
                onChangeText={setPolicyReference}
              />

              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
                Duration:
              </Text>
              <View style={styles.durationButtons}>
                {[24, 168, 720].map((hours) => (
                  <TouchableOpacity
                    key={hours}
                    style={[
                      styles.durationButton,
                      { borderColor: colors.border },
                      selectedDuration === hours && { backgroundColor: colors.gradientEnd, borderColor: colors.gradientEnd }
                    ]}
                    onPress={() => setSelectedDuration(hours)}
                  >
                    <Text style={[
                      styles.durationButtonText,
                      { color: selectedDuration === hours ? '#FFFFFF' : colors.text }
                    ]}>
                      {hours === 24 ? '24 hrs' : hours === 168 ? '7 days' : '30 days'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.penaltyButton, { backgroundColor: '#FF9500' }]}
                onPress={() => confirmPenalty('temporary')}
              >
                <Text style={styles.penaltyButtonText}>Apply Temporary Ban</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.penaltyButton, { backgroundColor: '#FF3B30' }]}
                onPress={() => confirmPenalty('permanent')}
              >
                <Text style={styles.penaltyButtonText}>Apply Permanent Ban</Text>
              </TouchableOpacity>
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
  escalationCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  escalationHeader: {
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
  moderatorText: {
    fontSize: 13,
    fontWeight: '500',
  },
  urgentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  contentPreview: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  moderatorNotes: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  escalationFooter: {
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
    marginBottom: 8,
  },
  historyCount: {
    fontSize: 14,
    marginBottom: 12,
  },
  applyPenaltyButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  applyPenaltyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
    minHeight: 50,
  },
  durationButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  durationButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  durationButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  penaltyButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  penaltyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});