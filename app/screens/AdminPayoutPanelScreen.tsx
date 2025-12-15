
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { payoutService, PayoutRequest } from '@/app/services/payoutService';
import { LinearGradient } from 'expo-linear-gradient';

export default function AdminPayoutPanelScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payoutRequests, setPayoutRequests] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<
    'all' | 'pending' | 'processing' | 'paid' | 'rejected'
  >('pending');
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadPayoutRequests = useCallback(async () => {
    try {
      setLoading(true);
      const status = selectedStatus === 'all' ? undefined : selectedStatus;
      const requests = await payoutService.getAllPayoutRequests(status);
      setPayoutRequests(requests);
    } catch (error) {
      console.error('Error loading payout requests:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    if (user) {
      loadPayoutRequests();
    }
  }, [user, loadPayoutRequests]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPayoutRequests();
    setRefreshing(false);
  };

  const handleUpdateStatus = async (
    payoutId: string,
    status: 'processing' | 'paid' | 'rejected'
  ) => {
    if (!user) {
      console.log('No user found');
      return;
    }

    try {
      setProcessing(true);

      const result = await payoutService.updatePayoutStatus(payoutId, status, user.id, notes);

      if (result.success) {
        Alert.alert('Success', `Payout request marked as ${status}`);
        setSelectedRequest(null);
        setNotes('');
        await loadPayoutRequests();
      } else {
        Alert.alert('Error', result.error || 'Failed to update payout status');
      }
    } catch (error) {
      console.error('Error updating payout status:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const confirmStatusUpdate = (
    payoutId: string,
    status: 'processing' | 'paid' | 'rejected',
    amount: number
  ) => {
    const statusText = status === 'paid' ? 'approve' : status;
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${statusText} this payout request of ${(amount / 100).toFixed(2)} SEK?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => handleUpdateStatus(payoutId, status),
          style: status === 'rejected' ? 'destructive' : 'default',
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FFA500';
      case 'processing':
        return '#2196F3';
      case 'paid':
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      default:
        return colors.text;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#A40028" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colors.text }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Payout Management</Text>
      </View>

      {/* Status Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {['all', 'pending', 'processing', 'paid', 'rejected'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              selectedStatus === status && styles.filterButtonActive,
              { backgroundColor: selectedStatus === status ? '#A40028' : colors.card },
            ]}
            onPress={() => setSelectedStatus(status as any)}
          >
            <Text
              style={[
                styles.filterButtonText,
                { color: selectedStatus === status ? '#FFF' : colors.text },
              ]}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Payout Requests List */}
      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A40028" />
        }
      >
        {payoutRequests.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No payout requests found
          </Text>
        ) : (
          payoutRequests.map((request) => (
            <View key={request.id} style={[styles.requestCard, { backgroundColor: colors.card }]}>
              {/* User Info */}
              <View style={styles.userInfo}>
                {request.user?.avatar_url ? (
                  <Image source={{ uri: request.user.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: '#A40028' }]}>
                    <Text style={styles.avatarText}>
                      {request.user?.username?.charAt(0).toUpperCase() || '?'}
                    </Text>
                  </View>
                )}
                <View style={styles.userDetails}>
                  <Text style={[styles.username, { color: colors.text }]}>
                    {request.user?.display_name || request.user?.username || 'Unknown'}
                  </Text>
                  <Text style={[styles.userSubtext, { color: colors.textSecondary }]}>
                    @{request.user?.username || 'unknown'}
                  </Text>
                </View>
              </View>

              {/* Amount and Status */}
              <View style={styles.amountRow}>
                <Text style={[styles.amount, { color: colors.text }]}>
                  {(request.amount_cents / 100).toFixed(2)} SEK
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(request.status) + '20' },
                  ]}
                >
                  <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                    {request.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Payment Details */}
              <View style={styles.detailsContainer}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Full Name:
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {request.full_name}
                </Text>

                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Country:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {request.country}
                </Text>

                {request.iban && (
                  <>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                      IBAN:
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {request.iban}
                    </Text>
                  </>
                )}

                {request.bank_account && (
                  <>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                      Bank Account:
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {request.bank_account}
                    </Text>
                  </>
                )}

                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Requested:
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {new Date(request.created_at).toLocaleString()}
                </Text>

                {request.notes && (
                  <>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                      Notes:
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {request.notes}
                    </Text>
                  </>
                )}
              </View>

              {/* Action Buttons */}
              {request.status === 'pending' && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setSelectedRequest(request)}
                  >
                    <LinearGradient
                      colors={['#2196F3', '#1976D2']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.actionButtonGradient}
                    >
                      <Text style={styles.actionButtonText}>Process</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() =>
                      confirmStatusUpdate(request.id, 'paid', request.amount_cents)
                    }
                  >
                    <LinearGradient
                      colors={['#4CAF50', '#388E3C']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.actionButtonGradient}
                    >
                      <Text style={styles.actionButtonText}>Approve</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() =>
                      confirmStatusUpdate(request.id, 'rejected', request.amount_cents)
                    }
                  >
                    <LinearGradient
                      colors={['#F44336', '#D32F2F']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.actionButtonGradient}
                    >
                      <Text style={styles.actionButtonText}>Reject</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Notes Modal */}
      {selectedRequest && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Notes</Text>
            <TextInput
              style={[
                styles.notesInput,
                { backgroundColor: colors.background, color: colors.text },
              ]}
              placeholder="Add notes (optional)"
              placeholderTextColor={colors.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.background }]}
                onPress={() => {
                  setSelectedRequest(null);
                  setNotes('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={() =>
                  confirmStatusUpdate(selectedRequest.id, 'processing', selectedRequest.amount_cents)
                }
                disabled={processing}
              >
                <LinearGradient
                  colors={['#2196F3', '#1976D2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalButtonGradient}
                >
                  {processing ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.modalButtonText}>Mark as Processing</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  filterButtonActive: {
    backgroundColor: '#A40028',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 40,
  },
  requestCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userSubtext: {
    fontSize: 14,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailsContainer: {
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 12,
    marginTop: 8,
  },
  detailValue: {
    fontSize: 14,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  notesInput: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
