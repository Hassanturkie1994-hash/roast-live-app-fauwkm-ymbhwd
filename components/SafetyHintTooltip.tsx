
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SafetyHintTooltip({ text }: any) {
  return <View style={styles.container}><Text>{text}</Text></View>;
}
const styles = StyleSheet.create({ container: { padding: 8, backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: 4 } });
