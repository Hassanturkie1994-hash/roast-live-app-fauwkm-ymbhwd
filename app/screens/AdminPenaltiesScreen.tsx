
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { adminService } from '@/app/services/adminService';

export default function AdminPenaltiesScreen() {
  const { colors } = useTheme();
  const [penalties, setPenalties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPenalties();
  }, []);

  const fetchPenalties = async () => {
    const result = await adminService.getUsersUnderPenalty();
    
    if (result.success && result.users) {
      setPenalties(result.users);
    }
    
    setIsLoading(false);
  };

  const getActionTypeColor = (actionType: string) => {
    switch (actionType) {
      case 'BAN':
        return '#FF0000';
      case 'SUSPEND':
        return '#FFA500';
      case 'TIMEOUT':
        return '#FFD700';
      default:
        return colors.textSecondary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Users Under Penalty</Text>
      </View>

      {/* Penalties List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {penalties.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No users under penalty
              </Text>
            </View>
          ) : (
            penalties.map((penalty, index) => (
              <View
                key={index}
                style={[styles.penaltyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.penaltyHeader}>
                  <View
                    style={[
                      styles.actionTypeBadge,
                      { backgroundColor: getActionTypeColor(penalty.action_type) },
                    ]}
                  >
                    <Text style={styles.actionTypeText}>{penalty.action_type}</Text>
                  </View>
                  {penalty.expires_at && !isExpired(penalty.expires_at) && (
                    <View style={[styles.activeIndicator, { backgroundColor: '#4ECDC4' }]}>
                      <Text style={styles.activeIndicatorText}>Active</Text>
                    </View>
                  )}
                  {penalty.expires_at && isExpired(penalty.expires_at) && (
                    <View style={[styles.activeIndicator, { backgroundColor: colors.textSecondary }]}>
                      <Text style={styles.activeIndicatorText}>Expired</Text>
                    </View>
                  )}
                </View>

                <View style={styles.penaltyInfo}>
                  <Text style={[styles.penaltyLabel, { color: colors.textSecondary }]}>User</Text>
                  <Text style={[styles.penaltyValue, { color: colors.text }]}>
                    {penalty.profiles?.display_name || 'Unknown User'}
                  </Text>
                </View>

                <View style={styles.penaltyInfo}>
                  <Text style={[styles.penaltyLabel, { color: colors.textSecondary }]}>Reason</Text>
                  <Text style={[styles.penaltyValue, { color: colors.text }]}>
                    {penalty.reason || 'No reason provided'}
                  </Text>
                </View>

                <View style={styles.penaltyInfo}>
                  <Text style={[styles.penaltyLabel, { color: colors.textSecondary }]}>Date</Text>
                  <Text style={[styles.penaltyValue, { color: colors.text }]}>
                    {formatDate(penalty.created_at)}
                  </Text>
                </View>

                {penalty.expires_at && (
                  <View style={styles.penaltyInfo}>
                    <Text style={[styles.penaltyLabel, { color: colors.textSecondary }]}>Expires</Text>
                    <Text style={[styles.penaltyValue, { color: colors.text }]}>
                      {formatDate(penalty.expires_at)}
                    </Text>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
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
  penaltyCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  penaltyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  actionTypeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  activeIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  activeIndicatorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  penaltyInfo: {
    gap: 4,
  },
  penaltyLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  penaltyValue: {
    fontSize: 14,
    fontWeight: '400',
  },
});