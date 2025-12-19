
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';

interface StreamSettingsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  chatEnabled: boolean;
  setChatEnabled: (value: boolean) => void;
  giftsEnabled: boolean;
  setGiftsEnabled: (value: boolean) => void;
  battlesEnabled: boolean;
  setBattlesEnabled: (value: boolean) => void;
  vipClubEnabled: boolean;
  setVipClubEnabled: (value: boolean) => void;
  rankingsEnabled: boolean;
  setRankingsEnabled: (value: boolean) => void;
  seasonTrackingEnabled: boolean;
  setSeasonTrackingEnabled: (value: boolean) => void;
  moderationToolsEnabled: boolean;
  setModerationToolsEnabled: (value: boolean) => void;
  practiceMode: boolean;
  setPracticeMode: (value: boolean) => void;
  whoCanWatch: 'public' | 'followers' | 'vip_club';
  setWhoCanWatch: (value: 'public' | 'followers' | 'vip_club') => void;
}

export default function StreamSettingsBottomSheet({
  visible,
  onClose,
  chatEnabled,
  setChatEnabled,
  giftsEnabled,
  setGiftsEnabled,
  battlesEnabled,
  setBattlesEnabled,
  vipClubEnabled,
  setVipClubEnabled,
  rankingsEnabled,
  setRankingsEnabled,
  seasonTrackingEnabled,
  setSeasonTrackingEnabled,
  moderationToolsEnabled,
  setModerationToolsEnabled,
  practiceMode,
  setPracticeMode,
  whoCanWatch,
  setWhoCanWatch,
}: StreamSettingsBottomSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Stream Settings</Text>
            <TouchableOpacity onPress={onClose}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Practice Mode */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Stream Mode</Text>
              <View style={styles.settingCard}>
                <View style={styles.settingIcon}>
                  <IconSymbol
                    ios_icon_name="eye.slash.fill"
                    android_material_icon_name="visibility_off"
                    size={20}
                    color={colors.brandPrimary}
                  />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingName}>Practice Mode</Text>
                  <Text style={styles.settingDescription}>
                    Stream privately to test your setup
                  </Text>
                </View>
                <Switch
                  value={practiceMode}
                  onValueChange={setPracticeMode}
                  trackColor={{ false: colors.border, true: colors.brandPrimary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Who Can Watch */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Audience</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={[styles.radioOption, whoCanWatch === 'public' && styles.radioOptionActive]}
                  onPress={() => setWhoCanWatch('public')}
                >
                  <View style={styles.radioCircle}>
                    {whoCanWatch === 'public' && <View style={styles.radioCircleInner} />}
                  </View>
                  <View style={styles.radioInfo}>
                    <Text style={[styles.radioName, whoCanWatch === 'public' && styles.radioNameActive]}>
                      Public
                    </Text>
                    <Text style={styles.radioDescription}>Anyone can watch</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.radioOption, whoCanWatch === 'followers' && styles.radioOptionActive]}
                  onPress={() => setWhoCanWatch('followers')}
                >
                  <View style={styles.radioCircle}>
                    {whoCanWatch === 'followers' && <View style={styles.radioCircleInner} />}
                  </View>
                  <View style={styles.radioInfo}>
                    <Text style={[styles.radioName, whoCanWatch === 'followers' && styles.radioNameActive]}>
                      Followers Only
                    </Text>
                    <Text style={styles.radioDescription}>Only your followers can watch</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.radioOption, whoCanWatch === 'vip_club' && styles.radioOptionActive]}
                  onPress={() => setWhoCanWatch('vip_club')}
                >
                  <View style={styles.radioCircle}>
                    {whoCanWatch === 'vip_club' && <View style={styles.radioCircleInner} />}
                  </View>
                  <View style={styles.radioInfo}>
                    <Text style={[styles.radioName, whoCanWatch === 'vip_club' && styles.radioNameActive]}>
                      VIP Club Only
                    </Text>
                    <Text style={styles.radioDescription}>Only VIP members can watch</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Feature Toggles */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Features</Text>

              <View style={styles.settingCard}>
                <View style={styles.settingIcon}>
                  <IconSymbol
                    ios_icon_name="message.fill"
                    android_material_icon_name="chat"
                    size={20}
                    color={colors.brandPrimary}
                  />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingName}>Enable Chat</Text>
                  <Text style={styles.settingDescription}>
                    Allow viewers to send messages
                  </Text>
                </View>
                <Switch
                  value={chatEnabled}
                  onValueChange={setChatEnabled}
                  trackColor={{ false: colors.border, true: colors.brandPrimary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.settingCard}>
                <View style={styles.settingIcon}>
                  <IconSymbol
                    ios_icon_name="gift.fill"
                    android_material_icon_name="card_giftcard"
                    size={20}
                    color={colors.brandPrimary}
                  />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingName}>Enable Gifts</Text>
                  <Text style={styles.settingDescription}>
                    Allow viewers to send gifts
                  </Text>
                </View>
                <Switch
                  value={giftsEnabled}
                  onValueChange={setGiftsEnabled}
                  trackColor={{ false: colors.border, true: colors.brandPrimary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.settingCard}>
                <View style={styles.settingIcon}>
                  <IconSymbol
                    ios_icon_name="flame.fill"
                    android_material_icon_name="whatshot"
                    size={20}
                    color="#FF6B00"
                  />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingName}>Enable Battles</Text>
                  <Text style={styles.settingDescription}>
                    Allow battle mode streaming
                  </Text>
                </View>
                <Switch
                  value={battlesEnabled}
                  onValueChange={setBattlesEnabled}
                  trackColor={{ false: colors.border, true: colors.brandPrimary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.settingCard}>
                <View style={styles.settingIcon}>
                  <IconSymbol
                    ios_icon_name="star.circle.fill"
                    android_material_icon_name="workspace_premium"
                    size={20}
                    color="#FFD700"
                  />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingName}>Enable VIP Club</Text>
                  <Text style={styles.settingDescription}>
                    Show VIP Club features
                  </Text>
                </View>
                <Switch
                  value={vipClubEnabled}
                  onValueChange={setVipClubEnabled}
                  trackColor={{ false: colors.border, true: colors.brandPrimary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.settingCard}>
                <View style={styles.settingIcon}>
                  <IconSymbol
                    ios_icon_name="chart.bar.fill"
                    android_material_icon_name="leaderboard"
                    size={20}
                    color={colors.brandPrimary}
                  />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingName}>Enable Rankings</Text>
                  <Text style={styles.settingDescription}>
                    Show leaderboard and rankings
                  </Text>
                </View>
                <Switch
                  value={rankingsEnabled}
                  onValueChange={setRankingsEnabled}
                  trackColor={{ false: colors.border, true: colors.brandPrimary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.settingCard}>
                <View style={styles.settingIcon}>
                  <IconSymbol
                    ios_icon_name="calendar.badge.clock"
                    android_material_icon_name="event"
                    size={20}
                    color={colors.brandPrimary}
                  />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingName}>Enable Season Tracking</Text>
                  <Text style={styles.settingDescription}>
                    Track seasonal progress
                  </Text>
                </View>
                <Switch
                  value={seasonTrackingEnabled}
                  onValueChange={setSeasonTrackingEnabled}
                  trackColor={{ false: colors.border, true: colors.brandPrimary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.settingCard}>
                <View style={styles.settingIcon}>
                  <IconSymbol
                    ios_icon_name="shield.fill"
                    android_material_icon_name="shield"
                    size={20}
                    color="#00E676"
                  />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingName}>Enable Moderation Tools</Text>
                  <Text style={styles.settingDescription}>
                    Show moderation controls
                  </Text>
                </View>
                <Switch
                  value={moderationToolsEnabled}
                  onValueChange={setModerationToolsEnabled}
                  trackColor={{ false: colors.border, true: colors.brandPrimary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <GradientButton title="Done" onPress={onClose} size="large" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingInfo: {
    flex: 1,
    gap: 4,
  },
  settingName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  settingDescription: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  radioGroup: {
    gap: 10,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  radioOptionActive: {
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderColor: colors.brandPrimary,
    borderWidth: 2,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.brandPrimary,
  },
  radioInfo: {
    flex: 1,
    gap: 4,
  },
  radioName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  radioNameActive: {
    color: colors.brandPrimary,
  },
  radioDescription: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
