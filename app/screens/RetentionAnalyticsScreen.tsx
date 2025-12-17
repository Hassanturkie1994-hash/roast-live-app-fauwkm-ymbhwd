
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import {
  retentionAnalyticsService,
  RetentionMetrics,
} from '@/app/services/retentionAnalyticsService';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function RetentionAnalyticsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [retentionData, setRetentionData] = useState<RetentionMetrics | null>(null);
  const [averageRetention, setAverageRetention] = useState(0);
  const [totalDropMoments, setTotalDropMoments] = useState(0);

  useEffect(() => {
    if (user) {
      fetchRetentionData();
    }
  }, [user]);

  const fetchRetentionData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const summary = await retentionAnalyticsService.getRetentionSummary(user.id);
      setRetentionData(summary.latestStreamRetention);
      setAverageRetention(summary.averageRetentionAcrossStreams);
      setTotalDropMoments(summary.totalDropMoments);
    } catch (error) {
      console.error('Error fetching retention data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading retention data...
          </Text>
        </View>
      </View>
    );
  }

  if (!retentionData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
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
        <View style={styles.emptyContainer}>
          <IconSymbol
            ios_icon_name="chart.line.uptrend.xyaxis"
            android_material_icon_name="show_chart"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: colors.text }]}>No Retention Data Yet</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Complete a stream to see retention analytics
          </Text>
        </View>
      </View>
    );
  }

  const maxViewers = Math.max(...retentionData.retentionCurve.map((d) => d.viewers));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
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

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <IconSymbol
              ios_icon_name="clock.fill"
              android_material_icon_name="schedule"
              size={24}
              color={colors.brandPrimary}
            />
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {formatDuration(retentionData.averageRetentionTime)}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Avg Retention Time
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <IconSymbol
              ios_icon_name="chart.bar.fill"
              android_material_icon_name="bar_chart"
              size={24}
              color={colors.brandPrimary}
            />
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {retentionData.totalMinutes}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Total Minutes
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={24}
              color="#DC143C"
            />
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {retentionData.dropMoments.length}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Drop Moments
            </Text>
          </View>
        </View>

        {/* Retention Curve */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Retention Timeline</Text>
          <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chart}>
                {retentionData.retentionCurve.map((point, index) => {
                  const height = (point.viewers / maxViewers) * 150;
                  const isDropMoment = point.isDropMoment;

                  return (
                    <View key={index} style={styles.chartBar}>
                      <View style={styles.barContainer}>
                        {isDropMoment && (
                          <View style={styles.dropMarker}>
                            <View style={styles.dropDot} />
                          </View>
                        )}
                        <LinearGradient
                          colors={
                            isDropMoment
                              ? ['#DC143C', '#A40028']
                              : [colors.gradientStart, colors.gradientEnd]
                          }
                          style={[styles.bar, { height }]}
                        />
                      </View>
                      <Text style={[styles.barLabel, { color: colors.textSecondary }]}>
                        {point.minute}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.brandPrimary }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                  Normal
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#DC143C' }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                  Drop Moment
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Drop Moments Details */}
        {retentionData.dropMoments.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Drop Moments</Text>
            <View style={styles.dropMomentsList}>
              {retentionData.dropMoments.map((drop, index) => (
                <View
                  key={index}
                  style={[styles.dropMomentCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={styles.dropMomentHeader}>
                    <IconSymbol
                      ios_icon_name="arrow.down.circle.fill"
                      android_material_icon_name="arrow_downward"
                      size={24}
                      color="#DC143C"
                    />
                    <Text style={[styles.dropMomentTitle, { color: colors.text }]}>
                      Minute {drop.minute}
                    </Text>
                  </View>
                  <View style={styles.dropMomentStats}>
                    <View style={styles.dropStat}>
                      <Text style={[styles.dropStatValue, { color: '#DC143C' }]}>
                        -{drop.viewersLost}
                      </Text>
                      <Text style={[styles.dropStatLabel, { color: colors.textSecondary }]}>
                        Viewers Lost
                      </Text>
                    </View>
                    <View style={styles.dropStat}>
                      <Text style={[styles.dropStatValue, { color: '#DC143C' }]}>
                        {drop.percentageDrop}%
                      </Text>
                      <Text style={[styles.dropStatLabel, { color: colors.textSecondary }]}>
                        Drop Rate
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Insights */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Insights</Text>
          <View style={[styles.insightCard, { backgroundColor: colors.backgroundAlt }]}>
            <IconSymbol
              ios_icon_name="lightbulb.fill"
              android_material_icon_name="lightbulb"
              size={20}
              color={colors.brandPrimary}
            />
            <View style={styles.insightContent}>
              <Text style={[styles.insightText, { color: colors.text }]}>
                Your average retention time is {formatDuration(averageRetention)} across all streams.
              </Text>
              {retentionData.dropMoments.length > 0 && (
                <Text style={[styles.insightText, { color: colors.text }]}>
                  Review the drop moments to identify content that may need improvement.
                </Text>
              )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '400',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  summarySection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  chartCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingBottom: 20,
  },
  chartBar: {
    alignItems: 'center',
    gap: 8,
  },
  barContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  bar: {
    width: 24,
    borderRadius: 4,
    minHeight: 10,
  },
  dropMarker: {
    position: 'absolute',
    top: -20,
    alignItems: 'center',
  },
  dropDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#DC143C',
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dropMomentsList: {
    gap: 12,
  },
  dropMomentCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  dropMomentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropMomentTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  dropMomentStats: {
    flexDirection: 'row',
    gap: 24,
  },
  dropStat: {
    flex: 1,
    alignItems: 'center',
  },
  dropStatValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  dropStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  insightCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  insightContent: {
    flex: 1,
    gap: 8,
  },
  insightText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
});