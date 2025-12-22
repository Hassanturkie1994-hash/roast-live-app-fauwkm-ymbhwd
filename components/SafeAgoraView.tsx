
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Constants from 'expo-constants';

interface SafeAgoraViewProps {
  uid: number;
  sourceType: 'camera' | 'remote';
  style?: any;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CRITICAL GUARD: EXPO GO DETECTION (PREVENTS WHITE SCREEN OF DEATH)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Check if we're in Expo Go using BOTH methods for maximum safety
const isExpoGo = 
  Constants.executionEnvironment === 'storeClient' || 
  Constants.appOwnership === 'expo';

console.log('🎭 [SafeAgoraView] Environment check:', {
  executionEnvironment: Constants.executionEnvironment,
  appOwnership: Constants.appOwnership,
  isExpoGo,
  platform: Constants.platform,
});

/**
 * SafeAgoraView Component
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * CRITICAL: Prevents "White Screen of Death" in Expo Go
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * This component conditionally renders either:
 * 1. A placeholder view in Expo Go (no native module import)
 * 2. The real RtcSurfaceView in dev client/standalone builds
 * 
 * EXPO GO PROTECTION:
 * - Detects Expo Go environment using Constants.executionEnvironment
 * - Returns placeholder view WITHOUT importing react-native-agora
 * - Prevents native module initialization crash
 * - Uses try/catch for additional safety
 * 
 * DEV CLIENT/STANDALONE:
 * - Dynamically imports RtcSurfaceView only when NOT in Expo Go
 * - Full Agora functionality with real video rendering
 * - Wrapped in try/catch to handle any import failures
 */
export default function SafeAgoraView({ uid, sourceType, style }: SafeAgoraViewProps) {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // GUARD 1: EXPO GO CHECK (FIRST LINE OF DEFENSE)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (isExpoGo) {
    console.log('🎭 [SafeAgoraView] EXPO GO DETECTED - Rendering placeholder');
    console.log('🎭 [SafeAgoraView] NO Agora import will occur');
    
    return (
      <View style={[styles.placeholderContainer, style]}>
        <View style={styles.placeholderContent}>
          <Text style={styles.placeholderTitle}>📹 VIDEO PLACEHOLDER</Text>
          <Text style={styles.placeholderSubtitle}>Expo Go Mode</Text>
          <Text style={styles.placeholderInfo}>
            {sourceType === 'camera' ? 'Local Camera' : 'Remote User'}
          </Text>
          <Text style={styles.placeholderUid}>UID: {uid}</Text>
          <Text style={styles.placeholderNote}>
            Build a dev client to see real video
          </Text>
        </View>
      </View>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // GUARD 2: TRY/CATCH AROUND AGORA IMPORT (SECOND LINE OF DEFENSE)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  try {
    console.log('🚀 [SafeAgoraView] Dev Client/Standalone detected');
    console.log('🚀 [SafeAgoraView] Attempting to load Agora SDK...');
    
    // Dynamic require - only executed in dev client/standalone
    const AgoraSDK = require('react-native-agora');
    
    if (!AgoraSDK || !AgoraSDK.RtcSurfaceView || !AgoraSDK.VideoSourceType) {
      throw new Error('Agora SDK components not available');
    }
    
    const { RtcSurfaceView, VideoSourceType } = AgoraSDK;

    const videoSourceType = sourceType === 'camera' 
      ? VideoSourceType.VideoSourceCamera 
      : VideoSourceType.VideoSourceRemote;

    console.log('✅ [SafeAgoraView] Agora SDK loaded successfully');
    console.log('✅ [SafeAgoraView] Rendering real RtcSurfaceView for UID:', uid);

    return (
      <RtcSurfaceView
        style={style}
        canvas={{
          uid,
          sourceType: videoSourceType,
        }}
      />
    );
  } catch (error) {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // GUARD 3: FALLBACK TO PLACEHOLDER (THIRD LINE OF DEFENSE)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.error('❌ [SafeAgoraView] Failed to load Agora SDK:', error);
    console.error('❌ [SafeAgoraView] Falling back to placeholder view');
    
    return (
      <View style={[styles.placeholderContainer, style]}>
        <View style={styles.placeholderContent}>
          <Text style={styles.placeholderTitle}>⚠️ VIDEO UNAVAILABLE</Text>
          <Text style={styles.placeholderSubtitle}>Agora SDK Error</Text>
          <Text style={styles.placeholderInfo}>
            {sourceType === 'camera' ? 'Local Camera' : 'Remote User'}
          </Text>
          <Text style={styles.placeholderUid}>UID: {uid}</Text>
          <Text style={styles.placeholderError}>
            {error instanceof Error ? error.message : 'Unknown error'}
          </Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  placeholderContainer: {
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFA500',
    borderRadius: 8,
  },
  placeholderContent: {
    alignItems: 'center',
    padding: 20,
  },
  placeholderTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  placeholderSubtitle: {
    color: '#FFA500',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  placeholderInfo: {
    color: '#CCCCCC',
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 4,
  },
  placeholderUid: {
    color: '#888888',
    fontSize: 10,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 8,
  },
  placeholderNote: {
    color: '#666666',
    fontSize: 10,
    fontWeight: '400',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  placeholderError: {
    color: '#FF6666',
    fontSize: 9,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 8,
  },
});
