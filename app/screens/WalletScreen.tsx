
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WalletScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow_back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Wallet</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.balanceCard}>
          <Text style={[styles.balanceLabel, { color: '#666' }]}>Available Balance</Text>
          <Text style={[styles.balanceAmount, { color: theme.colors.text }]}>100.00 SEK</Text>
        </View>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/screens/AddBalanceScreen' as any)}
        >
          <IconSymbol ios_icon_name="plus.circle.fill" android_material_icon_name="add_circle" size={24} color="#34C759" />
          <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>Add Balance</Text>
          <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron_right" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/screens/WithdrawScreen' as any)}
        >
          <IconSymbol ios_icon_name="arrow.down.circle.fill" android_material_icon_name="download" size={24} color="#FF3B30" />
          <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>Withdraw</Text>
          <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron_right" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/screens/TransactionHistoryScreen' as any)}
        >
          <IconSymbol ios_icon_name="clock.fill" android_material_icon_name="history" size={24} color="#4A90E2" />
          <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>Transaction History</Text>
          <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron_right" size={20} color="#666" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 120,
  },
  balanceCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
});
