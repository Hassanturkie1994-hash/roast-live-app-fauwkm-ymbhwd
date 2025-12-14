
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import { useVIPClub } from '@/contexts/VIPClubContext';

interface VIPClubPanelProps {
  visible: boolean;
  onClose: () => void;
  selectedClub: string | null;
  onSelectClub: (clubId: string | null) => void;
}

export default function VIPClubPanel({
  visible,
  onClose,
  selectedClub,
  onSelectClub,
}: VIPClubPanelProps) {
  const { clubs, isLoading, refreshClubs } = useVIPClub();

  useEffect(() => {
    if (visible) {
      console.log('📥 [VIPClubPanel] Panel opened, refreshing clubs');
      refreshClubs();
    }
  }, [visible]);

  const handleSelectClub = (clubId: string) => {
    console.log('👑 [VIPClubPanel] VIP Club selected:', clubId);
    if (clubId === selectedClub) {
      onSelectClub(null);
    } else {
      onSelectClub(clubId);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>VIP Club</Text>
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
            <Text style={styles.description}>
              Select which VIP Club is active for this live stream. Members will get exclusive access and perks.
            </Text>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.brandPrimary} />
                <Text style={styles.loadingText}>Loading your VIP Clubs...</Text>
              </View>
            ) : clubs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <IconSymbol
                  ios_icon_name="star.slash"
                  android_material_icon_name="star_border"
                  size={48}
                  color={colors.textSecondary}
                />
                <Text style={styles.emptyTitle}>No VIP Clubs Yet</Text>
                <Text style={styles.emptyText}>
                  Create a VIP Club in Settings to offer exclusive perks to your most dedicated fans!
                </Text>
              </View>
            ) : (
              <>
                {/* None Option */}
                <TouchableOpacity
                  style={[styles.clubCard, selectedClub === null && styles.clubCardActive]}
                  onPress={() => onSelectClub(null)}
                  activeOpacity={0.7}
                >
                  <View style={styles.clubBadge}>
                    <Text style={styles.clubBadgeEmoji}>🚫</Text>
                  </View>
                  <View style={styles.clubInfo}>
                    <Text style={[styles.clubName, selectedClub === null && styles.clubNameActive]}>
                      No VIP Club
                    </Text>
                    <Text style={styles.clubDescription}>
                      Stream without VIP Club restrictions
                    </Text>
                  </View>
                  {selectedClub === null && (
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check_circle"
                      size={24}
                      color={colors.brandPrimary}
                    />
                  )}
                </TouchableOpacity>

                {/* VIP Clubs */}
                {clubs.map((club) => {
                  const isSelected = selectedClub === club.id;

                  return (
                    <TouchableOpacity
                      key={club.id}
                      style={[styles.clubCard, isSelected && styles.clubCardActive]}
                      onPress={() => handleSelectClub(club.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.clubBadge}>
                        <Text style={styles.clubBadgeEmoji}>👑</Text>
                      </View>
                      <View style={styles.clubInfo}>
                        <Text style={[styles.clubName, isSelected && styles.clubNameActive]}>
                          {club.name}
                        </Text>
                        <Text style={styles.clubTag}>
                          {club.tag}
                        </Text>
                        <Text style={styles.clubStats}>
                          {(club.monthly_price_cents / 100).toFixed(2)} {club.currency}/month
                        </Text>
                        {club.description && (
                          <Text style={styles.clubDescription} numberOfLines={2}>
                            {club.description}
                          </Text>
                        )}
                      </View>
                      {isSelected && (
                        <IconSymbol
                          ios_icon_name="checkmark.circle.fill"
                          android_material_icon_name="check_circle"
                          size={24}
                          color={colors.brandPrimary}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
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
  description: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  clubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  clubCardActive: {
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderColor: colors.brandPrimary,
    borderWidth: 2,
  },
  clubBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubBadgeEmoji: {
    fontSize: 32,
  },
  clubInfo: {
    flex: 1,
  },
  clubName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  clubNameActive: {
    color: colors.brandPrimary,
  },
  clubTag: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.brandPrimary,
    marginBottom: 4,
  },
  clubDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: 4,
  },
  clubStats: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
