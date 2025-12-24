
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';

/**
 * BroadcastScreen - Web Fallback
 * 
 * This screen is shown on web builds to inform users that
 * live streaming is not supported on web.
 * 
 * Users must use Android or iOS dev builds for full streaming functionality.
 */
export default function BroadcastWebScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      edges={['top', 'bottom']}
    >
      <View style={styles.content}>
        <IconSymbol
          ios_icon_name="exclamationmark.triangle.fill"
          android_material_icon_name="warning"
          size={80}
          color={colors.brandPrimary}
        />
        
        <Text style={[styles.title, { color: colors.text }]}>
          Streaming Not Supported on Web
        </Text>
        
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          Live streaming requires native device capabilities that are not available in web browsers.
        </Text>
        
        <View style={styles.instructionsContainer}>
          <Text style={[styles.instructionsTitle, { color: colors.text }]}>
            To use live streaming:
          </Text>
          
          <View style={styles.instructionItem}>
            <Text style={[styles.bullet, { color: colors.brandPrimary }]}>•</Text>
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              Build an Android dev client with EAS
            </Text>
          </View>
          
          <View style={styles.instructionItem}>
            <Text style={[styles.bullet, { color: colors.brandPrimary }]}>•</Text>
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              Build an iOS dev client with EAS
            </Text>
          </View>
          
          <View style={styles.instructionItem}>
            <Text style={[styles.bullet, { color: colors.brandPrimary }]}>•</Text>
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              Install the dev client on your device
            </Text>
          </View>
          
          <View style={styles.instructionItem}>
            <Text style={[styles.bullet, { color: colors.brandPrimary }]}>•</Text>
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              Run the app through the dev client
            </Text>
          </View>
        </View>
        
        <View style={styles.commandContainer}>
          <Text style={[styles.commandTitle, { color: colors.text }]}>
            Build Commands:
          </Text>
          <View style={[styles.commandBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.commandText, { color: colors.textSecondary }]}>
              npm run eas:dev:android
            </Text>
            <Text style={[styles.commandText, { color: colors.textSecondary }]}>
              npm run eas:dev:ios
            </Text>
          </View>
        </View>
        
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
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 24,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    fontWeight: '400',
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  instructionsContainer: {
    marginTop: 32,
    width: '100%',
    maxWidth: 400,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingLeft: 8,
  },
  bullet: {
    fontSize: 20,
    fontWeight: '700',
    marginRight: 12,
    lineHeight: 24,
  },
  instructionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 24,
  },
  commandContainer: {
    marginTop: 32,
    width: '100%',
    maxWidth: 400,
  },
  commandTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  commandBox: {
    padding: 16,
    borderRadius: 8,
  },
  commandText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  button: {
    marginTop: 32,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    minWidth: 200,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});
