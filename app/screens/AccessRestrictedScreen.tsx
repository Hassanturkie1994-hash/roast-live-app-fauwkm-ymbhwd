
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { deviceBanService } from '@/app/services/deviceBanService';
import { colors } from '@/styles/commonStyles';
import { GradientButton } from '@/components/GradientButton';

export default function AccessRestrictedScreen() {
  const router = useRouter();
  const [banInfo, setBanInfo] = useState<{
    reason?: string;
    expiresAt?: string;
  }>({});

  const checkBanStatus = useCallback(async () => {
    const { banned, reason, expiresAt } = await deviceBanService.isDeviceBanned();
    if (banned) {
      setBanInfo({ reason, expiresAt });
    } else {
      // If not banned, redirect to home
      router.replace('/(tabs)/(home)');
    }
  }, [router]);

  useEffect(() => {
    checkBanStatus();
  }, [checkBanStatus]);

  const formatExpiryDate = (dateString?: string) => {
    if (!dateString) return 'Permanent';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🚫</Text>
        </View>

        <Text style={styles.title}>Access Restricted</Text>

        <Text style={styles.message}>
          Your device has been restricted from accessing Roast Live.
        </Text>

        {banInfo.reason && (
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Reason:</Text>
            <Text style={styles.infoValue}>{banInfo.reason}</Text>
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Ban Type:</Text>
          <Text style={styles.infoValue}>{formatExpiryDate(banInfo.expiresAt)}</Text>
        </View>

        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Need Help?</Text>
          <Text style={styles.helpText}>
            If you believe this is a mistake, please contact our support team at:
          </Text>
          <Text style={styles.email}>support@roastlive.com</Text>
        </View>

        <GradientButton
          title="Check Status Again"
          onPress={checkBanStatus}
          style={styles.button}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  infoCard: {
    width: '100%',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  helpSection: {
    width: '100%',
    marginTop: 24,
    marginBottom: 32,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  email: {
    fontSize: 16,
    color: '#E30052',
    fontWeight: '600',
  },
  button: {
    width: '100%',
  },
});