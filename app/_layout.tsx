
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Slot, SplashScreen, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { StreamingProvider } from '@/contexts/StreamingContext';
import { ModeratorsProvider } from '@/contexts/ModeratorsContext';
import { VIPClubProvider } from '@/contexts/VIPClubContext';
import { WidgetProvider } from '@/contexts/WidgetContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import { DeviceBanGuard } from '@/components/DeviceBanGuard';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';

SplashScreen.preventAutoHideAsync();

function NavigationGuard() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      console.log('🔒 User not authenticated, redirecting to login');
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      console.log('✅ User authenticated, redirecting to home');
      router.replace('/(tabs)/(home)');
    }
  }, [user, loading, segments]);

  return null;
}

function GlobalErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
      <View style={styles.errorContent}>
        <IconSymbol
          ios_icon_name="exclamationmark.triangle.fill"
          android_material_icon_name="error"
          size={64}
          color={colors.brandPrimary}
        />
        <Text style={[styles.errorTitle, { color: colors.text }]}>Something went wrong</Text>
        <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
          {error.message || 'An unexpected error occurred'}
        </Text>
        <TouchableOpacity
          style={[styles.errorButton, { backgroundColor: colors.brandPrimary }]}
          onPress={resetError}
        >
          <Text style={styles.errorButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function RootLayoutContent() {
  const [fontsLoaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ErrorBoundary FallbackComponent={GlobalErrorFallback}>
      <DeviceBanGuard>
        <NavigationGuard />
        <Slot />
      </DeviceBanGuard>
    </ErrorBoundary>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary FallbackComponent={GlobalErrorFallback}>
      <ThemeProvider>
        <AuthProvider>
          <StreamingProvider>
            <ModeratorsProvider>
              <VIPClubProvider>
                <WidgetProvider>
                  <RootLayoutContent />
                </WidgetProvider>
              </VIPClubProvider>
            </ModeratorsProvider>
          </StreamingProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContent: {
    alignItems: 'center',
    maxWidth: 400,
    gap: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 16,
  },
  errorMessage: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    marginTop: 16,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
