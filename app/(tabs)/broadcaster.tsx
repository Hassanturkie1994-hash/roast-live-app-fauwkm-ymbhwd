
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '../../components/IconSymbol';

export default function BroadcasterScreen() {
  const handleStartStream = () => {
    console.log('Start stream pressed');
    router.push('/app/(tabs)/broadcasterscreen');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol 
            ios_icon_name="chevron.left" 
            android_material_icon_name="arrow_back" 
            size={24} 
            color="#fff"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Broadcaster Setup</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stream Settings</Text>
          
          <View style={styles.settingItem}>
            <IconSymbol 
              ios_icon_name="video.fill" 
              android_material_icon_name="videocam" 
              size={24} 
              color="#FF6B6B"
            />
            <Text style={styles.settingText}>Camera</Text>
          </View>

          <View style={styles.settingItem}>
            <IconSymbol 
              ios_icon_name="mic.fill" 
              android_material_icon_name="mic" 
              size={24} 
              color="#FF6B6B"
            />
            <Text style={styles.settingText}>Microphone</Text>
          </View>

          <View style={styles.settingItem}>
            <IconSymbol 
              ios_icon_name="wifi" 
              android_material_icon_name="wifi" 
              size={24} 
              color="#FF6B6B"
            />
            <Text style={styles.settingText}>Connection Quality</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.startButton}
          onPress={handleStartStream}
        >
          <IconSymbol 
            ios_icon_name="play.fill" 
            android_material_icon_name="play_arrow" 
            size={24} 
            color="#fff"
          />
          <Text style={styles.startButtonText}>Start Broadcasting</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  settingText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 16,
  },
  startButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B6B',
    padding: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
});
