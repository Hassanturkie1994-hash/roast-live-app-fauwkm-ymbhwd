
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
import { adminService, ReportType, ReportStatus } from '@/app/services/adminService';
import GradientButton from '@/components/GradientButton';

export default function AdminReportsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<ReportStatus>('open');
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    fetchReports();
  }, [selectedFilter]);

  const fetchReports = async () => {
    setIsLoading(true);
    const result = await adminService.getReports({ status: selectedFilter, limit: 100 });
    
    if (result.success && result.reports) {
      setReports(result.reports);
    }
    
    setIsLoading(false);
  };

  const handleResolveReport = async (status: ReportStatus) => {
    if (!selectedReport || !user) return;

    const result = await adminService.updateReportStatus(
      selectedReport.id,
      status,
      resolutionNotes,
      user.id
    );

    if (result.success) {
      Alert.alert('Success', 'Report has been updated');
      setShowResolveModal(false);
      setSelectedReport(null);
      setResolutionNotes('');
      fetchReports();
    } else {
      Alert.alert('Error', result.error || 'Failed to update report');
    }
  };

  const handleBanUser = async () => {
    if (!selectedReport || !user) return;

    Alert.alert(
      'Ban User',
      'Are you sure you want to ban this user platform-wide?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Ban',
          style: 'destructive',
          onPress: async () => {
            const result = await adminService.banUser(
              user.id,
              selectedReport.reported_user_id,
              `Banned due to report: ${selectedReport.description}`,
              undefined
            );

            if (result.success) {
              await handleResolveReport('closed');
              Alert.alert('Success', 'User has been banned');
            } else {
              Alert.alert('Error', result.error || 'Failed to ban user');
            }
          },
        },
      ]
    );
  };

  const getReportTypeIcon = (type: ReportType) => {
    switch (type) {
      case 'profile':
        return 'person';
      case 'comment':
        return 'chat_bubble';
      case 'message':
        return 'mail';
      case 'post':
        return 'image';
      case 'stream':
        return 'videocam';
      default:
        return 'flag';
    }
  };

  const getReportTypeColor = (type: ReportType) => {
    switch (type) {
      case 'profile':
        return '#4ECDC4';
      case 'comment':
        return '#FFA500';
      case 'message':
        return '#FF1493';
      case 'post':
        return '#9B59B6';
      case 'stream':
        return colors.gradientEnd;
      default:
        return colors.textSecondary;
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Reports Management</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            selectedFilter === 'open' && [styles.filterTabActive, { backgroundColor: colors.brandPrimary }],
            { borderColor: colors.border },
          ]}
          onPress={() => setSelectedFilter('open')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterTabText,
              { color: selectedFilter === 'open' ? '#FFFFFF' : colors.text },
            ]}
          >
            Open
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            selectedFilter === 'in_review' && [styles.filterTabActive, { backgroundColor: colors.brandPrimary }],
            { borderColor: colors.border },
          ]}
          onPress={() => setSelectedFilter('in_review')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterTabText,
              { color: selectedFilter === 'in_review' ? '#FFFFFF' : colors.text },
            ]}
          >
            In Review
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            selectedFilter === 'closed' && [styles.filterTabActive, { backgroundColor: colors.brandPrimary }],
            { borderColor: colors.border },
          ]}
          onPress={() => setSelectedFilter('closed')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterTabText,
              { color: selectedFilter === 'closed' ? '#FFFFFF' : colors.text },
            ]}
          >
            Closed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Reports List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {reports.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No {selectedFilter} reports
              </Text>
            </View>
          ) : (
            reports.map((report, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => {
                  setSelectedReport(report);
                  setShowResolveModal(true);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.reportHeader}>
                  <View
                    style={[
                      styles.reportTypeIcon,
                      { backgroundColor: getReportTypeColor(report.type) + '20' },
                    ]}
                  >
                    <IconSymbol
                      ios_icon_name={getReportTypeIcon(report.type)}
                      android_material_icon_name={getReportTypeIcon(report.type)}
                      size={24}
                      color={getReportTypeColor(report.type)}
                    />
                  </View>
                  <View style={styles.reportHeaderText}>
                    <Text style={[styles.reportType, { color: colors.text }]}>
                      {report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report
                    </Text>
                    <Text style={[styles.reportDate, { color: colors.textSecondary }]}>
                      {new Date(report.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.reportDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                  {report.description || 'No description provided'}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* Resolve Modal */}
      <Modal
        visible={showResolveModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowResolveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Resolve Report</Text>
              <TouchableOpacity onPress={() => setShowResolveModal(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            {selectedReport && (
              <>
                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Type</Text>
                  <Text style={[styles.modalValue, { color: colors.text }]}>
                    {selectedReport.type.charAt(0).toUpperCase() + selectedReport.type.slice(1)}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Description</Text>
                  <Text style={[styles.modalValue, { color: colors.text }]}>
                    {selectedReport.description || 'No description provided'}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Resolution Notes</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: colors.backgroundAlt, color: colors.text, borderColor: colors.border }]}
                    placeholder="Add notes about the resolution..."
                    placeholderTextColor={colors.placeholder}
                    value={resolutionNotes}
                    onChangeText={setResolutionNotes}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalActionButton, { backgroundColor: '#FFA500' }]}
                    onPress={handleBanUser}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalActionButtonText}>Ban User</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalActionButton, { backgroundColor: '#4ECDC4' }]}
                    onPress={() => handleResolveReport('in_review')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalActionButtonText}>Mark In Review</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalActionButton, { backgroundColor: colors.brandPrimary }]}
                    onPress={() => handleResolveReport('closed')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalActionButtonText}>Close Report</Text>
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
  reportCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reportTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportHeaderText: {
    flex: 1,
    gap: 4,
  },
  reportType: {
    fontSize: 16,
    fontWeight: '700',
  },
  reportDate: {
    fontSize: 12,
    fontWeight: '400',
  },
  reportDescription: {
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