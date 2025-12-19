
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';

interface ViewerListModalProps {
  visible: boolean;
  onClose: () => void;
  streamId: string;
}

export default function ViewerListModal({
  visible,
  onClose,
  streamId,
}: ViewerListModalProps) {
  const [viewers, setViewers] = useState<any[]>([]);
  const [moderators, setModerators] = useState<string[]>([]);
  const [fanClubBadges, setFanClubBadges] = useState<Map<string, any>>(new Map());
  const [activeGuests, setActiveGuests] = useState<string[]>([]);
  const [seatsLocked, setSeatsLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchViewers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('stream_viewers')
        .select('*, profiles(*)')
        .eq('stream_id', streamId)
        .is('left_at', null);

      if (error) throw error;
      setViewers(data || []);
    } catch (error) {
      console.error('Error fetching viewers:', error);
    }
  }, [streamId]);

  const fetchModerators = useCallback(async () => {
    try {
      console.log('Fetching moderators');
      setModerators([]);
    } catch (error) {
      console.error('Error fetching moderators:', error);
    }
  }, []);

  const fetchFanClubBadges = useCallback(async () => {
    try {
      console.log('Fetching fan club badges');
      setFanClubBadges(new Map());
    } catch (error) {
      console.error('Error fetching fan club badges:', error);
    }
  }, []);

  const fetchActiveGuests = useCallback(async () => {
    try {
      console.log('Fetching active guests');
      setActiveGuests([]);
    } catch (error) {
      console.error('Error fetching active guests:', error);
    }
  }, []);

  const fetchSeatsLockStatus = useCallback(async () => {
    try {
      console.log('Fetching seats lock status');
      setSeatsLocked(false);
    } catch (error) {
      console.error('Error fetching seats lock status:', error);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchViewers(),
        fetchModerators(),
        fetchFanClubBadges(),
        fetchActiveGuests(),
        fetchSeatsLockStatus(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchViewers, fetchModerators, fetchFanClubBadges, fetchActiveGuests, fetchSeatsLockStatus]);

  useEffect(() => {
    if (visible) {
      loadAllData();
    }
  }, [visible, loadAllData]);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.item}>
      <Text style={styles.name}>{item.profiles?.display_name || 'Unknown'}</Text>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Viewers ({viewers.length})</Text>
            <TouchableOpacity onPress={onClose}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.brandPrimary} />
            </View>
          ) : (
            <FlatList
              data={viewers}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            />
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
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  item: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
