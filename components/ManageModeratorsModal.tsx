
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
import { moderationService } from '@/app/services/moderationService';

interface ManageModeratorsModalProps {
  visible: boolean;
  onClose: () => void;
  streamerId: string;
}

export default function ManageModeratorsModal({
  visible,
  onClose,
  streamerId,
}: ManageModeratorsModalProps) {
  const [moderators, setModerators] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadModerators = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await moderationService.getModerators(streamerId);
      setModerators(data);
    } catch (error) {
      console.error('Error loading moderators:', error);
    } finally {
      setIsLoading(false);
    }
  }, [streamerId]);

  useEffect(() => {
    if (visible) {
      loadModerators();
    }
  }, [visible, loadModerators]);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.item}>
      <Text style={styles.name}>{item.username || 'Unknown'}</Text>
      <TouchableOpacity
        onPress={() => {
          console.log('Remove moderator:', item.id);
        }}
      >
        <IconSymbol
          ios_icon_name="trash.fill"
          android_material_icon_name="delete"
          size={20}
          color="#FF4444"
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Manage Moderators</Text>
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
              data={moderators}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
