
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

/**
 * Stream Settings Bottom Sheet
 * 
 * SIMPLIFIED: Removed toggles for Rankings, Season Tracking, VIP Club Features, 
 * Moderation Tools, Gifts, and Chat (these are always enabled).
 * 
 * KEPT: Practice Mode and Audience selection
 */
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

            {/* Always Enabled Features Info */}
            <View style={styles.alwaysEnabledSection}>
              <Text style={styles.alwaysEnabledTitle}>Always Enabled Features</Text>
              <Text style={styles.alwaysEnabledDescription}>
                The following features are always active during your streams:
              </Text>
              
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check_circle"
                    size={20}
                    color="#00C853"
                  />
                  <Text style={styles.featureText}>Chat & Messaging</Text>
                </View>
                <View style={styles.featureItem}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check_circle"
                    size={20}
                    color="#00C853"
                  />
                  <Text style={styles.featureText}>Gifts & Effects</Text>
                </View>
                <View style={styles.featureItem}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check_circle"
                    size={20}
                    color="#00C853"
                  />
                  <Text style={styles.featureText}>Rankings & Leaderboards</Text>
                </View>
                <View style={styles.featureItem}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check_circle"
                    size={20}
                    color="#00C853"
                  />
                  <Text style={styles.featureText}>Season Tracking</Text>
                </View>
                <View style={styles.featureItem}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check_circle"
                    size={20}
                    color="#00C853"
                  />
                  <Text style={styles.featureText}>VIP Club Features</Text>
                </View>
                <View style={styles.featureItem}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check_circle"
                    size={20}
                    color="#00C853"
                  />
                  <Text style={styles.featureText}>Moderation Tools</Text>
                </View>
              </View>

              <View style={styles.noteBox}>
                <IconSymbol
                  ios_icon_name="info.circle"
                  android_material_icon_name="info_outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.noteText}>
                  You can pause chat during your stream from the Stream Dashboard
                </Text>
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
  alwaysEnabledSection: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  alwaysEnabledTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  alwaysEnabledDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  featuresList: {
    gap: 10,
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 10,
    gap: 8,
    marginTop: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 16,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
