
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import { adminService } from '@/app/services/adminService';
import { identityVerificationService } from '@/app/services/identityVerificationService';
import GradientButton from '@/components/GradientButton';

interface IdentityVerification {
  id: string;
  user_id: string;
  full_legal_name: string;
  country: string;
  date_of_birth: string;
  document_type: string;
  document_url: string;
  verification_status: 'pending' | 'approved' | 'rejected' | 'revoked';
  submitted_at: string;
  profiles: {
    username: string;
    display_name: string | null;
    email: string | null;
  };
}

/**
 * Admin Identity Verifications Screen
 * 
 * For head_admin and admin ONLY.
 * 
 * Allows admins to:
 * - View pending identity verifications
 * - Approve verifications
 * - Reject verifications with reason
 * - View verification documents
 */
export default function AdminIdentityVerificationsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [verifications, setVerifications] = useState<IdentityVerification[]>([]);
  const [selectedVerification, setSelectedVerification] = useState<IdentityVerification | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  const fetchVerifications = useCallback(async () => {
    try {
      const data = await identityVerificationService.getAllVerifications(
        filter === 'all' ? undefined : filter
      );
      setVerifications(data as any);
    } catch (error) {
      console.error('Error fetching verifications:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const checkAccess = useCallback(async () => {
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    const result = await adminService.checkAdminRole(user.id);
    
    if (!result.isAdmin || !['HEAD_ADMIN', 'ADMIN'].includes(result.role || '')) {
      Alert.alert('Access Denied', 'You do not have permission to access this page.');
      router.back();
      return;
    }

    await fetchVerifications();
  }, [user, fetchVerifications]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  const handleApprove = async (verification: IdentityVerification) => {
    if (!user) return;

    Alert.alert(
      'Approve Verification',
      `Approve identity verification for ${verification.full_legal_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setProcessing(true);
            try {
              const result = await identityVerificationService.approveVerification(
                verification.id,
                user.id
              );

              if (result.success) {
                Alert.alert('Success', 'Verification approved successfully');
                await fetchVerifications();
              } else {
                Alert.alert('Error', result.error || 'Failed to approve verification');
              }
            } catch (error) {
              console.error('Error approving verification:', error);
              Alert.alert('Error', 'Failed to approve verification');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleReject = async () => {
    if (!user || !selectedVerification) return;

    if (!rejectionReason.trim()) {
      Alert.alert('Error', 'Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      const result = await identityVerificationService.rejectVerification(
        selectedVerification.id,
        user.id,
        rejectionReason
      );

      if (result.success) {
        Alert.alert('Success', 'Verification rejected');
        setShowRejectModal(false);
        setRejectionReason('');
        setSelectedVerification(null);
        await fetchVerifications();
      } else {
        Alert.alert('Error', result.error || 'Failed to reject verification');
      }
    } catch (error) {
      console.error('Error rejecting verification:', error);
      Alert.alert('Error', 'Failed to reject verification');
    } finally {
      setProcessing(false);
    }
  };

  const handleViewDetails = (verification: IdentityVerification) => {
    setSelectedVerification(verification);
    setShowDetailsModal(true);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Identity Verifications</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.filterBar, { borderBottomColor: colors.border }]}
        contentContainerStyle={styles.filterBarContent}
      >
        {(['pending', 'approved', 'rejected', 'all'] as const).map((filterType) => (
          <TouchableOpacity
            key={filterType}
            style={[
              styles.filterChip,
              {
                backgroundColor: filter === filterType ? colors.brandPrimary : colors.backgroundAlt,
                borderColor: filter === filterType ? colors.brandPrimary : colors.border,
              },
            ]}
            onPress={() => setFilter(filterType)}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: filter === filterType ? '#FFFFFF' : colors.text },
              ]}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {verifications.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="checkmark.seal.fill"
              android_material_icon_name="verified"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: colors.text }]}>No verifications found</Text>
          </View>
        ) : (
          verifications.map((verification) => (
            <View key={verification.id} style={[styles.verificationCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.verificationHeader}>
                <View style={styles.verificationUser}>
                  <IconSymbol
                    ios_icon_name="person.circle.fill"
                    android_material_icon_name="account_circle"
                    size={40}
                    color={colors.textSecondary}
                  />
                  <View style={styles.verificationUserInfo}>
                    <Text style={[styles.verificationName, { color: colors.text }]}>
                      {verification.full_legal_name}
                    </Text>
                    <Text style={[styles.verificationUsername, { color: colors.textSecondary }]}>
                      @{verification.profiles.username}
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      verification.verification_status === 'approved' ? '#00C853' :
                      verification.verification_status === 'rejected' ? '#DC143C' :
                      verification.verification_status === 'revoked' ? '#FFA500' :
                      '#4A90E2',
                  },
                ]}>
                  <Text style={styles.statusText}>
                    {verification.verification_status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.verificationDetails}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Country:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{verification.country}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>DOB:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {new Date(verification.date_of_birth).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Document:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {verification.document_type.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Submitted:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {new Date(verification.submitted_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <View style={styles.verificationActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}
                  onPress={() => handleViewDetails(verification)}
                >
                  <IconSymbol
                    ios_icon_name="eye.fill"
                    android_material_icon_name="visibility"
                    size={18}
                    color={colors.brandPrimary}
                  />
                  <Text style={[styles.actionButtonText, { color: colors.text }]}>View Details</Text>
                </TouchableOpacity>

                {verification.verification_status === 'pending' && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: 'rgba(0, 200, 83, 0.1)', borderColor: '#00C853' }]}
                      onPress={() => handleApprove(verification)}
                      disabled={processing}
                    >
                      <IconSymbol
                        ios_icon_name="checkmark.circle.fill"
                        android_material_icon_name="check_circle"
                        size={18}
                        color="#00C853"
                      />
                      <Text style={[styles.actionButtonText, { color: '#00C853' }]}>Approve</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: 'rgba(220, 20, 60, 0.1)', borderColor: '#DC143C' }]}
                      onPress={() => {
                        setSelectedVerification(verification);
                        setShowRejectModal(true);
                      }}
                      disabled={processing}
                    >
                      <IconSymbol
                        ios_icon_name="xmark.circle.fill"
                        android_material_icon_name="cancel"
                        size={18}
                        color="#DC143C"
                      />
                      <Text style={[styles.actionButtonText, { color: '#DC143C' }]}>Reject</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Details Modal */}
      {selectedVerification && (
        <Modal
          visible={showDetailsModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDetailsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Verification Details</Text>
                <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                  <IconSymbol
                    ios_icon_name="xmark"
                    android_material_icon_name="close"
                    size={24}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.detailSection}>
                  <Text style={[styles.detailSectionTitle, { color: colors.text }]}>Personal Information</Text>
                  <Text style={[styles.detailItem, { color: colors.textSecondary }]}>
                    Full Name: {selectedVerification.full_legal_name}
                  </Text>
                  <Text style={[styles.detailItem, { color: colors.textSecondary }]}>
                    Country: {selectedVerification.country}
                  </Text>
                  <Text style={[styles.detailItem, { color: colors.textSecondary }]}>
                    Date of Birth: {new Date(selectedVerification.date_of_birth).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={[styles.detailSectionTitle, { color: colors.text }]}>Document</Text>
                  <Text style={[styles.detailItem, { color: colors.textSecondary }]}>
                    Type: {selectedVerification.document_type.replace('_', ' ').toUpperCase()}
                  </Text>
                  
                  <TouchableOpacity
                    style={[styles.viewDocumentButton, { backgroundColor: colors.brandPrimary }]}
                    onPress={() => {
                      // Open document in browser or image viewer
                      Alert.alert('Document URL', selectedVerification.document_url);
                    }}
                  >
                    <IconSymbol
                      ios_icon_name="doc.text.fill"
                      android_material_icon_name="description"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.viewDocumentText}>View Document</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.detailSection}>
                  <Text style={[styles.detailSectionTitle, { color: colors.text }]}>User Account</Text>
                  <Text style={[styles.detailItem, { color: colors.textSecondary }]}>
                    Username: @{selectedVerification.profiles.username}
                  </Text>
                  <Text style={[styles.detailItem, { color: colors.textSecondary }]}>
                    Email: {selectedVerification.profiles.email || 'N/A'}
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Reject Modal */}
      {selectedVerification && (
        <Modal
          visible={showRejectModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowRejectModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Reject Verification</Text>
                <TouchableOpacity onPress={() => setShowRejectModal(false)}>
                  <IconSymbol
                    ios_icon_name="xmark"
                    android_material_icon_name="close"
                    size={24}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={[styles.label, { color: colors.text }]}>Rejection Reason</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, color: colors.text }]}
                  placeholder="Explain why this verification is being rejected..."
                  placeholderTextColor={colors.textSecondary}
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.cancelButton, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}
                    onPress={() => setShowRejectModal(false)}
                  >
                    <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.rejectButton, { backgroundColor: '#DC143C' }]}
                    onPress={handleReject}
                    disabled={processing}
                  >
                    {processing ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
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
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  filterBar: {
    borderBottomWidth: 1,
  },
  filterBarContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 20,
  },
  verificationCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    gap: 16,
  },
  verificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  verificationUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  verificationUserInfo: {
    flex: 1,
    gap: 4,
  },
  verificationName: {
    fontSize: 16,
    fontWeight: '700',
  },
  verificationUsername: {
    fontSize: 14,
    fontWeight: '400',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  verificationDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '400',
  },
  verificationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  modalBody: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  detailItem: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 8,
  },
  viewDocumentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  viewDocumentText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  rejectButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
