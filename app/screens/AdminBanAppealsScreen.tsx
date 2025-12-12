
import React, { useState, useEffect, useCallback } from 'react';
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
import { automatedSafetyService } from '@/app/services/automatedSafetyService';

export default function AdminBanAppealsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [appeals, setAppeals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [selectedAppeal, setSelectedAppeal] = useState<any | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  const fetchAppeals = useCallback(async () => {
    setIsLoading(true);
    const data = await automatedSafetyService.getBanAppeals(selectedFilter);
    setAppeals(data);
    setIsLoading(false);
  }, [selectedFilter]);

  useEffect(() => {
    fetchAppeals();
  }, [fetchAppeals]);

  const handleReviewAppeal = async (status: 'approved' | 'rejected') => {
    if (!selectedAppeal || !user) return;

    const result = await automatedSafetyService.reviewBanAppeal(
      selectedAppeal.id,
      status,
      user.id,
      adminNotes
    );

    if (result.success) {
      Alert.alert('Success', `Appeal ${status}`);
      setShowReviewModal(false);
      setSelectedAppeal(null);
      setAdminNotes('');
      fetchAppeals();
    } else {
      Alert.alert('Error', result.error || 'Failed to review appeal');
    }
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Ban Appeals</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            selectedFilter === 'pending' && [styles.filterTabActive, { backgroundColor: colors.brandPrimary }],
            { borderColor: colors.border },
          ]}
          onPress={() => setSelectedFilter('pending')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterTabText,
              { color: selectedFilter === 'pending' ? '#FFFFFF' : colors.text },
            ]}
          >
            Pending
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            selectedFilter === 'approved' && [styles.filterTabActive, { backgroundColor: colors.brandPrimary }],
            { borderColor: colors.border },
          ]}
          onPress={() => setSelectedFilter('approved')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterTabText,
              { color: selectedFilter === 'approved' ? '#FFFFFF' : colors.text },
            ]}
          >
            Approved
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            selectedFilter === 'rejected' && [styles.filterTabActive, { backgroundColor: colors.brandPrimary }],
            { borderColor: colors.border },
          ]}
          onPress={() => setSelectedFilter('rejected')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterTabText,
              { color: selectedFilter === 'rejected' ? '#FFFFFF' : colors.text },
            ]}
          >
            Rejected
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {appeals.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No {selectedFilter} appeals
              </Text>
            </View>
          ) : (
            appeals.map((appeal, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.appealCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => {
                  setSelectedAppeal(appeal);
                  setShowReviewModal(true);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.appealHeader}>
                  <Text style={[styles.appealUser, { color: colors.text }]}>
                    {appeal.profiles?.display_name || appeal.profiles?.username || 'Unknown User'}
                  </Text>
                  <Text style={[styles.appealDate, { color: colors.textSecondary }]}>
                    {new Date(appeal.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={[styles.appealReason, { color: colors.textSecondary }]} numberOfLines={3}>
                  {appeal.appeal_reason}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Review Appeal</Text>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            {selectedAppeal && (
              <>
                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>User</Text>
                  <Text style={[styles.modalValue, { color: colors.text }]}>
                    {selectedAppeal.profiles?.display_name || selectedAppeal.profiles?.username}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Appeal Reason</Text>
                  <Text style={[styles.modalValue, { color: colors.text }]}>
                    {selectedAppeal.appeal_reason}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Admin Notes</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: colors.backgroundAlt, color: colors.text, borderColor: colors.border }]}
                    placeholder="Add notes about your decision..."
                    placeholderTextColor={colors.placeholder}
                    value={adminNotes}
                    onChangeText={setAdminNotes}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                {selectedFilter === 'pending' && (
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.modalActionButton, { backgroundColor: '#DC143C' }]}
                      onPress={() => handleReviewAppeal('rejected')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.modalActionButtonText}>Reject Appeal</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modalActionButton, { backgroundColor: '#4ECDC4' }]}
                      onPress={() => handleReviewAppeal('approved')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.modalActionButtonText}>Approve Appeal</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {selectedFilter !== 'pending' && selectedAppeal.admin_notes && (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Previous Admin Notes</Text>
                    <Text style={[styles.modalValue, { color: colors.text }]}>
                      {selectedAppeal.admin_notes}
                    </Text>
                  </View>
                )}
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
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  filterTabActive: {
    borderWidth: 0,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '700',
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
  appealCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  appealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appealUser: {
    fontSize: 18,
    fontWeight: '700',
  },
  appealDate: {
    fontSize: 12,
    fontWeight: '400',
  },
  appealReason: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
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
    minHeight: 100,
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