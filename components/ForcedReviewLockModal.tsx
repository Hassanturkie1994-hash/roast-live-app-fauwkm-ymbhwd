
import React from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';

interface ForcedReviewLockModalProps {
  visible: boolean;
}

export default function ForcedReviewLockModal({ visible }: ForcedReviewLockModalProps) {
  return (
    <Modal visible={visible} transparent>
      <View style={styles.container}>
        <Text>Forced Review Lock Modal - Placeholder</Text>
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
