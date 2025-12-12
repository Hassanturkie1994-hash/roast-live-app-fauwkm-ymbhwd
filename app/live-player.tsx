
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '../components/IconSymbol';

const { width, height } = Dimensions.get('window');

export default function LivePlayerScreen() {
  const params = useLocalSearchParams();
  const streamId = params.streamId || 'unknown';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <IconSymbol 
            ios_icon_name="xmark" 
            android_material_icon_name="close" 
            size={24} 
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.videoContainer}>
        <View style={styles.placeholder}>
          <IconSymbol 
            ios_icon_name="video.fill" 
            android_material_icon_name="videocam" 
            size={64} 
            color="#444"
          />
          <Text style={styles.placeholderText}>Live Stream Player</Text>
          <Text style={styles.streamId}>Stream ID: {streamId}</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton}>
          <IconSymbol 
            ios_icon_name="heart" 
            android_material_icon_name="favorite_border" 
            size={28} 
            color="#fff"
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton}>
          <IconSymbol 
            ios_icon_name="gift" 
            android_material_icon_name="card_giftcard" 
            size={28} 
            color="#fff"
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton}>
          <IconSymbol 
            ios_icon_name="bubble.left" 
            android_material_icon_name="chat_bubble_outline" 
            size={28} 
            color="#fff"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#888',
    fontSize: 18,
    marginTop: 20,
  },
  streamId: {
    color: '#666',
    fontSize: 14,
    marginTop: 10,
  },
  controls: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    gap: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
