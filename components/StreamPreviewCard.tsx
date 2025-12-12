
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function StreamPreviewCard({ stream, onPress }: any) {
  return <TouchableOpacity style={styles.container} onPress={onPress}><Text>{stream?.title}</Text></TouchableOpacity>;
}
const styles = StyleSheet.create({ container: { padding: 16, backgroundColor: '#f0f0f0', borderRadius: 12, marginVertical: 8 } });
