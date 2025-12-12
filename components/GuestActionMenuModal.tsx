
import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';

export default function GuestActionMenuModal({ visible, onClose }: any) {
  return <Modal visible={visible}><View style={styles.container}><Text>Guest Action Menu</Text></View></Modal>;
}
const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', alignItems: 'center' } });
