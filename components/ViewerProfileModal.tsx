
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
import { supabase } from '@/app/integrations/supabase/client';

interface ViewerProfileModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

export default function ViewerProfileModal({
  visible,
  onClose,
  userId,
}: ViewerProfileModalProps) {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (visible) {
      fetchProfile();
    }
  }, [visible, fetchProfile]);

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
          ) : profile ? (
            <>
              <Text style={styles.name}>{profile.display_name || profile.username}</Text>
              <Text style={styles.username}>@{profile.username}</Text>
              {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
            </>
          ) : (
            <Text style={styles.errorText}>Profile not found</Text>
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
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  bio: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FF4444',
    textAlign: 'center',
  },
});
