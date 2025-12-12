
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PremiumBadge() {
  return <View style={styles.container}><Text style={styles.text}>PREMIUM</Text></View>;
}
const styles = StyleSheet.create({ container: { backgroundColor: '#FFD700', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }, text: { color: '#000', fontWeight: 'bold', fontSize: 10 } });
