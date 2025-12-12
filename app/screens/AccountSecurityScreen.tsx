
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  Switch,
  Modal,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { twoFactorAuthService, TwoFactorAuth, LoginHistory } from '@/app/services/twoFactorAuthService';
import GradientButton from '@/components/GradientButton';

export default function AccountSecurityScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [twoFactorSettings, setTwoFactorSettings] = useState<TwoFactorAuth | null>(null);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'sms' | 'email'>('email');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  const loadData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const [settings, history] = await Promise.all([
      twoFactorAuthService.get2FASettings(user.id),
      twoFactorAuthService.getLoginHistory(user.id),
    ]);

    setTwoFactorSettings(settings);
    setLoginHistory(history);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggle2FA = async (enabled: boolean) => {
    if (!user) return;

    if (enabled) {
      setShow2FAModal(true);
    } else {
      Alert.alert(
        'Disable 2FA',
        'Are you sure you want to disable two-factor authentication?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              const result = await twoFactorAuthService.disable2FA(user.id);
              if (result.success) {
                Alert.alert('Success', '2FA has been disabled.');
                await loadData();
              } else {
                Alert.alert('Error', result.error || 'Failed to disable 2FA.');
              }
            },
          },
        ]
      );
    }
  };

  const handleEnable2FA = async () => {
    if (!user) return;

    if (selectedMethod === 'sms' && !phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number.');
      return;
    }

    if (selectedMethod === 'email' && !email.trim()) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }

    const result = await twoFactorAuthService.enable2FA(
      user.id,
      selectedMethod,
      selectedMethod === 'sms' ? phoneNumber : undefined,
      selectedMethod === 'email' ? email : undefined
    );

    if (result.success) {
      Alert.alert('Success', '2FA has been enabled successfully.');
      setShow2FAModal(false);
      setPhoneNumber('');
      setEmail('');
      await loadData();
    } else {
      Alert.alert('Error', result.error || 'Failed to enable 2FA.');
    }
  };

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'Password change functionality will be available soon.');
  };

  const handleLogoutDevice = async (loginId: string) => {
    Alert.alert(
      'Logout Device',
      'Are you sure you want to logout from this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            const result = await twoFactorAuthService.logoutFromDevice(loginId);
            if (result.success) {
              Alert.alert('Success', 'Device logged out successfully.');
              await loadData();
            } else {
              Alert.alert('Error', result.error || 'Failed to logout device.');
            }
          },
        },
      ]
    );
  };

  const handleLogoutAllDevices = async () => {
    if (!user) return;

    Alert.alert(
      'Logout All Devices',
      'Are you sure you want to logout from all devices? You will need to login again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout All',
          style: 'destructive',
          onPress: async () => {
            const result = await twoFactorAuthService.logoutFromAllDevices(user.id);
            if (result.success) {
              Alert.alert('Success', 'All devices logged out successfully.');
              await loadData();
            } else {
              Alert.alert('Error', result.error || 'Failed to logout all devices.');
            }
          },
        },
      ]
    );
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Account Security</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Security Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🔐 Security Settings</Text>

          <View style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <IconSymbol
                  ios_icon_name="shield.fill"
                  android_material_icon_name="security"
                  size={20}
                  color={colors.brandPrimary}
                />
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>Two-Factor Authentication</Text>
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                    {twoFactorSettings?.is_enabled ? `Enabled via ${twoFactorSettings.method}` : 'Not enabled'}
                  </Text>
                </View>
              </View>
              <Switch
                value={twoFactorSettings?.is_enabled || false}
                onValueChange={handleToggle2FA}
                trackColor={{ false: colors.border, true: colors.brandPrimary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleChangePassword}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <IconSymbol
                  ios_icon_name="lock.fill"
                  android_material_icon_name="lock"
                  size={20}
                  color={colors.text}
                />
                <Text style={[styles.settingTitle, { color: colors.text }]}>Change Password</Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron_right"
                size={20}
                color={colors.textSecondary}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Login History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>📱 Login History</Text>
            <TouchableOpacity onPress={handleLogoutAllDevices}>
              <Text style={[styles.logoutAllText, { color: colors.brandPrimary }]}>Logout All</Text>
            </TouchableOpacity>
          </View>

          {loginHistory.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
              <IconSymbol
                ios_icon_name="clock.fill"
                android_material_icon_name="history"
                size={32}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No login history</Text>
            </View>
          ) : (
            loginHistory.map((login) => (
              <View key={login.id} style={[styles.loginCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.loginHeader}>
                  <View style={styles.loginInfo}>
                    <IconSymbol
                      ios_icon_name={login.device === 'ios' ? 'iphone' : login.device === 'android' ? 'phone.fill' : 'desktopcomputer'}
                      android_material_icon_name={login.device === 'ios' ? 'phone_iphone' : login.device === 'android' ? 'phone_android' : 'computer'}
                      size={20}
                      color={colors.text}
                    />
                    <View style={styles.loginDetails}>
                      <Text style={[styles.loginDevice, { color: colors.text }]}>
                        {login.device?.toUpperCase() || 'Unknown Device'}
                      </Text>
                      <Text style={[styles.loginTime, { color: colors.textSecondary }]}>
                        {new Date(login.logged_in_at).toLocaleString()}
                      </Text>
                      {login.location && (
                        <Text style={[styles.loginLocation, { color: colors.textSecondary }]}>
                          {login.location}
                        </Text>
                      )}
                      {login.ip_address && (
                        <Text style={[styles.loginIP, { color: colors.textSecondary }]}>
                          IP: {login.ip_address}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: login.status === 'success' ? '#00C853' : login.status === 'logged_out' ? colors.textSecondary : colors.brandPrimary }]}>
                    <Text style={styles.statusText}>{login.status.toUpperCase()}</Text>
                  </View>
                </View>
                {login.status === 'success' && (
                  <TouchableOpacity
                    style={[styles.logoutButton, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}
                    onPress={() => handleLogoutDevice(login.id)}
                  >
                    <Text style={[styles.logoutButtonText, { color: colors.brandPrimary }]}>Logout This Device</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* 2FA Setup Modal */}
      <Modal
        visible={show2FAModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShow2FAModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Enable 2FA</Text>
              <TouchableOpacity onPress={() => setShow2FAModal(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.label, { color: colors.text }]}>Verification Method</Text>

              <TouchableOpacity
                style={[styles.methodCard, { backgroundColor: selectedMethod === 'email' ? colors.brandPrimary + '20' : colors.backgroundAlt, borderColor: selectedMethod === 'email' ? colors.brandPrimary : colors.border }]}
                onPress={() => setSelectedMethod('email')}
              >
                <View style={styles.methodLeft}>
                  <IconSymbol
                    ios_icon_name="envelope.fill"
                    android_material_icon_name="email"
                    size={20}
                    color={selectedMethod === 'email' ? colors.brandPrimary : colors.text}
                  />
                  <Text style={[styles.methodText, { color: selectedMethod === 'email' ? colors.brandPrimary : colors.text }]}>
                    Email Verification
                  </Text>
                </View>
                {selectedMethod === 'email' && (
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check_circle"
                    size={20}
                    color={colors.brandPrimary}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.methodCard, { backgroundColor: selectedMethod === 'sms' ? colors.brandPrimary + '20' : colors.backgroundAlt, borderColor: selectedMethod === 'sms' ? colors.brandPrimary : colors.border }]}
                onPress={() => setSelectedMethod('sms')}
              >
                <View style={styles.methodLeft}>
                  <IconSymbol
                    ios_icon_name="message.fill"
                    android_material_icon_name="sms"
                    size={20}
                    color={selectedMethod === 'sms' ? colors.brandPrimary : colors.text}
                  />
                  <Text style={[styles.methodText, { color: selectedMethod === 'sms' ? colors.brandPrimary : colors.text }]}>
                    SMS Verification
                  </Text>
                </View>
                {selectedMethod === 'sms' && (
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check_circle"
                    size={20}
                    color={colors.brandPrimary}
                  />
                )}
              </TouchableOpacity>

              {selectedMethod === 'sms' && (
                <>
                  <Text style={[styles.label, { color: colors.text }]}>Phone Number</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, color: colors.text }]}
                    placeholder="+1 234 567 8900"
                    placeholderTextColor={colors.textSecondary}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                  />
                </>
              )}

              {selectedMethod === 'email' && (
                <>
                  <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, color: colors.text }]}
                    placeholder="your@email.com"
                    placeholderTextColor={colors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}
                  onPress={() => setShow2FAModal(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <View style={styles.enableButtonContainer}>
                  <GradientButton title="Enable 2FA" onPress={handleEnable2FA} />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 120,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  logoutAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 12,
    fontWeight: '400',
  },
  loginCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  loginHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  loginInfo: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  loginDetails: {
    flex: 1,
  },
  loginDevice: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  loginTime: {
    fontSize: 12,
    fontWeight: '400',
    marginBottom: 2,
  },
  loginLocation: {
    fontSize: 12,
    fontWeight: '400',
    marginBottom: 2,
  },
  loginIP: {
    fontSize: 12,
    fontWeight: '400',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  logoutButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCard: {
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  methodCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  methodText: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  enableButtonContainer: {
    flex: 1,
  },
});