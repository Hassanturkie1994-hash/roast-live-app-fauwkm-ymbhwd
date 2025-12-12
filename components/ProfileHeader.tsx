
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ProfileHeader({ name, bio }: any) {
  return <View style={styles.container}><Text style={styles.name}>{name}</Text><Text>{bio}</Text></View>;
}
const styles = StyleSheet.create({ container: { padding: 16 }, name: { fontSize: 24, fontWeight: 'bold' } });
