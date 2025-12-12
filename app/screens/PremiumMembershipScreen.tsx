
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PremiumMembershipScreen() {
  const theme = useTheme();
  const router = useRouter();

  const benefits = [
    'Ad-free streaming experience',
    'Exclusive badges and emotes',
    'Priority customer support',
    'Early access to new features',
    'Custom profile themes',
    'Increased upload limits',
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow_back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Premium Membership</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.premiumCard}>
          <IconSymbol ios_icon_name="crown.fill" android_material_icon_name="workspace_premium" size={60} color="#FFD700" />
          <Text style={[styles.premiumTitle, { color: theme.colors.text }]}>Go Premium</Text>
          <Text style={[styles.premiumPrice, { color: '#FFD700' }]}>89 SEK/Month</Text>
        </View>

        <View style={styles.benefitsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Premium Benefits</Text>
          {benefits.map((benefit, index) => (
            <View key={index} style={styles.benefitItem}>
              <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check_circle" size={24} color="#34C759" />
              <Text style={[styles.benefitText, { color: theme.colors.text }]}>{benefit}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.subscribeButton}>
          <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
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
  premiumCard: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  premiumTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  premiumPrice: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  benefitsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 16,
    flex: 1,
  },
  subscribeButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
