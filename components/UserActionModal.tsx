
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

interface UserActionModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  streamId: string;
}

export default function UserActionModal({
  visible,
  onClose,
  userId,
  streamId,
}: UserActionModalProps) {
  const [userStatus, setUserStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkUserStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('Checking user status:', userId);
      setUserStatus({ isBanned: false, isTimedOut: false });
    } catch (error) {
      console.error('Error checking user status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (visible) {
      checkUserStatus();
    }
  }, [visible, checkUserStatus]);

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
          ) : (
            <>
              <Text style={styles.title}>User Actions</Text>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionText}>Timeout User</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionText}>Ban User</Text>
              </TouchableOpacity>
            </>
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
  actionButton: {
    backgroundColor: colors.brandPrimary,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
