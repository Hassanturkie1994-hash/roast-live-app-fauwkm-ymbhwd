
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { retentionAnalyticsService } from '@/app/services/retentionAnalyticsService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RetentionData {
  minute_index: number;
  viewer_count: number;
  engagement_score: number;
  drop_off_rate: number;
  roast_count: number;
}

export default function RetentionAnalyticsScreen() {
  const { streamId } = useLocalSearchParams<{ streamId: string }>();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [retentionData, setRetentionData] = useState<RetentionData[]>([]);

  const fetchRetentionData = useCallback(async () => {
    if (!streamId) return;

    try {
      const data = await retentionAnalyticsService.getStreamRetentionData(streamId);
      setRetentionData(data);
    } catch (error) {
      console.error('Error fetching retention data:', error);
    } finally {
      setLoading(false);
    }
  }, [streamId]);

  useEffect(() => {
    fetchRetentionData();
  }, [fetchRetentionData]);

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Retention Analytics</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {retentionData.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="chart.bar"
              android_material_icon_name="bar_chart"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: colors.text }]}>No retention data available</Text>
          </View>
        ) : (
          <View style={styles.dataContainer}>
            {retentionData.map((data, index) => (
              <View key={`retention-${index}`} style={[styles.dataRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.minuteText, { color: colors.text }]}>Minute {data.minute_index}</Text>
                <Text style={[styles.viewerText, { color: colors.textSecondary }]}>{data.viewer_count} viewers</Text>
                <Text style={[styles.engagementText, { color: colors.brandPrimary }]}>
                  {(data.engagement_score * 100).toFixed(1)}% engagement
                </Text>
              </View>
            ))}
          </View>
        )}
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 20,
    textAlign: 'center',
  },
  dataContainer: {
    padding: 20,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  minuteText: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  viewerText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  engagementText: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
});
