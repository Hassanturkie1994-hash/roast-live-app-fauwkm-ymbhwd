
import React from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';

interface CreatorRulesModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function CreatorRulesModal({ visible, onClose }: CreatorRulesModalProps) {
  return (
    <Modal visible={visible} transparent>
      <View style={styles.container}>
        <Text>Creator Rules Modal - Placeholder</Text>
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
