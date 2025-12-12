
import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';

export default function StoriesBar() {
  return <ScrollView horizontal style={styles.container}><View /></ScrollView>;
}
const styles = StyleSheet.create({ container: { flexDirection: 'row', padding: 8 } });
