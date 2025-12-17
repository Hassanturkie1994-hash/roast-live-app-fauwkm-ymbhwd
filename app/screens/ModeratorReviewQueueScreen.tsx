
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
import { escalationService, ModeratorReviewItem } from '@/app/services/escalationService';

export default function ModeratorReviewQueueScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [reviewItems, setReviewItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [timeoutDuration, setTimeoutDuration] = useState('10');
  const [reason, setReason] = useState('');

  useEffect(() => {
    loadReviewQueue();
  }, []);

  const loadReviewQueue = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const items = await escalationService.getModeratorReviewQueue(user.id, 'pending');
      setReviewItems(items);
    } catch (error) {
      console.error('Error loading review queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReviewQueue();
    setRefreshing(false);
  };

  const handleReviewItem = (item: any) => {
    setSelectedItem(item);
    setActionModalVisible(true);
    setReason('');
    setTimeoutDuration('10');
  };

  const handleApprove = async () => {
    if (!user || !selectedItem) return;

    const result = await escalationService.moderatorApprove(
      selectedItem.id,
      user.id,
      user.username || 'Moderator',
      reason || 'Message approved after review'
    );

    if (result.success) {
      Alert.alert('Success', 'Message approved');
      setActionModalVisible(false);
      loadReviewQueue();
    } else {
      Alert.alert('Error', result.error || 'Failed to approve message');
    }
  };

  const handleReject = async () => {
    if (!user || !selectedItem || !reason) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }

    const result = await escalationService.moderatorReject(
      selectedItem.id,
      user.id,
      user.username || 'Moderator',
      reason
    );

    if (result.success) {
      Alert.alert('Success', 'Message rejected');
      setActionModalVisible(false);
      loadReviewQueue();
    } else {
      Alert.alert('Error', result.error || 'Failed to reject message');
    }
  };

  const handleTimeout = async () => {
    if (!user || !selectedItem || !reason) {
      Alert.alert('Error', 'Please provide a reason for timeout');
      return;
    }

    const duration = parseInt(timeoutDuration);
    if (duration < 5 || duration > 60) {
      Alert.alert('Error', 'Timeout duration must be between 5 and 60 minutes');
      return;
    }

    const result = await escalationService.moderatorTimeout(
      selectedItem.id,
      user.id,
      user.username || 'Moderator',
      duration,
      reason
    );

    if (result.success) {
      Alert.alert('Success', `User timed out for ${duration} minutes`);
      setActionModalVisible(false);
      loadReviewQueue();
    } else {
      Alert.alert('Error', result.error || 'Failed to apply timeout');
    }
  };

  const handleEscalateToAdmin = async () => {
    if (!user || !selectedItem || !reason) {
      Alert.alert('Error', 'Please provide a reason for escalation');
      return;
    }

    const result = await escalationService.escalateToAdmin(
      selectedItem.id,
      user.id,
      reason
    );

    if (result.success) {
      Alert.alert('Success', 'Escalated to admin review');
      setActionModalVisible(false);
      loadReviewQueue();
    } else {
      Alert.alert('Error', result.error || 'Failed to escalate');
    }
  };

  const renderReviewItem = (item: any) => {
    const scoreColor = 
      item.risk_score >= 0.85 ? '#FF3B30' :
      item.risk_score >= 0.70 ? '#FF9500' :
      item.risk_score >= 0.60 ? '#FFCC00' :
      '#34C759';

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => handleReviewItem(item)}
      >
        <View style={styles.reviewHeader}>
          <View style={styles.userInfo}>
            <Text style={[styles.username, { color: colors.text }]}>
              {item.profiles?.username || 'Unknown User'}
            </Text>
            <Text style={[styles.sourceType, { color: colors.textSecondary }]}>
              {item.source_type === 'live' ? '🔴 Live Chat' : 
               item.source_type === 'comment' ? '💬 Comment' : 
               '📧 Inbox Message'}
            </Text>
          </View>
          <View style={[styles.scoreBadge, { backgroundColor: scoreColor }]}>
            <Text style={styles.scoreText}>
              {(item.risk_score * 100).toFixed(0)}%
            </Text>
          </View>
        </View>

        <View style={[styles.categoryBadge, { backgroundColor: colors.background }]}>
          <Text style={[styles.categoryText, { color: colors.text }]}>
            {item.category.replace('_', ' ').toUpperCase()}
          </Text>
        </View>

        <Text style={[styles.contentPreview, { color: colors.text }]} numberOfLines={3}>
          {item.content_preview}
        </Text>

        <View style={styles.reviewFooter}>
          <Text style={[styles.timeText, { color: colors.textSecondary }]}>
            {new Date(item.created_at).toLocaleString()}
          </Text>
          <View style={styles.aiBadge}>
            <IconSymbol
              ios_icon_name="cpu"
              android_material_icon_name="memory"
              size={12}
              color="#FFFFFF"
            />
            <Text style={styles.aiText}>AI Flagged</Text>
          </View>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Moderator Review Queue</Text>
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
        {reviewItems.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="checkmark.circle"
              android_material_icon_name="check_circle"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No items in review queue
            </Text>
          </View>
        ) : (
          reviewItems.map(renderReviewItem)
        )}
      </ScrollView>

      {/* Action Modal */}
      <Modal
        visible={actionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setActionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Moderator Decision
              </Text>
              <TouchableOpacity onPress={() => setActionModalVisible(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            {selectedItem && (
              <View style={styles.modalBody}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
                  Content:
                </Text>
                <Text style={[styles.modalContent, { color: colors.text }]}>
                  {selectedItem.content_preview}
                </Text>

                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
                  Reason / Notes:
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  placeholder="Enter reason or notes..."
                  placeholderTextColor={colors.textSecondary}
                  value={reason}
                  onChangeText={setReason}
                  multiline
                  numberOfLines={3}
                />

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#34C759' }]}
                    onPress={handleApprove}
                  >
                    <Text style={styles.actionButtonText}>Approve</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#FF3B30' }]}
                    onPress={handleReject}
                  >
                    <Text style={styles.actionButtonText}>Reject</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.timeoutSection}>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
                    Timeout Duration (minutes):
                  </Text>
                  <TextInput
                    style={[styles.smallInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    placeholder="5-60"
                    placeholderTextColor={colors.textSecondary}
                    value={timeoutDuration}
                    onChangeText={setTimeoutDuration}
                    keyboardType="number-pad"
                  />
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#FF9500' }]}
                    onPress={handleTimeout}
                  >
                    <Text style={styles.actionButtonText}>Apply Timeout</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.escalateButton, { borderColor: colors.gradientEnd }]}
                  onPress={handleEscalateToAdmin}
                >
                  <IconSymbol
                    ios_icon_name="arrow.up.circle"
                    android_material_icon_name="arrow_upward"
                    size={20}
                    color={colors.gradientEnd}
                  />
                  <Text style={[styles.escalateButtonText, { color: colors.gradientEnd }]}>
                    Escalate to Admin
                  </Text>
                </TouchableOpacity>
              </View>
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
  reviewCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  reviewHeader: {
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
  sourceType: {
    fontSize: 13,
    fontWeight: '500',
  },
  scoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 12,
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
    marginBottom: 12,
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#5856D6',
    borderRadius: 8,
  },
  aiText: {
    fontSize: 11,
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
    paddingBottom: 40,
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
  },
  smallInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timeoutSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  escalateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    marginTop: 20,
  },
  escalateButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});