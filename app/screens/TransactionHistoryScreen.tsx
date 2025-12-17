
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';

interface Transaction {
  id: string;
  amount: number;
  type: 'add_balance' | 'withdraw' | 'creator_tip' | 'wallet_topup' | 'gift_purchase';
  status: 'pending' | 'completed' | 'failed' | 'paid' | 'cancelled';
  created_at: string;
}

export default function TransactionHistoryScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      const [transactionsData, walletData] = await Promise.all([
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('wallet')
          .select('balance')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      if (transactionsData.data) {
        setTransactions(transactionsData.data);
      }

      if (walletData.data) {
        setWalletBalance(parseFloat(walletData.data.balance));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'add_balance':
      case 'wallet_topup':
        return { ios: 'plus.circle.fill', android: 'add_circle', color: colors.gradientEnd };
      case 'withdraw':
        return { ios: 'arrow.down.circle.fill', android: 'download', color: colors.text };
      case 'creator_tip':
      case 'gift_purchase':
        return { ios: 'gift.fill', android: 'card_giftcard', color: colors.gradientEnd };
      default:
        return { ios: 'circle.fill', android: 'circle', color: colors.text };
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.gradientEnd} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceAmount}>${walletBalance.toFixed(2)}</Text>
          </View>

          <View style={styles.transactionsContainer}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>

            {transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol
                  ios_icon_name="tray"
                  android_material_icon_name="inbox"
                  size={48}
                  color={colors.textSecondary}
                />
                <Text style={styles.emptyText}>No transactions yet</Text>
              </View>
            ) : (
              transactions.map((transaction) => {
                const icon = getTransactionIcon(transaction.type);
                return (
                  <View key={`transaction-${transaction.id}`} style={styles.transactionItem}>
                    <View style={styles.transactionLeft}>
                      <View style={styles.iconContainer}>
                        <IconSymbol
                          ios_icon_name={icon.ios}
                          android_material_icon_name={icon.android}
                          size={24}
                          color={icon.color}
                        />
                      </View>
                      <View>
                        <Text style={styles.transactionType}>{formatType(transaction.type)}</Text>
                        <Text style={styles.transactionDate}>{formatDate(transaction.created_at)}</Text>
                      </View>
                    </View>
                    <View style={styles.transactionRight}>
                      <Text
                        style={[
                          styles.transactionAmount,
                          transaction.type === 'withdraw' && styles.negativeAmount,
                        ]}
                      >
                        {transaction.type === 'withdraw' ? '-' : '+'}${Math.abs(transaction.amount).toFixed(2)}
                      </Text>
                      <Text style={[styles.transactionStatus, { color: getStatusColor(transaction.status) }]}>
                        {transaction.status}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    color: colors.text,
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
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
  },
  transactionsContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
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
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  transactionDate: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gradientEnd,
  },
  negativeAmount: {
    color: colors.text,
  },
  transactionStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'capitalize',
  },
});
