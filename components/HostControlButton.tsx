
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function HostControlButton({ title, onPress }: any) {
  return <TouchableOpacity style={styles.button} onPress={onPress}><Text style={styles.text}>{title}</Text></TouchableOpacity>;
}
const styles = StyleSheet.create({ button: { padding: 12, backgroundColor: '#007AFF', borderRadius: 8 }, text: { color: '#fff' } });
