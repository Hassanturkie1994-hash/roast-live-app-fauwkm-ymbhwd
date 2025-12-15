
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { StreamingProvider } from '@/contexts/StreamingContext';
import { LiveStreamStateProvider } from '@/contexts/LiveStreamStateMachine';
import { CameraEffectsProvider } from '@/contexts/CameraEffectsContext';
import { VIPClubProvider } from '@/contexts/VIPClubContext';
import { ModeratorsProvider } from '@/contexts/ModeratorsContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

/**
 * Navigation Guard Component
 * Enforces authentication rules and handles navigation based on auth state
 */
function NavigationGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    if (loading || isNavigating) {
      return;
    }

    const inAuthGroup = segments[0] === 'auth';
    const inTabsGroup = segments[0] === '(tabs)';

    console.log('🔐 Navigation Guard:', {
      user: user?.id,
      loading,
      segments,
      inAuthGroup,
      inTabsGroup,
    });

    if (!user && !inAuthGroup) {
      // User is not authenticated and not in auth screens
      // Redirect to login
      console.log('🚫 User not authenticated, redirecting to login');
      setIsNavigating(true);
      router.replace('/auth/login');
      setTimeout(() => setIsNavigating(false), 100);
    } else if (user && inAuthGroup) {
      // User is authenticated but still in auth screens
      // Redirect to main app
      console.log('✅ User authenticated, redirecting to home');
      setIsNavigating(true);
      router.replace('/(tabs)/(home)');
      setTimeout(() => setIsNavigating(false), 100);
    }
  }, [user, loading, segments, isNavigating]);

  // Show loading screen while checking auth state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A40028" />
      </View>
    );
  }

  return <>{children}</>;
}

/**
 * RootLayout - Main app layout with provider hierarchy
 */
export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <NavigationGuard>
            <StreamingProvider>
              <LiveStreamStateProvider>
                <CameraEffectsProvider>
                  <VIPClubProvider>
                    <ModeratorsProvider>
                      <Stack
                        screenOptions={{
                          headerShown: false,
                          animation: 'slide_from_right',
                        }}
                      >
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen name="auth" options={{ headerShown: false }} />
                        <Stack.Screen name="screens" options={{ headerShown: false }} />
                        <Stack.Screen
                          name="modal"
                          options={{
                            presentation: 'modal',
                            animation: 'slide_from_bottom',
                          }}
                        />
                        <Stack.Screen
                          name="formsheet"
                          options={{
                            presentation: 'formSheet',
                            animation: 'slide_from_bottom',
                          }}
                        />
                        <Stack.Screen
                          name="transparent-modal"
                          options={{
                            presentation: 'transparentModal',
                            animation: 'fade',
                          }}
                        />
                      </Stack>
                    </ModeratorsProvider>
                  </VIPClubProvider>
                </CameraEffectsProvider>
              </LiveStreamStateProvider>
            </StreamingProvider>
          </NavigationGuard>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
