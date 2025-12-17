
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
import { analyticsService, AnalyticsSummary, CreatorPerformanceScore } from '@/app/services/analyticsService';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function PerformanceGrowthScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [performanceScore, setPerformanceScore] = useState<CreatorPerformanceScore | null>(null);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const [summary, score] = await Promise.all([
        analyticsService.getAnalyticsSummary(user.id),
        analyticsService.getCreatorPerformanceScore(user.id),
      ]);

      setAnalytics(summary);
      setPerformanceScore(score);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#4CAF50';
    if (score >= 50) return '#FFA500';
    return '#DC143C';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Elite Creator';
    if (score >= 50) return 'Rising Talent';
    if (score >= 25) return 'Growing';
    return 'Rookie';
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatCurrency = (amount: number): string => {
    return `${amount.toFixed(0)} SEK`;
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Performance & Growth</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading analytics...
          </Text>
        </View>
      </View>
    );
  }

  if (!analytics) {
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Performance & Growth</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyContainer}>
          <IconSymbol
            ios_icon_name="chart.bar.xaxis"
            android_material_icon_name="bar_chart"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: colors.text }]}>No Analytics Yet</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Start streaming to see your performance data
          </Text>
        </View>
      </View>
    );
  }

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Performance & Growth</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Creator Score Badge */}
        {performanceScore && (
          <View style={styles.scoreSection}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.scoreCard}
            >
              <View style={styles.scoreContent}>
                <View style={styles.scoreInfo}>
                  <Text style={styles.scoreLabel}>Your Creator Score</Text>
                  <Text style={styles.scoreValue}>{performanceScore.last_7_days_score}</Text>
                  <Text style={styles.scoreRank}>
                    {getScoreLabel(performanceScore.last_7_days_score)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.scoreBadge,
                    { backgroundColor: getScoreColor(performanceScore.last_7_days_score) },
                  ]}
                >
                  <IconSymbol
                    ios_icon_name="star.fill"
                    android_material_icon_name="star"
                    size={32}
                    color="#FFFFFF"
                  />
                </View>
              </View>
              <View style={styles.scoreBreakdown}>
                <View style={styles.scoreItem}>
                  <Text style={styles.scoreItemLabel}>7 Days</Text>
                  <Text style={styles.scoreItemValue}>{performanceScore.last_7_days_score}</Text>
                </View>
                <View style={styles.scoreItem}>
                  <Text style={styles.scoreItemLabel}>30 Days</Text>
                  <Text style={styles.scoreItemValue}>{performanceScore.last_30_days_score}</Text>
                </View>
                <View style={styles.scoreItem}>
                  <Text style={styles.scoreItemLabel}>Lifetime</Text>
                  <Text style={styles.scoreItemValue}>{performanceScore.lifetime_score}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Latest Stream Summary */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Latest Stream Summary</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <IconSymbol
                  ios_icon_name="person.3.fill"
                  android_material_icon_name="group"
                  size={24}
                  color={colors.brandPrimary}
                />
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {analytics.latestStream.peakViewers}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Peak Viewers</Text>
              </View>
              <View style={styles.statItem}>
                <IconSymbol
                  ios_icon_name="clock.fill"
                  android_material_icon_name="schedule"
                  size={24}
                  color={colors.brandPrimary}
                />
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {formatDuration(analytics.latestStream.totalWatchTime)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Watch Time</Text>
              </View>
            </View>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <IconSymbol
                  ios_icon_name="gift.fill"
                  android_material_icon_name="card_giftcard"
                  size={24}
                  color={colors.brandPrimary}
                />
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {formatCurrency(analytics.latestStream.totalRevenue)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Gift Revenue</Text>
              </View>
              <View style={styles.statItem}>
                <IconSymbol
                  ios_icon_name="person.badge.plus.fill"
                  android_material_icon_name="person_add"
                  size={24}
                  color={colors.brandPrimary}
                />
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {analytics.latestStream.followerConversion}%
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Follower Conv.</Text>
              </View>
            </View>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <IconSymbol
                  ios_icon_name="timer.fill"
                  android_material_icon_name="timer"
                  size={24}
                  color={colors.brandPrimary}
                />
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {formatDuration(analytics.latestStream.avgSessionDuration)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Session</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Earnings Analytics */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Earnings Analytics</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.earningsHeader}>
              <Text style={[styles.earningsTotal, { color: colors.text }]}>
                {formatCurrency(analytics.earnings.totalGiftValue)}
              </Text>
              <Text style={[styles.earningsLabel, { color: colors.textSecondary }]}>
                Total Gift Value
              </Text>
            </View>

            <View style={styles.conversionFunnel}>
              <Text style={[styles.funnelTitle, { color: colors.text }]}>Conversion Funnel</Text>
              <View style={styles.funnelBar}>
                <View style={[styles.funnelSegment, { flex: analytics.earnings.conversionFunnel.viewers }]}>
                  <Text style={styles.funnelLabel}>
                    {analytics.earnings.conversionFunnel.viewers} Viewers
                  </Text>
                </View>
              </View>
              <View style={styles.funnelBar}>
                <View
                  style={[
                    styles.funnelSegment,
                    { flex: analytics.earnings.conversionFunnel.chatters, backgroundColor: colors.brandPrimary },
                  ]}
                >
                  <Text style={styles.funnelLabel}>
                    {analytics.earnings.conversionFunnel.chatters} Chatters
                  </Text>
                </View>
              </View>
              <View style={styles.funnelBar}>
                <View
                  style={[
                    styles.funnelSegment,
                    { flex: analytics.earnings.conversionFunnel.gifters, backgroundColor: colors.gradientEnd },
                  ]}
                >
                  <Text style={styles.funnelLabel}>
                    {analytics.earnings.conversionFunnel.gifters} Gifters
                  </Text>
                </View>
              </View>
            </View>

            {analytics.earnings.topGifters.length > 0 && (
              <View style={styles.topGifters}>
                <Text style={[styles.topGiftersTitle, { color: colors.text }]}>Top Gifters</Text>
                {analytics.earnings.topGifters.slice(0, 5).map((gifter, index) => (
                  <View key={gifter.userId} style={styles.gifterRow}>
                    <View style={styles.gifterRank}>
                      <Text style={[styles.gifterRankText, { color: colors.text }]}>#{index + 1}</Text>
                    </View>
                    <Text style={[styles.gifterName, { color: colors.text }]}>@{gifter.username}</Text>
                    <Text style={[styles.gifterAmount, { color: colors.brandPrimary }]}>
                      {formatCurrency(gifter.amount)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Audience Segments */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Audience Segments</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.segmentRow}>
              <View style={styles.segmentItem}>
                <IconSymbol
                  ios_icon_name="person.badge.plus"
                  android_material_icon_name="person_add"
                  size={32}
                  color="#4ECDC4"
                />
                <Text style={[styles.segmentValue, { color: colors.text }]}>
                  {analytics.audienceSegments.newViewers}
                </Text>
                <Text style={[styles.segmentLabel, { color: colors.textSecondary }]}>New Viewers</Text>
              </View>
              <View style={styles.segmentItem}>
                <IconSymbol
                  ios_icon_name="arrow.clockwise.circle.fill"
                  android_material_icon_name="refresh"
                  size={32}
                  color="#FFA500"
                />
                <Text style={[styles.segmentValue, { color: colors.text }]}>
                  {analytics.audienceSegments.returningViewers}
                </Text>
                <Text style={[styles.segmentLabel, { color: colors.textSecondary }]}>Returning</Text>
              </View>
              <View style={styles.segmentItem}>
                <IconSymbol
                  ios_icon_name="star.circle.fill"
                  android_material_icon_name="star"
                  size={32}
                  color="#FFD700"
                />
                <Text style={[styles.segmentValue, { color: colors.text }]}>
                  {analytics.audienceSegments.loyalCore}
                </Text>
                <Text style={[styles.segmentLabel, { color: colors.textSecondary }]}>Loyal Core</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Trend Graphs Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>30-Day Trends</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.trendNote, { color: colors.textSecondary }]}>
              📊 Detailed trend graphs coming soon
            </Text>
            <Text style={[styles.trendSubnote, { color: colors.textSecondary }]}>
              Track viewership, follower growth, and retention over time
            </Text>
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
  scoreSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  scoreCard: {
    borderRadius: 20,
    padding: 24,
    gap: 20,
  },
  scoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreInfo: {
    flex: 1,
    gap: 8,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scoreRank: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scoreBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  scoreItem: {
    alignItems: 'center',
    gap: 4,
  },
  scoreItemLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.8,
  },
  scoreItemValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
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
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    gap: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  earningsHeader: {
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  earningsTotal: {
    fontSize: 36,
    fontWeight: '800',
  },
  earningsLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  conversionFunnel: {
    gap: 12,
  },
  funnelTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  funnelBar: {
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
  },
  funnelSegment: {
    height: '100%',
    backgroundColor: '#4ECDC4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  funnelLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  topGifters: {
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  topGiftersTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  gifterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gifterRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gifterRankText: {
    fontSize: 14,
    fontWeight: '700',
  },
  gifterName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  gifterAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  segmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  segmentItem: {
    alignItems: 'center',
    gap: 8,
  },
  segmentValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  segmentLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  trendNote: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  trendSubnote: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 8,
  },
});