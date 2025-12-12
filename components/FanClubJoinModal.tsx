
import React from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';

interface FanClubJoinModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function FanClubJoinModal({ visible, onClose }: FanClubJoinModalProps) {
  return (
    <Modal visible={visible} transparent>
      <View style={styles.container}>
        <Text>Fan Club Join Modal - Placeholder</Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});
