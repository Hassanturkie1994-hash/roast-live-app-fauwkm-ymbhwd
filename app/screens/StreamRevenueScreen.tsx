
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
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';

interface GiftReceived {
  id: string;
  gift_name: string;
  gift_emoji: string;
  sender_name: string;
  amount: number;
  created_at: string;
  stream_title?: string;
}

interface StreamRevenue {
  stream_id: string;
  stream_title: string;
  total_revenue: number;
  gift_count: number;
  started_at: string;
}

export default function StreamRevenueScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [withdrawableBalance, setWithdrawableBalance] = useState(0);
  const [recentGifts, setRecentGifts] = useState<GiftReceived[]>([]);
  const [streamRevenues, setStreamRevenues] = useState<StreamRevenue[]>([]);

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch wallet balance
      const { data: walletData } = await supabase
        .from('wallet')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (walletData) {
        setWithdrawableBalance(parseFloat(walletData.balance));
      }

      // Fetch recent gifts received
      const { data: giftsData } = await supabase
        .from('gift_events')
        .select(`
          id,
          price_sek,
          created_at,
          livestream_id,
          gift:gifts(name, emoji_icon),
          sender:sender_user_id(display_name, username),
          stream:livestream_id(title)
        `)
        .eq('receiver_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (giftsData) {
        const formattedGifts = giftsData.map((gift: any) => ({
          id: gift.id,
          gift_name: gift.gift?.name || 'Unknown Gift',
          gift_emoji: gift.gift?.emoji_icon || '🎁',
          sender_name: gift.sender?.display_name || gift.sender?.username || 'Anonymous',
          amount: gift.price_sek,
          created_at: gift.created_at,
          stream_title: gift.stream?.title,
        }));
        setRecentGifts(formattedGifts);

        // Calculate total revenue
        const total = giftsData.reduce((sum: number, gift: any) => sum + gift.price_sek, 0);
        setTotalRevenue(total);
      }

      // Fetch revenue per stream
      const { data: streamsData } = await supabase
        .from('streams')
        .select(`
          id,
          title,
          started_at,
          gift_events(price_sek)
        `)
        .eq('broadcaster_id', user.id)
        .order('started_at', { ascending: false })
        .limit(10);

      if (streamsData) {
        const formattedStreams = streamsData
          .map((stream: any) => {
            const gifts = stream.gift_events || [];
            const totalRevenue = gifts.reduce((sum: number, gift: any) => sum + gift.price_sek, 0);
            return {
              stream_id: stream.id,
              stream_title: stream.title,
              total_revenue: totalRevenue,
              gift_count: gifts.length,
              started_at: stream.started_at,
            };
          })
          .filter((stream: StreamRevenue) => stream.total_revenue > 0);
        setStreamRevenues(formattedStreams);
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleWithdraw = () => {
    router.push('/screens/WithdrawScreen');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Stream Revenue</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Revenue Summary Cards */}
          <View style={styles.summaryContainer}>
            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <IconSymbol
                ios_icon_name="chart.bar.fill"
                android_material_icon_name="bar_chart"
                size={24}
                color={colors.brandPrimary}
              />
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Revenue</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{totalRevenue.toFixed(2)} SEK</Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <IconSymbol
                ios_icon_name="wallet.pass.fill"
                android_material_icon_name="account_balance_wallet"
                size={24}
                color={colors.brandPrimary}
              />
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Withdrawable</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{withdrawableBalance.toFixed(2)} SEK</Text>
            </View>
          </View>

          {/* Withdraw Button */}
          <View style={styles.withdrawContainer}>
            <GradientButton
              title="Withdraw Funds"
              onPress={handleWithdraw}
              size="medium"
              disabled={withdrawableBalance <= 0}
            />
          </View>

          {/* Recent Gifts Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Gifts Received</Text>

            {recentGifts.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol
                  ios_icon_name="gift"
                  android_material_icon_name="card_giftcard"
                  size={48}
                  color={colors.textSecondary}
                />
                <Text style={[styles.emptyText, { color: colors.text }]}>No gifts received yet</Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                  Start streaming to receive gifts from viewers
                </Text>
              </View>
            ) : (
              <View style={styles.giftsList}>
                {recentGifts.map((gift, index) => (
                  <View key={index} style={[styles.giftItem, { borderBottomColor: colors.divider }]}>
                    <View style={styles.giftLeft}>
                      <Text style={styles.giftEmoji}>{gift.gift_emoji}</Text>
                      <View style={styles.giftInfo}>
                        <Text style={[styles.giftName, { color: colors.text }]}>{gift.gift_name}</Text>
                        <Text style={[styles.giftSender, { color: colors.textSecondary }]}>
                          from {gift.sender_name}
                        </Text>
                        {gift.stream_title && (
                          <Text style={[styles.giftStream, { color: colors.textSecondary }]} numberOfLines={1}>
                            {gift.stream_title}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.giftRight}>
                      <Text style={[styles.giftAmount, { color: colors.brandPrimary }]}>
                        +{gift.amount} SEK
                      </Text>
                      <Text style={[styles.giftDate, { color: colors.textSecondary }]}>
                        {formatDate(gift.created_at)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Revenue Per Stream Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Revenue by Stream</Text>

            {streamRevenues.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol
                  ios_icon_name="video.slash"
                  android_material_icon_name="videocam_off"
                  size={48}
                  color={colors.textSecondary}
                />
                <Text style={[styles.emptyText, { color: colors.text }]}>No stream revenue yet</Text>
              </View>
            ) : (
              <View style={styles.streamsList}>
                {streamRevenues.map((stream, index) => (
                  <View key={index} style={[styles.streamItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.streamHeader}>
                      <IconSymbol
                        ios_icon_name="video.fill"
                        android_material_icon_name="videocam"
                        size={20}
                        color={colors.brandPrimary}
                      />
                      <Text style={[styles.streamTitle, { color: colors.text }]} numberOfLines={1}>
                        {stream.stream_title}
                      </Text>
                    </View>
                    <View style={styles.streamStats}>
                      <View style={styles.streamStat}>
                        <Text style={[styles.streamStatLabel, { color: colors.textSecondary }]}>Revenue</Text>
                        <Text style={[styles.streamStatValue, { color: colors.brandPrimary }]}>
                          {stream.total_revenue.toFixed(2)} SEK
                        </Text>
                      </View>
                      <View style={styles.streamStat}>
                        <Text style={[styles.streamStatLabel, { color: colors.textSecondary }]}>Gifts</Text>
                        <Text style={[styles.streamStatValue, { color: colors.text }]}>
                          {stream.gift_count}
                        </Text>
                      </View>
                      <View style={styles.streamStat}>
                        <Text style={[styles.streamStatLabel, { color: colors.textSecondary }]}>Date</Text>
                        <Text style={[styles.streamStatValue, { color: colors.text }]}>
                          {formatDate(stream.started_at)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Info Card */}
          <View style={[styles.infoCard, { backgroundColor: colors.backgroundAlt }]}>
            <IconSymbol
              ios_icon_name="info.circle.fill"
              android_material_icon_name="info"
              size={20}
              color={colors.brandPrimary}
            />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Revenue from gifts is automatically added to your wallet balance. You can withdraw funds at any time.
            </Text>
          </View>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  withdrawContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
  giftsList: {
    gap: 0,
  },
  giftItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  giftLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  giftEmoji: {
    fontSize: 32,
  },
  giftInfo: {
    flex: 1,
  },
  giftName: {
    fontSize: 15,
    fontWeight: '600',
  },
  giftSender: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 2,
  },
  giftStream: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
  },
  giftRight: {
    alignItems: 'flex-end',
  },
  giftAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  giftDate: {
    fontSize: 11,
    fontWeight: '400',
    marginTop: 2,
  },
  streamsList: {
    gap: 12,
  },
  streamItem: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  streamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  streamTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  streamStats: {
    flexDirection: 'row',
    gap: 16,
  },
  streamStat: {
    flex: 1,
  },
  streamStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  streamStatValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  infoCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 32,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
});