
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
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import { appealsService, Appeal, AdminPenalty } from '@/app/services/appealsService';
import { LinearGradient } from 'expo-linear-gradient';

type TabType = 'active' | 'historical' | 'appeals';

export default function AppealsViolationsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [activePenalties, setActivePenalties] = useState<AdminPenalty[]>([]);
  const [historicalPenalties, setHistoricalPenalties] = useState<AdminPenalty[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [selectedPenalty, setSelectedPenalty] = useState<AdminPenalty | null>(null);
  const [appealReason, setAppealReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, activeTab]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const penalties = await appealsService.getUserPenalties(user.id);
      const userAppeals = await appealsService.getUserAppeals(user.id);

      // Separate active and historical penalties
      const now = new Date();
      const active = penalties.filter(p => 
        p.is_active && (!p.expires_at || new Date(p.expires_at) > now)
      );
      const historical = penalties.filter(p => 
        !p.is_active || (p.expires_at && new Date(p.expires_at) <= now)
      );

      setActivePenalties(active);
      setHistoricalPenalties(historical);
      setAppeals(userAppeals);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAppealClick = (penalty: AdminPenalty) => {
    setSelectedPenalty(penalty);
    setAppealReason('');
    setShowAppealForm(true);
  };

  const handleSubmitAppeal = async () => {
    if (!user || !selectedPenalty) return;

    if (appealReason.length < 10) {
      Alert.alert('Error', 'Appeal reason must be at least 10 characters');
      return;
    }

    setSubmitting(true);
    try {
      const result = await appealsService.submitAppeal(
        user.id,
        selectedPenalty.id,
        appealReason
      );

      if (result.success) {
        Alert.alert('Success', 'Your appeal has been submitted and is under review.');
        setShowAppealForm(false);
        setSelectedPenalty(null);
        setAppealReason('');
        await loadData();
      } else {
        Alert.alert('Error', result.error || 'Failed to submit appeal');
      }
    } catch (error) {
      console.error('Error submitting appeal:', error);
      Alert.alert('Error', 'Failed to submit appeal');
    } finally {
      setSubmitting(false);
    }
  };

  const renderPenaltyCard = (penalty: AdminPenalty, isActive: boolean) => {
    const hasAppeal = appeals.some(a => a.penalty_id === penalty.id);
    const pendingAppeal = appeals.find(a => a.penalty_id === penalty.id && a.status === 'pending');

    return (
      <View
        key={penalty.id}
        style={[
          styles.penaltyCard,
          { backgroundColor: colors.card, borderColor: colors.border },
          isActive && { borderLeftWidth: 4, borderLeftColor: colors.gradientEnd },
        ]}
      >
        <View style={styles.penaltyHeader}>
          <View style={styles.penaltyTitleRow}>
            <IconSymbol
              ios_icon_name={penalty.severity === 'permanent' ? 'hand.raised.fill' : 'exclamationmark.triangle.fill'}
              android_material_icon_name={penalty.severity === 'permanent' ? 'block' : 'warning'}
              size={24}
              color={penalty.severity === 'permanent' ? '#DC143C' : '#FFA500'}
            />
            <Text style={[styles.penaltySeverity, { color: colors.text }]}>
              {penalty.severity === 'permanent' ? 'Permanent Ban' : 'Temporary Suspension'}
            </Text>
          </View>
          {isActive && (
            <View style={[styles.activeBadge, { backgroundColor: colors.gradientEnd }]}>
              <Text style={styles.activeBadgeText}>ACTIVE</Text>
            </View>
          )}
        </View>

        <Text style={[styles.penaltyReason, { color: colors.textSecondary }]}>
          {penalty.reason}
        </Text>

        <View style={styles.penaltyDetails}>
          <View style={styles.penaltyDetailRow}>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="calendar_today"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={[styles.penaltyDetailText, { color: colors.textSecondary }]}>
              Issued: {new Date(penalty.issued_at).toLocaleDateString()}
            </Text>
          </View>

          {penalty.expires_at && (
            <View style={styles.penaltyDetailRow}>
              <IconSymbol
                ios_icon_name="clock"
                android_material_icon_name="schedule"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={[styles.penaltyDetailText, { color: colors.textSecondary }]}>
                Expires: {new Date(penalty.expires_at).toLocaleDateString()}
              </Text>
            </View>
          )}

          {penalty.duration_hours && (
            <View style={styles.penaltyDetailRow}>
              <IconSymbol
                ios_icon_name="hourglass"
                android_material_icon_name="hourglass_empty"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={[styles.penaltyDetailText, { color: colors.textSecondary }]}>
                Duration: {penalty.duration_hours} hours
              </Text>
            </View>
          )}
        </View>

        {penalty.policy_reference && (
          <Text style={[styles.policyReference, { color: colors.textSecondary }]}>
            Policy: {penalty.policy_reference}
          </Text>
        )}

        {isActive && !hasAppeal && (
          <TouchableOpacity
            style={[styles.appealButton, { backgroundColor: colors.primary }]}
            onPress={() => handleAppealClick(penalty)}
          >
            <Text style={styles.appealButtonText}>Appeal Decision</Text>
          </TouchableOpacity>
        )}

        {pendingAppeal && (
          <View style={[styles.appealStatusBadge, { backgroundColor: '#FFA500' }]}>
            <IconSymbol
              ios_icon_name="clock"
              android_material_icon_name="schedule"
              size={16}
              color="#FFFFFF"
            />
            <Text style={styles.appealStatusText}>Appeal Pending Review</Text>
          </View>
        )}
      </View>
    );
  };

  const renderAppealCard = (appeal: Appeal) => {
    const statusColor = 
      appeal.status === 'pending' ? '#FFA500' :
      appeal.status === 'approved' ? '#34C759' :
      '#DC143C';

    return (
      <View
        key={appeal.id}
        style={[
          styles.appealCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.appealHeader}>
          <Text style={[styles.appealTitle, { color: colors.text }]}>
            Appeal #{appeal.id.substring(0, 8)}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusBadgeText}>
              {appeal.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={[styles.appealReason, { color: colors.textSecondary }]}>
          {appeal.appeal_reason}
        </Text>

        <View style={styles.appealFooter}>
          <Text style={[styles.appealDate, { color: colors.textSecondary }]}>
            Submitted: {new Date(appeal.created_at).toLocaleDateString()}
          </Text>
          {appeal.reviewed_at && (
            <Text style={[styles.appealDate, { color: colors.textSecondary }]}>
              Reviewed: {new Date(appeal.reviewed_at).toLocaleDateString()}
            </Text>
          )}
        </View>

        {appeal.resolution_message && (
          <View style={[styles.resolutionBox, { backgroundColor: colors.background }]}>
            <Text style={[styles.resolutionLabel, { color: colors.text }]}>
              Admin Response:
            </Text>
            <Text style={[styles.resolutionMessage, { color: colors.textSecondary }]}>
              {appeal.resolution_message}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderAppealForm = () => {
    if (!showAppealForm || !selectedPenalty) return null;

    return (
      <View style={[styles.appealFormOverlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
        <View style={[styles.appealFormContainer, { backgroundColor: colors.card }]}>
          <View style={styles.appealFormHeader}>
            <Text style={[styles.appealFormTitle, { color: colors.text }]}>
              Submit Appeal
            </Text>
            <TouchableOpacity onPress={() => setShowAppealForm(false)}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <Text style={[styles.appealFormLabel, { color: colors.textSecondary }]}>
            Explain why you believe this decision should be reversed (minimum 10 characters):
          </Text>

          <TextInput
            style={[
              styles.appealFormInput,
              { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
            ]}
            placeholder="Enter your appeal reason..."
            placeholderTextColor={colors.textSecondary}
            value={appealReason}
            onChangeText={setAppealReason}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          <Text style={[styles.appealFormNote, { color: colors.textSecondary }]}>
            Note: Appeals for permanent bans involving sexual content with minors, terror-related content, or fraud cannot be reversed.
          </Text>

          <View style={styles.appealFormButtons}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={() => setShowAppealForm(false)}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleSubmitAppeal}
              disabled={submitting || appealReason.length < 10}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Appeal</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
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

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[
            styles.tab,
            { backgroundColor: colors.card },
            activeTab === 'active' && { backgroundColor: colors.primary },
          ]}
          onPress={() => setActiveTab('active')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'active' ? '#FFFFFF' : colors.text },
            ]}
          >
            Active ({activePenalties.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            { backgroundColor: colors.card },
            activeTab === 'historical' && { backgroundColor: colors.primary },
          ]}
          onPress={() => setActiveTab('historical')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'historical' ? '#FFFFFF' : colors.text },
            ]}
          >
            Historical ({historicalPenalties.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            { backgroundColor: colors.card },
            activeTab === 'appeals' && { backgroundColor: colors.primary },
          ]}
          onPress={() => setActiveTab('appeals')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'appeals' ? '#FFFFFF' : colors.text },
            ]}
          >
            Appeals ({appeals.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'active' && (
          <View style={styles.section}>
            {activePenalties.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol
                  ios_icon_name="checkmark.circle"
                  android_material_icon_name="check_circle"
                  size={64}
                  color={colors.textSecondary}
                />
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  No active penalties
                </Text>
              </View>
            ) : (
              activePenalties.map(penalty => renderPenaltyCard(penalty, true))
            )}
          </View>
        )}

        {activeTab === 'historical' && (
          <View style={styles.section}>
            {historicalPenalties.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol
                  ios_icon_name="clock"
                  android_material_icon_name="history"
                  size={64}
                  color={colors.textSecondary}
                />
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  No historical penalties
                </Text>
              </View>
            ) : (
              historicalPenalties.map(penalty => renderPenaltyCard(penalty, false))
            )}
          </View>
        )}

        {activeTab === 'appeals' && (
          <View style={styles.section}>
            {appeals.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol
                  ios_icon_name="doc.text"
                  android_material_icon_name="description"
                  size={64}
                  color={colors.textSecondary}
                />
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  No appeals submitted
                </Text>
              </View>
            ) : (
              appeals.map(renderAppealCard)
            )}
          </View>
        )}
      </ScrollView>

      {/* Appeal Form Modal */}
      {renderAppealForm()}
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
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    gap: 16,
  },
  penaltyCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  penaltyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  penaltyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  penaltySeverity: {
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
    lineHeight: 20,
  },
  penaltyDetails: {
    gap: 8,
  },
  penaltyDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  penaltyDetailText: {
    fontSize: 13,
  },
  policyReference: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  appealButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  appealButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  appealStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  appealStatusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  appealCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  appealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appealTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  appealReason: {
    fontSize: 14,
    lineHeight: 20,
  },
  appealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  appealDate: {
    fontSize: 12,
  },
  resolutionBox: {
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  resolutionLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  resolutionMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
  },
  appealFormOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  appealFormContainer: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  appealFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appealFormTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  appealFormLabel: {
    fontSize: 14,
    lineHeight: 20,
  },
  appealFormInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 120,
  },
  appealFormNote: {
    fontSize: 12,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  appealFormButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});