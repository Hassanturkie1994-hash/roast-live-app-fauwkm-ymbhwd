
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
import RoastIcon from '@/components/icons/RoastIcon';
import GradientButton from '@/components/GradientButton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  payment_method?: string;
  source?: string;
  status: string;
  created_at: string;
}

export default function WalletScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      const [walletData, transactionsData] = await Promise.all([
        supabase
          .from('wallet')
          .select('balance')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      if (walletData.data) {
        setWalletBalance(parseFloat(walletData.data.balance));
      }

      if (transactionsData.data) {
        setTransactions(transactionsData.data);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddBalance = () => {
    router.push('/screens/AddBalanceScreen');
  };

  const handleViewAllTransactions = () => {
    router.push('/screens/TransactionHistoryScreen');
  };

  const getTransactionIcon = (type: string): 'roast-gift-box' | 'lava-wallet' | 'fire-info' | 'heart' => {
    switch (type) {
      case 'add_balance':
      case 'wallet_topup':
        return 'lava-wallet';
      case 'withdraw':
      case 'withdrawal':
        return 'lava-wallet';
      case 'gift_purchase':
        return 'roast-gift-box';
      case 'creator_tip':
        return 'heart';
      default:
        return 'fire-info';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return '#4CAF50';
      case 'pending':
        return '#FFC107';
      case 'failed':
      case 'cancelled':
        return '#F44336';
      default:
        return colors.textSecondary;
    }
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

  const formatType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <RoastIcon
            name="chevron-left"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Saldo</Text>
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
          {/* Balance Card */}
          <View style={[styles.balanceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <RoastIcon name="lava-wallet" size={48} color={colors.brandPrimary} />
            <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Current Balance</Text>
            <Text style={[styles.balanceAmount, { color: colors.text }]}>{walletBalance.toFixed(2)} SEK</Text>
            <View style={styles.balanceActions}>
              <GradientButton
                title="Add Balance"
                onPress={handleAddBalance}
                size="medium"
              />
            </View>
          </View>

          {/* Recent Transactions */}
          <View style={styles.transactionsSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Transactions</Text>
              {transactions.length > 5 && (
                <TouchableOpacity onPress={handleViewAllTransactions}>
                  <Text style={[styles.viewAllText, { color: colors.brandPrimary }]}>View All</Text>
                </TouchableOpacity>
              )}
            </View>

            {transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <RoastIcon
                  name="fire-info"
                  size={48}
                  color={colors.textSecondary}
                />
                <Text style={[styles.emptyText, { color: colors.text }]}>No transactions yet</Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                  Add balance to start using gifts and features
                </Text>
              </View>
            ) : (
              <View style={styles.transactionsList}>
                {transactions.slice(0, 5).map((transaction, index) => {
                  const iconName = getTransactionIcon(transaction.type);
                  return (
                    <View key={index} style={[styles.transactionItem, { borderBottomColor: colors.divider }]}>
                      <View style={styles.transactionLeft}>
                        <View style={[styles.iconContainer, { backgroundColor: `${colors.brandPrimary}20` }]}>
                          <RoastIcon
                            name={iconName}
                            size={24}
                            color={colors.brandPrimary}
                          />
                        </View>
                        <View style={styles.transactionInfo}>
                          <Text style={[styles.transactionType, { color: colors.text }]}>{formatType(transaction.type)}</Text>
                          <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>{formatDate(transaction.created_at)}</Text>
                        </View>
                      </View>
                      <View style={styles.transactionRight}>
                        <Text
                          style={[
                            styles.transactionAmount,
                            { color: transaction.amount > 0 ? colors.brandPrimary : colors.text },
                          ]}
                        >
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)} SEK
                        </Text>
                        <Text style={[styles.transactionStatus, { color: getStatusColor(transaction.status) }]}>
                          {transaction.status}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Info Card */}
          <View style={[styles.infoCard, { backgroundColor: colors.backgroundAlt }]}>
            <RoastIcon
              name="fire-info"
              size={24}
              color={colors.brandPrimary}
            />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Your Saldo balance can be used to purchase gifts during live streams and support your favorite creators.
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
  balanceCard: {
    borderRadius: 16,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    borderWidth: 1,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: '800',
    marginBottom: 20,
  },
  balanceActions: {
    width: '100%',
  },
  transactionsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 8,
    textAlign: 'center',
  },
  transactionsList: {
    gap: 0,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 15,
    fontWeight: '600',
  },
  transactionDate: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  transactionStatus: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  infoCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
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