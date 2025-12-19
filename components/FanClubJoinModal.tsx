
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { fanClubService } from '@/app/services/fanClubService';

interface FanClubJoinModalProps {
  visible: boolean;
  onClose: () => void;
  streamerId: string;
  onJoinSuccess?: () => void;
}

export default function FanClubJoinModal({
  visible,
  onClose,
  streamerId,
  onJoinSuccess,
}: FanClubJoinModalProps) {
  const [fanClub, setFanClub] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  const fetchFanClub = useCallback(async () => {
    setIsLoading(true);
    try {
      const club = await fanClubService.getFanClub(streamerId);
      setFanClub(club);
    } catch (error) {
      console.error('Error fetching fan club:', error);
    } finally {
      setIsLoading(false);
    }
  }, [streamerId]);

  useEffect(() => {
    if (visible) {
      fetchFanClub();
    }
  }, [visible, fetchFanClub]);

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      await fanClubService.joinFanClub(streamerId);
      onJoinSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error joining fan club:', error);
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
          ) : fanClub ? (
            <>
              <Text style={styles.title}>Join {fanClub.club_name}</Text>
              <Text style={styles.description}>
                Get exclusive access to this creator&apos;s fan club!
              </Text>
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
            <Text style={styles.errorText}>Fan club not found</Text>
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
