
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { pushNotificationService } from '@/app/services/pushNotificationService';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function NotificationSettingsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Notification preferences
  const [streamStarted, setStreamStarted] = useState(true);
  const [giftReceived, setGiftReceived] = useState(true);
  const [newFollower, setNewFollower] = useState(true);
  const [newMessage, setNewMessage] = useState(true);
  const [safetyModerationAlerts, setSafetyModerationAlerts] = useState(true);
  const [adminAnnouncements, setAdminAnnouncements] = useState(true);
  const [notifyWhenFollowedGoesLive, setNotifyWhenFollowedGoesLive] = useState(true);

  // Quiet hours
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState(new Date());
  const [quietHoursEnd, setQuietHoursEnd] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const loadPreferences = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const prefs = await pushNotificationService.getPreferences(user.id);

      if (prefs) {
        setStreamStarted(prefs.stream_started);
        setGiftReceived(prefs.gift_received);
        setNewFollower(prefs.new_follower);
        setNewMessage(prefs.new_message);
        setSafetyModerationAlerts(prefs.safety_moderation_alerts);
        setAdminAnnouncements(prefs.admin_announcements);
        setNotifyWhenFollowedGoesLive(prefs.notify_when_followed_goes_live);

        if (prefs.quiet_hours_start && prefs.quiet_hours_end) {
          setQuietHoursEnabled(true);
          const [startHour, startMin] = prefs.quiet_hours_start.split(':').map(Number);
          const [endHour, endMin] = prefs.quiet_hours_end.split(':').map(Number);
          
          const start = new Date();
          start.setHours(startHour, startMin, 0, 0);
          setQuietHoursStart(start);

          const end = new Date();
          end.setHours(endHour, endMin, 0, 0);
          setQuietHoursEnd(end);
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      Alert.alert('Error', 'Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPreferences();
  }, [user, loadPreferences]);

  const savePreferences = async () => {
    if (!user) return;

    try {
      setSaving(true);

      const quietStart = quietHoursEnabled
        ? `${quietHoursStart.getHours().toString().padStart(2, '0')}:${quietHoursStart.getMinutes().toString().padStart(2, '0')}`
        : null;

      const quietEnd = quietHoursEnabled
        ? `${quietHoursEnd.getHours().toString().padStart(2, '0')}:${quietHoursEnd.getMinutes().toString().padStart(2, '0')}`
        : null;

      const result = await pushNotificationService.updatePreferences(user.id, {
        stream_started: streamStarted,
        gift_received: giftReceived,
        new_follower: newFollower,
        new_message: newMessage,
        safety_moderation_alerts: safetyModerationAlerts,
        admin_announcements: adminAnnouncements,
        notify_when_followed_goes_live: notifyWhenFollowedGoesLive,
        quiet_hours_start: quietStart,
        quiet_hours_end: quietEnd,
      });

      if (result.success) {
        Alert.alert('Success', 'Notification preferences saved successfully');
      } else {
        Alert.alert('Error', result.error || 'Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </View>
    );
  }

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Social Notifications */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📱 Social</Text>

          <View style={[styles.settingItem, { borderBottomColor: colors.divider }]}>
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="video.fill"
                android_material_icon_name="videocam"
                size={20}
                color={colors.brandPrimary}
              />
              <View>
                <Text style={[styles.settingText, { color: colors.text }]}>
                  Creators I follow go LIVE
                </Text>
                <Text style={[styles.settingSubtext, { color: colors.textSecondary }]}>
                  Get notified when followed creators start streaming
                </Text>
              </View>
            </View>
            <Switch
              value={notifyWhenFollowedGoesLive}
              onValueChange={setNotifyWhenFollowedGoesLive}
              trackColor={{ false: colors.border, true: colors.brandPrimary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.settingItem, { borderBottomColor: colors.divider }]}>
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="person.badge.plus.fill"
                android_material_icon_name="person_add"
                size={20}
                color={colors.text}
              />
              <Text style={[styles.settingText, { color: colors.text }]}>New Followers</Text>
            </View>
            <Switch
              value={newFollower}
              onValueChange={setNewFollower}
              trackColor={{ false: colors.border, true: colors.brandPrimary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.settingItem, { borderBottomColor: colors.divider }]}>
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="message.fill"
                android_material_icon_name="message"
                size={20}
                color={colors.text}
              />
              <Text style={[styles.settingText, { color: colors.text }]}>Messages</Text>
            </View>
            <Switch
              value={newMessage}
              onValueChange={setNewMessage}
              trackColor={{ false: colors.border, true: colors.brandPrimary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Gifts & Earnings */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🎁 Gifts & Earnings</Text>

          <View style={[styles.settingItem, { borderBottomColor: colors.divider }]}>
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="gift.fill"
                android_material_icon_name="card_giftcard"
                size={20}
                color={colors.brandPrimary}
              />
              <View>
                <Text style={[styles.settingText, { color: colors.text }]}>Gift Received</Text>
                <Text style={[styles.settingSubtext, { color: colors.textSecondary }]}>
                  High-value gifts (50 kr+)
                </Text>
              </View>
            </View>
            <Switch
              value={giftReceived}
              onValueChange={setGiftReceived}
              trackColor={{ false: colors.border, true: colors.brandPrimary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Safety & Moderation */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🛡️ Safety & Moderation</Text>

          <View style={[styles.settingItem, { borderBottomColor: colors.divider }]}>
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="shield.fill"
                android_material_icon_name="security"
                size={20}
                color={colors.brandPrimary}
              />
              <View>
                <Text style={[styles.settingText, { color: colors.text }]}>
                  Safety & Moderation Alerts
                </Text>
                <Text style={[styles.settingSubtext, { color: colors.textSecondary }]}>
                  Warnings, timeouts, bans, and appeals
                </Text>
              </View>
            </View>
            <Switch
              value={safetyModerationAlerts}
              onValueChange={setSafetyModerationAlerts}
              trackColor={{ false: colors.border, true: colors.brandPrimary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Admin & Platform */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📢 Admin & Platform</Text>

          <View style={[styles.settingItem, { borderBottomColor: colors.divider }]}>
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="megaphone.fill"
                android_material_icon_name="campaign"
                size={20}
                color={colors.text}
              />
              <View>
                <Text style={[styles.settingText, { color: colors.text }]}>
                  Admin Announcements
                </Text>
                <Text style={[styles.settingSubtext, { color: colors.textSecondary }]}>
                  Platform updates and important notices
                </Text>
              </View>
            </View>
            <Switch
              value={adminAnnouncements}
              onValueChange={setAdminAnnouncements}
              trackColor={{ false: colors.border, true: colors.brandPrimary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Quiet Hours */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🌙 Quiet Hours</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Pause low-priority notifications during specific hours. Critical alerts (bans, timeouts, appeals) will still be sent.
          </Text>

          <View style={[styles.settingItem, { borderBottomColor: colors.divider }]}>
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="moon.fill"
                android_material_icon_name="bedtime"
                size={20}
                color={colors.text}
              />
              <Text style={[styles.settingText, { color: colors.text }]}>Enable Quiet Hours</Text>
            </View>
            <Switch
              value={quietHoursEnabled}
              onValueChange={setQuietHoursEnabled}
              trackColor={{ false: colors.border, true: colors.brandPrimary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {quietHoursEnabled && (
            <>
              <TouchableOpacity
                style={[styles.settingItem, { borderBottomColor: colors.divider }]}
                onPress={() => setShowStartPicker(true)}
              >
                <View style={styles.settingLeft}>
                  <IconSymbol
                    ios_icon_name="clock.fill"
                    android_material_icon_name="schedule"
                    size={20}
                    color={colors.text}
                  />
                  <Text style={[styles.settingText, { color: colors.text }]}>Start Time</Text>
                </View>
                <Text style={[styles.timeText, { color: colors.brandPrimary }]}>
                  {formatTime(quietHoursStart)}
                </Text>
              </TouchableOpacity>

              {showStartPicker && (
                <DateTimePicker
                  value={quietHoursStart}
                  mode="time"
                  is24Hour={true}
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowStartPicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      setQuietHoursStart(selectedDate);
                    }
                  }}
                />
              )}

              <TouchableOpacity
                style={[styles.settingItem, { borderBottomColor: colors.divider }]}
                onPress={() => setShowEndPicker(true)}
              >
                <View style={styles.settingLeft}>
                  <IconSymbol
                    ios_icon_name="clock.fill"
                    android_material_icon_name="schedule"
                    size={20}
                    color={colors.text}
                  />
                  <Text style={[styles.settingText, { color: colors.text }]}>End Time</Text>
                </View>
                <Text style={[styles.timeText, { color: colors.brandPrimary }]}>
                  {formatTime(quietHoursEnd)}
                </Text>
              </TouchableOpacity>

              {showEndPicker && (
                <DateTimePicker
                  value={quietHoursEnd}
                  mode="time"
                  is24Hour={true}
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowEndPicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      setQuietHoursEnd(selectedDate);
                    }
                  }}
                />
              )}
            </>
          )}
        </View>

        {/* Rate Limiting Info */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>ℹ️ Rate Limiting</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            To prevent notification overload, moderation-related alerts are limited to 5 per 30 minutes. If exceeded, you'll receive a single summary notification instead.
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.brandPrimary }]}
          onPress={savePreferences}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Preferences</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingBottom: 100,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingSubtext: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  saveButton: {
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});