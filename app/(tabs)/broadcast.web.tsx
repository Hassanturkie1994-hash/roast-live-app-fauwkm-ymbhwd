
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router, Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * BROADCAST SCREEN (WEB STUB)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * This is a WEB STUB that prevents native Agora modules from being imported
 * on web, which would cause build errors.
 * 
 * PLATFORM SUPPORT:
 * - iOS: ❌ Use broadcast.native.tsx
 * - Android: ❌ Use broadcast.native.tsx
 * - Web: ✅ Shows "not supported" message
 * 
 * WHY THIS EXISTS:
 * - react-native-agora is a native module that cannot run on web
 * - Importing it on web causes Metro bundler errors
 * - This stub prevents those imports while providing user feedback
 * 
 * SOLUTION FOR USERS:
 * - Use the iOS or Android app for streaming
 * - Build a development client with EAS Build
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

export default function BroadcastScreenWeb() {
  const handleGoBack = () => {
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.container}>
        <View style={styles.content}>
          <IconSymbol
            ios_icon_name="video.slash.fill"
            android_material_icon_name="videocam_off"
            size={80}
            color={colors.textSecondary}
          />
          
          <Text style={styles.title}>Streaming Not Supported on Web</Text>
          
          <Text style={styles.description}>
            Live streaming requires native camera and microphone access that is only available on iOS and Android.
          </Text>

          <View style={styles.infoBox}>
            <IconSymbol
              ios_icon_name="info.circle.fill"
              android_material_icon_name="info"
              size={24}
              color={colors.brandPrimary}
            />
            <Text style={styles.infoText}>
              To start streaming, please use the Roast Live app on your iOS or Android device.
            </Text>
          </View>

          <View style={styles.stepsContainer}>
            <Text style={styles.stepsTitle}>How to Stream:</Text>
            
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>
                Download the Roast Live app from the App Store or Google Play
              </Text>
            </View>

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>
                Log in with your account
              </Text>
            </View>

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>
                Tap the camera icon to start streaming
              </Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <GradientButton
              title="Go Back"
              onPress={handleGoBack}
              size="large"
            />
          </View>

          <Text style={styles.footnote}>
            For developers: Use EAS Build to create a development client with native modules.
          </Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderColor: colors.brandPrimary,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    alignItems: 'center',
    maxWidth: 500,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 20,
  },
  stepsContainer: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  step: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 20,
    paddingTop: 6,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    marginTop: 20,
  },
  footnote: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },
});
