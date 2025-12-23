
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';

/**
 * BroadcastScreen - Web Fallback
 * 
 * Live streaming with Agora is not supported on web.
 * This screen informs users to use the native app.
 */
export default function BroadcastScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <IconSymbol
          ios_icon_name="exclamationmark.triangle"
          android_material_icon_name="error"
          size={80}
          color={colors.brandPrimary}
        />
        
        <Text style={[styles.title, { color: colors.text }]}>
          Live Streaming Not Available
        </Text>
        
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          Live streaming is only available on the iOS and Android apps.
          {'\n\n'}
          Please download the Roast Live app to start broadcasting.
        </Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.brandPrimary }]}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
