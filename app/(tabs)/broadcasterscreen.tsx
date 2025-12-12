
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '../../components/IconSymbol';

const { width, height } = Dimensions.get('window');

export default function BroadcasterScreenLive() {
  const [isLive, setIsLive] = useState(false);
  const [viewers, setViewers] = useState(0);

  const handleToggleLive = () => {
    setIsLive(!isLive);
    if (!isLive) {
      setViewers(Math.floor(Math.random() * 100));
    }
    console.log(`Stream ${!isLive ? 'started' : 'stopped'}`);
  };

  const handleEndStream = () => {
    setIsLive(false);
    setViewers(0);
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.liveIndicator}>
          {isLive && (
            <>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
              <Text style={styles.viewersText}>{viewers} viewers</Text>
            </>
          )}
        </View>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={handleEndStream}
        >
          <IconSymbol 
            ios_icon_name="xmark" 
            android_material_icon_name="close" 
            size={24} 
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.videoPreview}>
        <View style={styles.placeholder}>
          <IconSymbol 
            ios_icon_name="video.fill" 
            android_material_icon_name="videocam" 
            size={64} 
            color={isLive ? '#FF6B6B' : '#444'}
          />
          <Text style={styles.placeholderText}>
            {isLive ? 'You are live!' : 'Camera Preview'}
          </Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton}>
          <IconSymbol 
            ios_icon_name="camera.rotate" 
            android_material_icon_name="flip_camera_ios" 
            size={28} 
            color="#fff"
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.liveButton, isLive && styles.liveButtonActive]}
          onPress={handleToggleLive}
        >
          <IconSymbol 
            ios_icon_name={isLive ? "stop.fill" : "play.fill"} 
            android_material_icon_name={isLive ? "stop" : "play_arrow"} 
            size={32} 
            color="#fff"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton}>
          <IconSymbol 
            ios_icon_name="mic.fill" 
            android_material_icon_name="mic" 
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
    alignItems: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
    marginRight: 8,
  },
  liveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  viewersText: {
    color: '#fff',
    fontSize: 14,
  },
  closeButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPreview: {
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
  controls: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveButton: {
    width: 70,
    height: 70,
    backgroundColor: '#FF6B6B',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveButtonActive: {
    backgroundColor: '#FF4444',
  },
});
