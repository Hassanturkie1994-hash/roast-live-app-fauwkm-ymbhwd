
import React, { useState, useEffect, useCallback } from 'react';
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
import { creatorClubService } from '@/app/services/creatorClubService';

interface JoinClubModalProps {
  visible: boolean;
  onClose: () => void;
  creatorId: string;
  onJoinSuccess?: () => void;
}

export default function JoinClubModal({
  visible,
  onClose,
  creatorId,
  onJoinSuccess,
}: JoinClubModalProps) {
  const [clubData, setClubData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  const loadClubData = useCallback(async () => {
    setIsLoading(true);
    try {
      const club = await creatorClubService.getCreatorClub(creatorId);
      setClubData(club);
    } catch (error) {
      console.error('Error loading club data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [creatorId]);

  useEffect(() => {
    if (visible) {
      loadClubData();
    }
  }, [visible, loadClubData]);

  const handleJoin = async () => {
    if (!clubData) return;

    setIsJoining(true);
    try {
      await creatorClubService.joinClub(clubData.id);
      Alert.alert('Success', 'You have joined the club!');
      onJoinSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error joining club:', error);
      Alert.alert('Error', 'Failed to join club');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <IconSymbol
              ios_icon_name="xmark"
              android_material_icon_name="close"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>

          {isLoading ? (
            <ActivityIndicator size="large" color={colors.brandPrimary} />
          ) : clubData ? (
            <>
              <Text style={styles.title}>Join {clubData.name}</Text>
              <Text style={styles.price}>{clubData.monthly_price_cents / 100} kr/month</Text>
              <Text style={styles.description}>{clubData.description}</Text>
              <TouchableOpacity
                style={styles.joinButton}
                onPress={handleJoin}
                disabled={isJoining}
              >
                {isJoining ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.joinButtonText}>Join Now</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.errorText}>Club not found</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.brandPrimary,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  joinButton: {
    backgroundColor: colors.brandPrimary,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FF4444',
    textAlign: 'center',
  },
});
