
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function NetworkStabilityIndicator({ quality = 'good' }: any) {
  return <View style={styles.container}><Text>{quality}</Text></View>;
}
const styles = StyleSheet.create({ container: { padding: 8 } });
