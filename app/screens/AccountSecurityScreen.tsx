
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AccountSecurityScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow_back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Account Security</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <IconSymbol ios_icon_name="lock.fill" android_material_icon_name="lock" size={24} color="#8B0000" />
            <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Change Password</Text>
          </View>
          <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron_right" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <IconSymbol ios_icon_name="shield.fill" android_material_icon_name="security" size={24} color="#4A90E2" />
            <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Two-Factor Authentication</Text>
          </View>
          <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron_right" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <IconSymbol ios_icon_name="envelope.fill" android_material_icon_name="email" size={24} color="#FFD700" />
            <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Email Verification</Text>
          </View>
          <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron_right" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <IconSymbol ios_icon_name="phone.fill" android_material_icon_name="phone" size={24} color="#34C759" />
            <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Phone Number</Text>
          </View>
          <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron_right" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <IconSymbol ios_icon_name="clock.fill" android_material_icon_name="history" size={24} color="#666" />
            <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Login History</Text>
          </View>
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
    paddingBottom: 120,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
});
