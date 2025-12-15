
import { Stack } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { StreamingProvider } from '@/contexts/StreamingContext';
import { LiveStreamStateProvider } from '@/contexts/LiveStreamStateMachine';
import { CameraEffectsProvider } from '@/contexts/CameraEffectsContext';
import { VIPClubProvider } from '@/contexts/VIPClubContext';
import { ModeratorsProvider } from '@/contexts/ModeratorsContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * RootLayout - Main app layout with provider hierarchy
 * 
 * All providers are correctly imported as named exports
 */
export default function RootLayout() {
  useEffect(() => {
    console.log('🚀 App initialized on platform:', Platform.OS);
    
    // Validate all providers are defined
    const providers = {
      ThemeProvider,
      AuthProvider,
      StreamingProvider,
      LiveStreamStateProvider,
      CameraEffectsProvider,
      VIPClubProvider,
      ModeratorsProvider,
    };
    
    Object.entries(providers).forEach(([name, provider]) => {
      if (typeof provider === 'undefined') {
        console.error(`❌ CRITICAL: ${name} is undefined!`);
        throw new Error(`Provider ${name} is undefined. Check export/import syntax.`);
      } else {
        console.log(`✅ ${name} is defined`);
      }
    });
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
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
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
