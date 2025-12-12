
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function RoastLiveLogo() {
  return <View style={styles.container}><Text style={styles.text}>Roast Live</Text></View>;
}
const styles = StyleSheet.create({ container: { padding: 8 }, text: { fontSize: 24, fontWeight: 'bold', color: '#FF5722' } });
