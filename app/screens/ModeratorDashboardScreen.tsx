
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import { adminService } from '@/app/services/adminService';

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * MODERATOR DASHBOARD (STREAM-LEVEL)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * For users assigned as stream moderators (streammoderator role).
 * 
 * This is DIFFERENT from the MODERATOR platform role (staff who monitor all streams).
 * 
 * Stream moderators are assigned to specific creators and can ONLY moderate
 * those creators' streams. They have ZERO permissions outside those streams.
 * 
 * Permissions (stream-level only):
 * - Ban users from the creator's streams
 * - Timeout users temporarily
 * - Remove inappropriate comments
 * - Pin important messages
 * 
 * Cannot:
 * - Access other creators' streams
 * - Perform global moderation actions
 * - Ban users platform-wide
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
export default function ModeratorDashboardScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assignedCreator, setAssignedCreator] = useState<any>(null);
  const [moderationHistory, setModerationHistory] = useState<any[]>([]);

  const fetchModerationHistory = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('moderation_history')
        .select('*')
        .eq('moderator_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setModerationHistory(data || []);
    } catch (error) {
      console.error('Error fetching moderation history:', error);
    }
  }, [user]);

  const checkAccess = useCallback(async () => {
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    // Check if user is a stream-level moderator (assigned to specific creators)
    const modResult = await adminService.checkStreamModeratorRole(user.id);
    
    console.log('Stream moderator check:', modResult);

    if (!modResult.isModerator) {
      Alert.alert('Access Denied', 'You are not assigned as a stream moderator.');
      router.back();
      return;
    }

    // Fetch assigned creator details
    const { data: moderatorData, error } = await supabase
      .from('moderators')
      .select('*, profiles!moderators_streamer_id_fkey(*)')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !moderatorData) {
      Alert.alert('Error', 'Failed to load moderator data.');
      router.back();
      return;
    }

    setAssignedCreator(moderatorData.profiles);
    await fetchModerationHistory();
    setLoading(false);
  }, [user, fetchModerationHistory]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  const handleRemoveRole = async () => {
    Alert.alert(
      'Remove Moderator Role',
      'Are you sure you want to remove yourself as a moderator? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;

            const { error } = await supabase
              .from('moderators')
              .delete()
              .eq('user_id', user.id);

            if (error) {
              Alert.alert('Error', 'Failed to remove moderator role.');
            } else {
              Alert.alert('Success', 'Moderator role removed successfully.');
              router.back();
            }
          },
        },
      ]
    );
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
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Moderator Dashboard</Text>
          <View style={[styles.roleBadge, { backgroundColor: '#9B59B6' }]}>
            <Text style={styles.roleBadgeText}>STREAM MODERATOR</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Assigned Creator */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>👤 Assigned Creator</Text>
          
          {assignedCreator && (
            <View style={[styles.creatorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.creatorInfo}>
                <IconSymbol
                  ios_icon_name="person.circle.fill"
                  android_material_icon_name="account_circle"
                  size={48}
                  color={colors.brandPrimary}
                />
                <View style={styles.creatorDetails}>
                  <Text style={[styles.creatorName, { color: colors.text }]}>
                    {assignedCreator.display_name || assignedCreator.username}
                  </Text>
                  <Text style={[styles.creatorUsername, { color: colors.textSecondary }]}>
                    @{assignedCreator.username}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.removeButton, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}
                onPress={handleRemoveRole}
              >
                <Text style={[styles.removeButtonText, { color: colors.brandPrimary }]}>Remove Role</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Moderator Rules */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📋 Stream Moderator Rules</Text>
          
          <View style={[styles.rulesCard, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
            <Text style={[styles.rulesText, { color: colors.text }]}>
              As a stream moderator, you can:{'\n\n'}
              - Ban users from the creator&apos;s streams{'\n'}
              - Timeout users temporarily{'\n'}
              - Remove inappropriate comments{'\n'}
              - Pin important messages{'\n\n'}
              You cannot:{'\n\n'}
              - Access other creators&apos; streams{'\n'}
              - Perform global moderation actions{'\n'}
              - Ban users platform-wide{'\n\n'}
              Note: This is different from the MODERATOR staff role which monitors all live streams on the platform.
            </Text>
          </View>
        </View>

        {/* Moderation History */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📜 Moderation History</Text>
          
          {moderationHistory.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
              <IconSymbol
                ios_icon_name="clock.fill"
                android_material_icon_name="history"
                size={32}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No moderation history yet</Text>
            </View>
          ) : (
            moderationHistory.map((action, index) => (
              <View key={index} style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.historyHeader}>
                  <Text style={[styles.historyAction, { color: colors.text }]}>
                    {action.action_type.replace('_', ' ').toUpperCase()}
                  </Text>
                  <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
                    {new Date(action.created_at).toLocaleDateString()}
                  </Text>
                </View>
                {action.reason && (
                  <Text style={[styles.historyReason, { color: colors.textSecondary }]}>
                    Reason: {action.reason}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  creatorCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  creatorDetails: {
    flex: 1,
    gap: 4,
  },
  creatorName: {
    fontSize: 18,
    fontWeight: '700',
  },
  creatorUsername: {
    fontSize: 14,
    fontWeight: '400',
  },
  removeButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  rulesCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  rulesText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
  },
  historyCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyAction: {
    fontSize: 16,
    fontWeight: '700',
  },
  historyDate: {
    fontSize: 12,
    fontWeight: '400',
  },
  historyReason: {
    fontSize: 14,
    fontWeight: '400',
  },
  emptyCard: {
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
