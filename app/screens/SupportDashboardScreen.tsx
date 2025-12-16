
import React, { useState, useEffect } from 'react';
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
import { adminService } from '@/app/services/adminService';
import { supabase } from '@/app/integrations/supabase/client';

export default function SupportDashboardScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingAppeals: 0,
    resolvedToday: 0,
    openTickets: 0,
  });

  useEffect(() => {
    checkAccess();
  }, [user]);

  const checkAccess = async () => {
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    const result = await adminService.checkAdminRole(user.id);
    
    console.log('Support dashboard access check:', result);
    
    if (!result.isAdmin || result.role !== 'SUPPORT') {
      Alert.alert('Access Denied', 'You do not have support team privileges.');
      router.back();
      return;
    }

    await fetchStats();
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      // Fetch pending appeals
      const { count: appealsCount } = await supabase
        .from('appeals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch resolved appeals today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: resolvedCount } = await supabase
        .from('appeals')
        .select('*', { count: 'exact', head: true })
        .in('status', ['approved', 'denied'])
        .gte('reviewed_at', today.toISOString());

      setStats({
        pendingAppeals: appealsCount || 0,
        resolvedToday: resolvedCount || 0,
        openTickets: 0, // TODO: Implement ticket system
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Support Dashboard</Text>
          <View style={[styles.roleBadge, { backgroundColor: '#4ECDC4' }]}>
            <Text style={styles.roleBadgeText}>SUPPORT TEAM</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Overview */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📊 Support Overview</Text>
          
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <IconSymbol
                ios_icon_name="doc.text.fill"
                android_material_icon_name="description"
                size={28}
                color={colors.brandPrimary}
              />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.pendingAppeals}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending Appeals</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={28}
                color="#00C853"
              />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.resolvedToday}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Resolved Today</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <IconSymbol
                ios_icon_name="envelope.fill"
                android_material_icon_name="mail"
                size={28}
                color={colors.gradientEnd}
              />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.openTickets}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Open Tickets</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>⚡ Quick Actions</Text>
          
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/screens/AdminBanAppealsScreen' as any)}
          >
            <View style={styles.actionCardLeft}>
              <IconSymbol
                ios_icon_name="doc.text.fill"
                android_material_icon_name="description"
                size={24}
                color={colors.brandPrimary}
              />
              <View style={styles.actionCardText}>
                <Text style={[styles.actionCardTitle, { color: colors.text }]}>Review Appeals</Text>
                <Text style={[styles.actionCardSubtitle, { color: colors.textSecondary }]}>
                  Review and resolve user appeals
                </Text>
              </View>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/screens/AppealsViolationsScreen' as any)}
          >
            <View style={styles.actionCardLeft}>
              <IconSymbol
                ios_icon_name="person.fill.checkmark"
                android_material_icon_name="verified_user"
                size={24}
                color="#00C853"
              />
              <View style={styles.actionCardText}>
                <Text style={[styles.actionCardTitle, { color: colors.text }]}>Approve Account Unlocks</Text>
                <Text style={[styles.actionCardSubtitle, { color: colors.textSecondary }]}>
                  Review and approve unlock requests
                </Text>
              </View>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => Alert.alert('User History', 'User history viewer coming soon.')}
          >
            <View style={styles.actionCardLeft}>
              <IconSymbol
                ios_icon_name="clock.fill"
                android_material_icon_name="history"
                size={24}
                color={colors.text}
              />
              <View style={styles.actionCardText}>
                <Text style={[styles.actionCardTitle, { color: colors.text }]}>View User History</Text>
                <Text style={[styles.actionCardSubtitle, { color: colors.textSecondary }]}>
                  Check warnings, timeouts, and bans
                </Text>
              </View>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/(tabs)/inbox' as any)}
          >
            <View style={styles.actionCardLeft}>
              <IconSymbol
                ios_icon_name="envelope.fill"
                android_material_icon_name="mail"
                size={24}
                color={colors.gradientEnd}
              />
              <View style={styles.actionCardText}>
                <Text style={[styles.actionCardTitle, { color: colors.text }]}>Respond to Tickets</Text>
                <Text style={[styles.actionCardSubtitle, { color: colors.textSecondary }]}>
                  View and respond to user tickets
                </Text>
              </View>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Important Notes */}
        <View style={styles.section}>
          <View style={[styles.noteCard, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
            <IconSymbol
              ios_icon_name="info.circle.fill"
              android_material_icon_name="info"
              size={24}
              color={colors.brandPrimary}
            />
            <View style={styles.noteContent}>
              <Text style={[styles.noteTitle, { color: colors.text }]}>Support Team Guidelines</Text>
              <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                - You can review and resolve appeals{'\n'}
                - You can approve account unlocks{'\n'}
                - You can view user history{'\n'}
                - You cannot suspend or ban users{'\n'}
                - Escalate serious issues to admins
              </Text>
            </View>
          </View>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  actionCardText: {
    flex: 1,
    gap: 4,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  actionCardSubtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  noteCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  noteContent: {
    flex: 1,
    gap: 8,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  noteText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
});
