
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import { battleService, BattleInvitation } from '@/app/services/battleService';
import { supabase } from '@/app/integrations/supabase/client';

interface BattleInvitationPopupProps {
  visible: boolean;
  onClose: () => void;
}

export default function BattleInvitationPopup({ visible, onClose }: BattleInvitationPopupProps) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [invitations, setInvitations] = useState<BattleInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;

    // Fetch pending invitations
    fetchInvitations();

    // Subscribe to new invitations
    const channel = supabase
      .channel(`user:${user.id}:invitations`)
      .on('broadcast', { event: 'battle_invitation' }, (payload) => {
        console.log('📨 New battle invitation received:', payload);
        fetchInvitations();
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user]);

  useEffect(() => {
    if (visible && invitations.length > 0) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, invitations, slideAnim]);

  const fetchInvitations = async () => {
    if (!user) return;

    const { invitations: data } = await battleService.getPendingInvitations(user.id);
    setInvitations(data);
  };

  const handleAccept = async (invitationId: string) => {
    if (!user) return;

    setIsLoading(true);

    const { success, error } = await battleService.acceptInvitation(invitationId, user.id);

    setIsLoading(false);

    if (error) {
      console.error('❌ Error accepting invitation:', error);
      return;
    }

    // Refresh invitations
    fetchInvitations();

    // Navigate to lobby (you'll need to get the lobby ID from the invitation)
    const invitation = invitations.find((inv) => inv.id === invitationId);
    if (invitation) {
      // TODO: Navigate to lobby screen
      console.log('✅ Accepted invitation, navigate to lobby:', invitation.lobby_id);
    }
  };

  const handleDecline = async (invitationId: string) => {
    if (!user) return;

    setIsLoading(true);

    const { success, error } = await battleService.declineInvitation(invitationId, user.id);

    setIsLoading(false);

    if (error) {
      console.error('❌ Error declining invitation:', error);
      return;
    }

    // Refresh invitations
    fetchInvitations();
  };

  if (!visible || invitations.length === 0) {
    return null;
  }

  const currentInvitation = invitations[0];

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.popup,
            { backgroundColor: colors.card, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <IconSymbol
                ios_icon_name="flame.fill"
                android_material_icon_name="whatshot"
                size={24}
                color="#A40028"
              />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.text }]}>Battle Invitation</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                You&apos;ve been invited to a battle!
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={isLoading}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.declineButton, { backgroundColor: colors.backgroundAlt }]}
              onPress={() => handleDecline(currentInvitation.id)}
              disabled={isLoading}
            >
              <Text style={[styles.declineButtonText, { color: colors.text }]}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.acceptButton, { backgroundColor: '#A40028' }]}
              onPress={() => handleAccept(currentInvitation.id)}
              disabled={isLoading}
            >
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
          </View>

          {invitations.length > 1 && (
            <Text style={[styles.moreText, { color: colors.textSecondary }]}>
              +{invitations.length - 1} more invitation{invitations.length > 2 ? 's' : ''}
            </Text>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  popup: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '400',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  acceptButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  moreText: {
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 12,
  },
});
