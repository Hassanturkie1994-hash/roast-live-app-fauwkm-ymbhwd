
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Slot, SplashScreen, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LiveStreamStateMachineProvider } from '@/contexts/LiveStreamStateMachine';
import { StreamingProvider } from '@/contexts/StreamingContext';
import { CameraEffectsProvider } from '@/contexts/CameraEffectsContext';
import { ModeratorsProvider } from '@/contexts/ModeratorsContext';
import { VIPClubProvider } from '@/contexts/VIPClubContext';
import { WidgetProvider } from '@/contexts/WidgetContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import { DeviceBanGuard } from '@/components/DeviceBanGuard';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import withEditableWrapper_ from '@/babel-plugins/react/withEditableWrapper_';

SplashScreen.preventAutoHideAsync();

// CRITICAL FIX: Safe window dimensions with defaults
const getWindowDimensions = () => {
  try {
    const dims = Dimensions.get('window');
    return {
      width: dims.width || 375,
      height: dims.height || 667,
    };
  } catch (error) {
    console.error('❌ [LAYOUT] Error getting window dimensions:', error);
    return {
      width: 375,
      height: 667,
    };
  }
};

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
  }, [user, loading, segments, router]);

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

  const [providersReady, setProvidersReady] = useState(false);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // CRITICAL FIX: Delay rendering until providers are ready
  useEffect(() => {
    // Ensure window dimensions are available
    const dims = getWindowDimensions();
    console.log('📐 [LAYOUT] Window dimensions:', dims);
    
    // Small delay to ensure all providers are mounted
    const timer = setTimeout(() => {
      setProvidersReady(true);
      console.log('✅ [LAYOUT] Providers ready, rendering content');
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (!fontsLoaded || !providersReady) {
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

/**
 * RootLayout
 * 
 * CRITICAL FIX: Correct provider hierarchy with EditableContext
 * 
 * Provider order (top → bottom):
 * 1. ErrorBoundary (outermost - catches all errors)
 * 2. EditableContext (from withEditableWrapper_ - MUST be at root for babel plugin)
 * 3. ThemeProvider (theme context for all components)
 * 4. AuthProvider (authentication state)
 * 5. LiveStreamStateMachineProvider (live stream state machine)
 * 6. StreamingProvider (streaming context)
 * 7. CameraEffectsProvider (camera filters/effects)
 * 8. ModeratorsProvider (moderator management)
 * 9. VIPClubProvider (VIP club features)
 * 10. WidgetProvider (widget state)
 * 11. RootLayoutContent (actual app content)
 * 
 * IMPORTANT: All providers MUST be mounted before any screen that uses them
 */
function RootLayoutBase() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 [LAYOUT] RootLayout mounting...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return (
    <ErrorBoundary FallbackComponent={GlobalErrorFallback}>
      <ThemeProvider>
        <AuthProvider>
          <LiveStreamStateMachineProvider>
            <StreamingProvider>
              <CameraEffectsProvider>
                <ModeratorsProvider>
                  <VIPClubProvider>
                    <WidgetProvider>
                      <RootLayoutContent />
                    </WidgetProvider>
                  </VIPClubProvider>
                </ModeratorsProvider>
              </CameraEffectsProvider>
            </StreamingProvider>
          </LiveStreamStateMachineProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

// CRITICAL FIX: Wrap the entire layout with EditableContext provider
// This ensures EditableElement_ components can access the context
const RootLayout = withEditableWrapper_(RootLayoutBase);

export default RootLayout;

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
