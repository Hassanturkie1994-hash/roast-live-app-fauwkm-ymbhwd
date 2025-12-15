
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import { adminService } from '@/app/services/adminService';
import LiveBadge from '@/components/LiveBadge';

export default function AdminLiveStreamsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [streams, setStreams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adminRole, setAdminRole] = useState<string | null>(null);

  const checkAdminRole = useCallback(async () => {
    if (!user) return;
    const result = await adminService.checkAdminRole(user.id);
    if (result.success && result.role) {
      setAdminRole(result.role);
    }
  }, [user]);

  const fetchLiveStreams = useCallback(async () => {
    const result = await adminService.getLiveStreams();
    
    if (result.success && result.streams) {
      setStreams(result.streams);
    }
    
    setIsLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    checkAdminRole();
    fetchLiveStreams();
  }, [checkAdminRole, fetchLiveStreams]);

  const handleForceStopStream = async (stream: any) => {
    if (!user || adminRole !== 'HEAD_ADMIN') {
      Alert.alert('Access Denied', 'Only Head Admins can force stop streams');
      return;
    }

    Alert.alert(
      'Force Stop Stream',
      `Are you sure you want to force stop ${stream.users.display_name}'s stream?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop Stream',
          style: 'destructive',
          onPress: async () => {
            const result = await adminService.forceStopStream(
              user.id,
              stream.id,
              stream.broadcaster_id,
              'Force stopped by admin'
            );

            if (result.success) {
              Alert.alert('Success', 'Stream has been stopped');
              fetchLiveStreams();
            } else {
              Alert.alert('Error', result.error || 'Failed to stop stream');
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLiveStreams();
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Live Streams</Text>
      </View>

      {/* Streams List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandPrimary} />
          }
        >
          {streams.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol
                ios_icon_name="video.slash.fill"
                android_material_icon_name="videocam_off"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No live streams currently active
              </Text>
            </View>
          ) : (
            streams.map((stream, index) => (
              <View
                key={index}
                style={[styles.streamCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.streamHeader}>
                  <View style={styles.streamInfo}>
                    <Text style={[styles.streamerName, { color: colors.text }]}>
                      {stream.users.display_name}
                    </Text>
                    <Text style={[styles.streamTitle, { color: colors.textSecondary }]} numberOfLines={1}>
                      {stream.title}
                    </Text>
                  </View>
                  <LiveBadge size="small" />
                </View>

                <View style={styles.streamStats}>
                  <View style={styles.stat}>
                    <IconSymbol
                      ios_icon_name="eye.fill"
                      android_material_icon_name="visibility"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text style={[styles.statText, { color: colors.textSecondary }]}>
                      {stream.viewer_count || 0} viewers
                    </Text>
                  </View>

                  <View style={styles.stat}>
                    <IconSymbol
                      ios_icon_name="flag.fill"
                      android_material_icon_name="flag"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text style={[styles.statText, { color: colors.textSecondary }]}>
                      {stream.report_count || 0} reports
                    </Text>
                  </View>
                </View>

                {adminRole === 'HEAD_ADMIN' && (
                  <TouchableOpacity
                    style={[styles.stopButton, { backgroundColor: colors.gradientEnd }]}
                    onPress={() => handleForceStopStream(stream)}
                    activeOpacity={0.7}
                  >
                    <IconSymbol
                      ios_icon_name="stop.fill"
                      android_material_icon_name="stop"
                      size={16}
                      color="#FFFFFF"
                    />
                    <Text style={styles.stopButtonText}>Force Stop Stream</Text>
                  </TouchableOpacity>
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
  streamCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
  },
  streamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  streamInfo: {
    flex: 1,
    gap: 4,
  },
  streamerName: {
    fontSize: 18,
    fontWeight: '700',
  },
  streamTitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  streamStats: {
    flexDirection: 'row',
    gap: 20,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  stopButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
