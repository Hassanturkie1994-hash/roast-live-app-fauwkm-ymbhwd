
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function LiveBadge() {
  return <View style={styles.container}><Text style={styles.text}>LIVE</Text></View>;
}
const styles = StyleSheet.create({ container: { backgroundColor: '#f00', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }, text: { color: '#fff', fontWeight: 'bold', fontSize: 12 } });
