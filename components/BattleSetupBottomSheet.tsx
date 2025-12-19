
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import { BattleFormat } from '@/app/services/battleService';

interface BattleSetupBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  streamMode: 'solo' | 'battle';
  setStreamMode: (mode: 'solo' | 'battle') => void;
  battleFormat: BattleFormat | null;
  setBattleFormat: (format: BattleFormat | null) => void;
  battleRanked: boolean;
  setBattleRanked: (ranked: boolean) => void;
}

const BATTLE_FORMATS: { format: BattleFormat; name: string; description: string }[] = [
  { format: '1v1', name: '1v1', description: 'Solo battle' },
  { format: '2v2', name: '2v2', description: 'Duo battle' },
  { format: '3v3', name: '3v3', description: 'Trio battle' },
  { format: '4v4', name: '4v4', description: 'Squad battle' },
  { format: '5v5', name: '5v5', description: 'Team battle' },
];

export default function BattleSetupBottomSheet({
  visible,
  onClose,
  streamMode,
  setStreamMode,
  battleFormat,
  setBattleFormat,
  battleRanked,
  setBattleRanked,
}: BattleSetupBottomSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Battle Setup</Text>
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
            {/* Stream Mode Toggle */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Stream Mode</Text>
              <View style={styles.modeToggle}>
                <TouchableOpacity
                  style={[styles.modeButton, streamMode === 'solo' && styles.modeButtonActive]}
                  onPress={() => setStreamMode('solo')}
                >
                  <IconSymbol
                    ios_icon_name="person.fill"
                    android_material_icon_name="person"
                    size={20}
                    color={streamMode === 'solo' ? '#FFFFFF' : colors.text}
                  />
                  <Text style={[styles.modeButtonText, streamMode === 'solo' && styles.modeButtonTextActive]}>
                    Solo Stream
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modeButton, streamMode === 'battle' && styles.modeButtonActive]}
                  onPress={() => setStreamMode('battle')}
                >
                  <IconSymbol
                    ios_icon_name="flame.fill"
                    android_material_icon_name="whatshot"
                    size={20}
                    color={streamMode === 'battle' ? '#FFFFFF' : '#FF6B00'}
                  />
                  <Text style={[styles.modeButtonText, streamMode === 'battle' && styles.modeButtonTextActive]}>
                    Battle Mode
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {streamMode === 'battle' && (
              <>
                {/* Battle Format Selection */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Battle Format</Text>
                  <Text style={styles.sectionDescription}>
                    Select team size for the battle
                  </Text>
                  <View style={styles.formatGrid}>
                    {BATTLE_FORMATS.map((item) => (
                      <TouchableOpacity
                        key={item.format}
                        style={[
                          styles.formatCard,
                          battleFormat === item.format && styles.formatCardActive,
                        ]}
                        onPress={() => setBattleFormat(item.format)}
                      >
                        <Text style={[
                          styles.formatName,
                          battleFormat === item.format && styles.formatNameActive,
                        ]}>
                          {item.name}
                        </Text>
                        <Text style={styles.formatDescription}>{item.description}</Text>
                        {battleFormat === item.format && (
                          <View style={styles.formatCheck}>
                            <IconSymbol
                              ios_icon_name="checkmark.circle.fill"
                              android_material_icon_name="check_circle"
                              size={20}
                              color={colors.brandPrimary}
                            />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Ranked / Casual Toggle */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Battle Type</Text>
                  <View style={styles.typeToggle}>
                    <TouchableOpacity
                      style={[styles.typeButton, !battleRanked && styles.typeButtonActive]}
                      onPress={() => setBattleRanked(false)}
                    >
                      <IconSymbol
                        ios_icon_name="gamecontroller.fill"
                        android_material_icon_name="sports_esports"
                        size={20}
                        color={!battleRanked ? '#FFFFFF' : colors.text}
                      />
                      <Text style={[styles.typeButtonText, !battleRanked && styles.typeButtonTextActive]}>
                        Casual
                      </Text>
                      <Text style={styles.typeButtonDescription}>
                        For fun, no rank impact
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.typeButton, battleRanked && styles.typeButtonActive]}
                      onPress={() => setBattleRanked(true)}
                    >
                      <IconSymbol
                        ios_icon_name="trophy.fill"
                        android_material_icon_name="emoji_events"
                        size={20}
                        color={battleRanked ? '#FFFFFF' : '#FFD700'}
                      />
                      <Text style={[styles.typeButtonText, battleRanked && styles.typeButtonTextActive]}>
                        Ranked
                      </Text>
                      <Text style={styles.typeButtonDescription}>
                        Competitive, affects rank
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Info Box */}
                <View style={styles.infoBox}>
                  <IconSymbol
                    ios_icon_name="info.circle.fill"
                    android_material_icon_name="info"
                    size={20}
                    color={colors.brandPrimary}
                  />
                  <Text style={styles.infoText}>
                    Battle Mode creates a lobby where you&apos;ll be matched with opponents. 
                    Viewers send gifts to support teams, and the team with the most gifts wins!
                  </Text>
                </View>
              </>
            )}
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
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  modeToggle: {
    flexDirection: 'row',
    gap: 12,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  modeButtonActive: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  modeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
  formatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  formatCard: {
    width: '30%',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    position: 'relative',
  },
  formatCardActive: {
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderColor: colors.brandPrimary,
    borderWidth: 2,
  },
  formatName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  formatNameActive: {
    color: colors.brandPrimary,
  },
  formatDescription: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  formatCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  typeToggle: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  typeButtonActive: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  typeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  typeButtonDescription: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderColor: colors.brandPrimary,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
