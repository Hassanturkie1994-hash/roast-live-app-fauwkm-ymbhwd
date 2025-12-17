
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { fanClubService, FanClub } from '@/app/services/fanClubService';

interface FanClubJoinModalProps {
  visible: boolean;
  onClose: () => void;
  streamerId: string;
  currentUserId: string;
  onJoinSuccess?: () => void;
}

export default function FanClubJoinModal({
  visible,
  onClose,
  streamerId,
  currentUserId,
  onJoinSuccess,
}: FanClubJoinModalProps) {
  const [fanClub, setFanClub] = useState<FanClub | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isMember, setIsMember] = useState(false);

  const fetchFanClub = useCallback(async () => {
    setIsLoading(true);
    try {
      const club = await fanClubService.getFanClub(streamerId);
      setFanClub(club);

      if (club) {
        const memberStatus = await fanClubService.isFanClubMember(club.id, currentUserId);
        setIsMember(memberStatus);
      }
    } catch (error) {
      console.error('Error fetching fan club:', error);
    } finally {
      setIsLoading(false);
    }
  }, [streamerId, currentUserId]);

  useEffect(() => {
    if (visible) {
      fetchFanClub();
    }
  }, [visible, fetchFanClub]);

  const handleJoin = async () => {
    if (!fanClub) return;

    Alert.alert(
      'Join Fan Club',
      `Subscribe to ${fanClub.club_name} for €2.58/month?\n\nYou'll get a special badge during this streamer's livestreams!`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe',
          onPress: async () => {
            setIsJoining(true);
            const result = await fanClubService.joinFanClub(fanClub.id, currentUserId);
            setIsJoining(false);

            if (result.success) {
              Alert.alert('Success', `Welcome to ${fanClub.club_name}! 🎉`);
              setIsMember(true);
              onJoinSuccess?.();
              onClose();
            } else {
              Alert.alert('Error', result.error || 'Failed to join fan club');
            }
          },
        },
      ]
    );
  };

  const handleLeave = async () => {
    if (!fanClub) return;

    Alert.alert(
      'Leave Fan Club',
      `Are you sure you want to leave ${fanClub.club_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            setIsJoining(true);
            const result = await fanClubService.leaveFanClub(fanClub.id, currentUserId);
            setIsJoining(false);

            if (result.success) {
              Alert.alert('Success', `You've left ${fanClub.club_name}`);
              setIsMember(false);
              onClose();
            } else {
              Alert.alert('Error', result.error || 'Failed to leave fan club');
            }
          },
        },
      ]
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <IconSymbol
              ios_icon_name="xmark"
              android_material_icon_name="close"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.gradientEnd} />
              <Text style={styles.loadingText}>Loading fan club...</Text>
            </View>
          ) : !fanClub ? (
            <View style={styles.noClubContainer}>
              <IconSymbol
                ios_icon_name="heart.slash"
                android_material_icon_name="heart_broken"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={styles.noClubTitle}>No Fan Club</Text>
              <Text style={styles.noClubText}>
                This streamer hasn't created a fan club yet
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <View
                  style={[styles.badgePreview, { backgroundColor: fanClub.badge_color }]}
                >
                  <IconSymbol
                    ios_icon_name="heart.fill"
                    android_material_icon_name="favorite"
                    size={32}
                    color={colors.text}
                  />
                  <Text style={styles.badgePreviewText}>{fanClub.club_name}</Text>
                </View>
                <Text style={styles.title}>Fan Club</Text>
              </View>

              <View style={styles.benefits}>
                <Text style={styles.benefitsTitle}>Member Benefits:</Text>
                <View style={styles.benefitItem}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check_circle"
                    size={20}
                    color="#4CAF50"
                  />
                  <Text style={styles.benefitText}>
                    Exclusive {fanClub.club_name} badge during livestreams
                  </Text>
                </View>
                <View style={styles.benefitItem}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check_circle"
                    size={20}
                    color="#4CAF50"
                  />
                  <Text style={styles.benefitText}>
                    Support your favorite streamer
                  </Text>
                </View>
                <View style={styles.benefitItem}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check_circle"
                    size={20}
                    color="#4CAF50"
                  />
                  <Text style={styles.benefitText}>
                    Stand out in chat and viewer list
                  </Text>
                </View>
              </View>

              <View style={styles.pricing}>
                <Text style={styles.priceLabel}>Subscription Price</Text>
                <Text style={styles.priceAmount}>€2.58/month</Text>
                <Text style={styles.priceNote}>
                  70% goes directly to the streamer
                </Text>
              </View>

              {isMember ? (
                <View style={styles.memberStatus}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check_circle"
                    size={24}
                    color="#4CAF50"
                  />
                  <Text style={styles.memberStatusText}>You're a member!</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  isMember && styles.leaveButton,
                  isJoining && styles.actionButtonDisabled,
                ]}
                onPress={isMember ? handleLeave : handleJoin}
                disabled={isJoining}
              >
                {isJoining ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <Text style={styles.actionButtonText}>
                    {isMember ? 'Leave Fan Club' : 'Join Fan Club'}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 8,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  noClubContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 16,
  },
  noClubTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  noClubText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  badgePreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 4,
  },
  badgePreviewText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  benefits: {
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
  },
  pricing: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  priceAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.gradientEnd,
    marginBottom: 4,
  },
  priceNote: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  memberStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
  },
  memberStatusText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
  },
  actionButton: {
    backgroundColor: colors.gradientEnd,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  leaveButton: {
    backgroundColor: colors.textSecondary,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
});