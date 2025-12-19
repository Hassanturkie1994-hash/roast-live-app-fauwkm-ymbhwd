
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
import { leaderboardService } from '@/app/services/leaderboardService';

interface LeaderboardModalProps {
  visible: boolean;
  onClose: () => void;
  streamId: string;
}

export default function LeaderboardModal({
  visible,
  onClose,
  streamId,
}: LeaderboardModalProps) {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await leaderboardService.getStreamLeaderboard(streamId);
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [streamId]);

  useEffect(() => {
    if (visible) {
      loadLeaderboard();
    }
  }, [visible, loadLeaderboard]);

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <View style={styles.item}>
      <Text style={styles.rank}>#{index + 1}</Text>
      <Text style={styles.name}>{item.username || 'Unknown'}</Text>
      <Text style={styles.score}>{item.score}</Text>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Leaderboard</Text>
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
              data={leaderboard}
              renderItem={renderItem}
              keyExtractor={(item, index) => `${item.id}-${index}`}
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  rank: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.brandPrimary,
    width: 40,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  score: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
