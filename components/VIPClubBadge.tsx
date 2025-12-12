
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function VIPClubBadge() {
  return <View style={styles.container}><Text style={styles.text}>VIP</Text></View>;
}
const styles = StyleSheet.create({ container: { backgroundColor: '#FFD700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }, text: { color: '#000', fontWeight: 'bold', fontSize: 10 } });
