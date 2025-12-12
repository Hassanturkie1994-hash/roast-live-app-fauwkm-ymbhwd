
import React from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';

interface BadgeEditorModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function BadgeEditorModal({ visible, onClose }: BadgeEditorModalProps) {
  return (
    <Modal visible={visible} transparent>
      <View style={styles.container}>
        <Text>Badge Editor Modal - Placeholder</Text>
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
