
import React, { useState, useEffect, useCallback } from 'react';
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
import { appealsService, AdminPenalty } from '@/app/services/appealsService';

export default function AppealsCenterScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [penalties, setPenalties] = useState<AdminPenalty[]>([]);
  const [appeals, setAppeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appealModalVisible, setAppealModalVisible] = useState(false);
  const [selectedPenalty, setSelectedPenalty] = useState<AdminPenalty | null>(null);
  const [appealReason, setAppealReason] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');

  const loadData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [penaltiesData, appealsData] = await Promise.all([
        appealsService.getUserPenalties(user.id),
        appealsService.getUserAppeals(user.id),
      ]);

      setPenalties(penaltiesData);
      setAppeals(appealsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAppealPenalty = (penalty: AdminPenalty) => {
    // Check if already appealed
    const existingAppeal = appeals.find(
      a => a.penalty_id === penalty.id && a.status === 'pending'
    );

    if (existingAppeal) {
      Alert.alert('Already Appealed', 'You have already submitted an appeal for this penalty.');
      return;
    }

    setSelectedPenalty(penalty);
    setAppealReason('');
    setScreenshotUrl('');
    setAppealModalVisible(true);
  };

  const submitAppeal = async () => {
    if (!user || !selectedPenalty) return;

    if (appealReason.length < 10) {
      Alert.alert('Error', 'Appeal reason must be at least 10 characters');
      return;
    }

    const result = await appealsService.submitAppeal(
      user.id,
      selectedPenalty.id,
      appealReason,
      screenshotUrl || undefined
    );

    if (result.success) {
      Alert.alert('Success', 'Your appeal has been submitted and is under review.');
      setAppealModalVisible(false);
      loadData();
    } else {
      Alert.alert('Error', result.error || 'Failed to submit appeal');
    }
  };

  const renderPenalty = (penalty: AdminPenalty) => {
    const isActive = penalty.is_active && (!penalty.expires_at || new Date(penalty.expires_at) > new Date());
    const hasAppeal = appeals.some(a => a.penalty_id === penalty.id);

    return (
      <View
        key={penalty.id}
        style={[
          styles.penaltyCard,
          { backgroundColor: colors.card, borderColor: colors.border },
          isActive && { borderLeftWidth: 4, borderLeftColor: '#FF3B30' }
        ]}
      >
        <View style={styles.penaltyHeader}>
          <View style={styles.penaltyInfo}>
            <Text style={[styles.penaltyType, { color: colors.text }]}>
              {penalty.severity === 'permanent' ? '🚫 Permanent Ban' : '⏱️ Temporary Ban'}
            </Text>
            {isActive && (
              <View style={[styles.activeBadge, { backgroundColor: '#FF3B30' }]}>
                <Text style={styles.activeBadgeText}>ACTIVE</Text>
              </View>
            )}
          </View>
        </View>

        <Text style={[styles.penaltyReason, { color: colors.text }]}>
          Reason: {penalty.reason}
        </Text>

        {penalty.duration_hours && (
          <Text style={[styles.penaltyDuration, { color: colors.textSecondary }]}>
            Duration: {penalty.duration_hours} hours
          </Text>
        )}

        {penalty.expires_at && (
          <Text style={[styles.penaltyExpiry, { color: colors.textSecondary }]}>
            Expires: {new Date(penalty.expires_at).toLocaleString()}
          </Text>
        )}

        <Text style={[styles.penaltyDate, { color: colors.textSecondary }]}>
          Issued: {new Date(penalty.issued_at).toLocaleString()}
        </Text>

        {isActive && !hasAppeal && (
          <TouchableOpacity
            style={[styles.appealButton, { backgroundColor: colors.gradientEnd }]}
            onPress={() => handleAppealPenalty(penalty)}
          >
            <IconSymbol
              ios_icon_name="doc.text"
              android_material_icon_name="description"
              size={16}
              color="#FFFFFF"
            />
            <Text style={styles.appealButtonText}>Appeal Decision</Text>
          </TouchableOpacity>
        )}

        {hasAppeal && (
          <View style={[styles.appealedBadge, { backgroundColor: colors.background }]}>
            <Text style={[styles.appealedText, { color: colors.textSecondary }]}>
              Appeal Submitted
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderAppeal = (appeal: any) => {
    const statusColor = 
      appeal.status === 'pending' ? '#FF9500' :
      appeal.status === 'approved' ? '#34C759' :
      '#FF3B30';

    return (
      <View
        key={appeal.id}
        style={[styles.appealCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.appealHeader}>
          <Text style={[styles.appealTitle, { color: colors.text }]}>
            Appeal #{appeal.id.substring(0, 8)}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>
              {appeal.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={[styles.appealReason, { color: colors.text }]} numberOfLines={3}>
          {appeal.appeal_reason}
        </Text>

        {appeal.resolution_message && (
          <View style={[styles.resolutionBox, { backgroundColor: colors.background }]}>
            <Text style={[styles.resolutionLabel, { color: colors.textSecondary }]}>
              Admin Response:
            </Text>
            <Text style={[styles.resolutionMessage, { color: colors.text }]}>
              {appeal.resolution_message}
            </Text>
          </View>
        )}

        <Text style={[styles.appealDate, { color: colors.textSecondary }]}>
          Submitted: {new Date(appeal.created_at).toLocaleString()}
        </Text>

        {appeal.reviewed_at && (
          <Text style={[styles.appealDate, { color: colors.textSecondary }]}>
            Reviewed: {new Date(appeal.reviewed_at).toLocaleString()}
          </Text>
        )}
      </View>
    );
  };

  const activePenalties = penalties.filter(p => 
    p.is_active && (!p.expires_at || new Date(p.expires_at) > new Date())
  );
  const historicalPenalties = penalties.filter(p => 
    !p.is_active || (p.expires_at && new Date(p.expires_at) <= new Date())
  );

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Appeals Center</Text>
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
        {/* Active Penalties */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Active Penalties
          </Text>
          {activePenalties.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No active penalties
            </Text>
          ) : (
            activePenalties.map(renderPenalty)
          )}
        </View>

        {/* Historical Penalties */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Historical Penalties
          </Text>
          {historicalPenalties.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No historical penalties
            </Text>
          ) : (
            historicalPenalties.map(renderPenalty)
          )}
        </View>

        {/* Appeals */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Your Appeals
          </Text>
          {appeals.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No appeals submitted
            </Text>
          ) : (
            appeals.map(renderAppeal)
          )}
        </View>
      </ScrollView>

      {/* Appeal Modal */}
      <Modal
        visible={appealModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAppealModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Submit Appeal
              </Text>
              <TouchableOpacity onPress={() => setAppealModalVisible(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedPenalty && (
                <>
                  <View style={[styles.penaltyPreview, { backgroundColor: colors.background }]}>
                    <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
                      Penalty:
                    </Text>
                    <Text style={[styles.previewText, { color: colors.text }]}>
                      {selectedPenalty.severity === 'permanent' ? 'Permanent Ban' : 'Temporary Ban'}
                    </Text>
                    <Text style={[styles.previewReason, { color: colors.text }]}>
                      {selectedPenalty.reason}
                    </Text>
                  </View>

                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
                    Appeal Reason (min 10 characters):
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    placeholder="Explain why you believe this penalty should be reversed..."
                    placeholderTextColor={colors.textSecondary}
                    value={appealReason}
                    onChangeText={setAppealReason}
                    multiline
                    numberOfLines={5}
                  />

                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
                    Screenshot URL (Optional):
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    placeholder="https://..."
                    placeholderTextColor={colors.textSecondary}
                    value={screenshotUrl}
                    onChangeText={setScreenshotUrl}
                  />

                  <View style={[styles.warningBox, { backgroundColor: 'rgba(255, 59, 48, 0.1)', borderColor: '#FF3B30' }]}>
                    <IconSymbol
                      ios_icon_name="exclamationmark.triangle"
                      android_material_icon_name="warning"
                      size={20}
                      color="#FF3B30"
                    />
                    <Text style={[styles.warningText, { color: '#FF3B30' }]}>
                      Note: Permanent bans for extreme cases (sexual content involving minors, terror-related content, fraud) cannot be appealed.
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: colors.gradientEnd }]}
                    onPress={submitAppeal}
                  >
                    <Text style={styles.submitButtonText}>Submit Appeal</Text>
                  </TouchableOpacity>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    paddingVertical: 20,
  },
  penaltyCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  penaltyHeader: {
    marginBottom: 12,
  },
  penaltyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  penaltyType: {
    fontSize: 16,
    fontWeight: '700',
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  penaltyReason: {
    fontSize: 14,
    marginBottom: 8,
  },
  penaltyDuration: {
    fontSize: 13,
    marginBottom: 4,
  },
  penaltyExpiry: {
    fontSize: 13,
    marginBottom: 4,
  },
  penaltyDate: {
    fontSize: 12,
    marginBottom: 12,
  },
  appealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
  },
  appealButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  appealedBadge: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  appealedText: {
    fontSize: 14,
    fontWeight: '600',
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
    alignItems: 'center',
    marginBottom: 12,
  },
  appealTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  appealReason: {
    fontSize: 14,
    marginBottom: 12,
  },
  resolutionBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  resolutionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  resolutionMessage: {
    fontSize: 14,
  },
  appealDate: {
    fontSize: 12,
    marginBottom: 4,
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
  penaltyPreview: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  previewText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  previewReason: {
    fontSize: 14,
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
    textAlignVertical: 'top',
  },
  warningBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 20,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});