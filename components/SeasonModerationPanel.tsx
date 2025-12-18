
/**
 * Season Moderation Panel Component
 * 
 * Admin interface for moderating Roast Ranking Seasons.
 * 
 * Features:
 * - Flag streams for review
 * - Zero fraudulent scores
 * - Revoke rewards
 * - View audit logs
 * - Restore scores after appeals
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '@/app/integrations/supabase/client';
import { seasonModerationService } from '@/services/seasonModerationService';

interface AuditLogEntry {
  id: string;
  season_id: string;
  creator_id: string;
  old_score: number;
  new_score: number;
  old_rank_tier: string | null;
  new_rank_tier: string | null;
  change_reason: string;
  metadata: any;
  created_at: string;
}

export const SeasonModerationPanel: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [selectedCreatorId, setSelectedCreatorId] = useState('');
  const [moderationReason, setModerationReason] = useState('');
  const [activeTab, setActiveTab] = useState<'audit' | 'actions'>('audit');

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('season_score_audit_log')
        .select('*, profiles!creator_id(username)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        setAuditLogs(data as AuditLogEntry[]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      setLoading(false);
    }
  };

  const handleZeroScore = async () => {
    if (!selectedCreatorId || !moderationReason) {
      Alert.alert('Error', 'Please enter creator ID and reason');
      return;
    }

    Alert.alert(
      'Zero Creator Score',
      'This will zero out the creator\'s season score. This action is logged. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Zero Score',
          style: 'destructive',
          onPress: async () => {
            // Get active season
            const { data: season } = await supabase
              .from('roast_ranking_seasons')
              .select('id')
              .eq('status', 'ACTIVE')
              .single();

            if (!season) {
              Alert.alert('Error', 'No active season');
              return;
            }

            const success = await seasonModerationService.zeroCreatorScore(
              season.id,
              selectedCreatorId,
              moderationReason
            );

            if (success) {
              Alert.alert('Success', 'Creator score zeroed');
              setSelectedCreatorId('');
              setModerationReason('');
              loadAuditLogs();
            } else {
              Alert.alert('Error', 'Failed to zero score');
            }
          },
        },
      ]
    );
  };

  const handleRevokeReward = async (rewardId: string) => {
    if (!selectedCreatorId || !moderationReason) {
      Alert.alert('Error', 'Please enter creator ID and reason');
      return;
    }

    Alert.alert(
      'Revoke Reward',
      'This will revoke the seasonal reward. This action is logged. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            // Get active season
            const { data: season } = await supabase
              .from('roast_ranking_seasons')
              .select('id')
              .eq('status', 'ACTIVE')
              .single();

            if (!season) {
              Alert.alert('Error', 'No active season');
              return;
            }

            const success = await seasonModerationService.revokeSeasonalReward(
              season.id,
              selectedCreatorId,
              rewardId,
              moderationReason
            );

            if (success) {
              Alert.alert('Success', 'Reward revoked');
              setSelectedCreatorId('');
              setModerationReason('');
              loadAuditLogs();
            } else {
              Alert.alert('Error', 'Failed to revoke reward');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF1493" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'audit' && styles.tabActive]}
          onPress={() => setActiveTab('audit')}
        >
          <Text style={[styles.tabText, activeTab === 'audit' && styles.tabTextActive]}>
            Audit Logs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'actions' && styles.tabActive]}
          onPress={() => setActiveTab('actions')}
        >
          <Text style={[styles.tabText, activeTab === 'actions' && styles.tabTextActive]}>
            Moderation Actions
          </Text>
        </TouchableOpacity>
      </View>

      {/* Audit Logs Tab */}
      {activeTab === 'audit' && (
        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Score Change Audit Log</Text>
            <Text style={styles.sectionSubtitle}>
              Every season score change is logged here
            </Text>

            {auditLogs.length === 0 ? (
              <Text style={styles.noDataText}>No audit logs yet</Text>
            ) : (
              auditLogs.map((log) => (
                <View key={log.id} style={styles.auditLogItem}>
                  <View style={styles.auditLogHeader}>
                    <Text style={styles.auditLogCreator}>
                      {(log as any).profiles?.username || 'Unknown'}
                    </Text>
                    <Text style={styles.auditLogDate}>
                      {new Date(log.created_at).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.auditLogDetails}>
                    <Text style={styles.auditLogLabel}>Score Change:</Text>
                    <Text style={styles.auditLogValue}>
                      {log.old_score?.toFixed(0) || 0} → {log.new_score?.toFixed(0) || 0}
                    </Text>
                  </View>
                  {log.old_rank_tier !== log.new_rank_tier && (
                    <View style={styles.auditLogDetails}>
                      <Text style={styles.auditLogLabel}>Tier Change:</Text>
                      <Text style={styles.auditLogValue}>
                        {log.old_rank_tier || 'None'} → {log.new_rank_tier || 'None'}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.auditLogReason}>{log.change_reason}</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* Moderation Actions Tab */}
      {activeTab === 'actions' && (
        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Moderation Actions</Text>
            <Text style={styles.sectionSubtitle}>
              Actions are applied after investigation, never during live
            </Text>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Creator ID"
                placeholderTextColor="#666666"
                value={selectedCreatorId}
                onChangeText={setSelectedCreatorId}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Reason for moderation action"
                placeholderTextColor="#666666"
                value={moderationReason}
                onChangeText={setModerationReason}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={[styles.actionButton, styles.dangerButton]}
                onPress={handleZeroScore}
              >
                <Text style={styles.actionButtonText}>Zero Score (Fraud)</Text>
              </TouchableOpacity>

              <View style={styles.infoBox}>
                <Text style={styles.infoBoxText}>
                  ℹ️ All moderation actions are logged and do not affect live streaming.
                  Rankings are adjusted after investigation.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF1493',
  },
  tabText: {
    color: '#CCCCCC',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: '#FF1493',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: '#CCCCCC',
    fontSize: 13,
    marginBottom: 16,
  },
  noDataText: {
    color: '#CCCCCC',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 32,
  },
  auditLogItem: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF1493',
  },
  auditLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  auditLogCreator: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  auditLogDate: {
    color: '#CCCCCC',
    fontSize: 12,
  },
  auditLogDetails: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  auditLogLabel: {
    color: '#CCCCCC',
    fontSize: 13,
    marginRight: 8,
  },
  auditLogValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  auditLogReason: {
    color: '#FF1493',
    fontSize: 12,
    marginTop: 8,
  },
  form: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  actionButton: {
    backgroundColor: '#FF1493',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  dangerButton: {
    backgroundColor: '#FF6B6B',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  infoBoxText: {
    color: '#CCCCCC',
    fontSize: 13,
    lineHeight: 20,
  },
});
