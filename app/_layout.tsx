
import { Stack } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { StreamingProvider } from '@/contexts/StreamingContext';
import { LiveStreamStateMachineProvider } from '@/contexts/LiveStreamStateMachine';
import { VIPClubProvider } from '@/contexts/VIPClubContext';
import { ModeratorsProvider } from '@/contexts/ModeratorsContext';
import { CameraEffectsProvider } from '@/contexts/CameraEffectsContext';
import { WidgetProvider } from '@/contexts/WidgetContext';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StreamingProvider>
          <LiveStreamStateMachineProvider>
            <VIPClubProvider>
              <ModeratorsProvider>
                <CameraEffectsProvider>
                  <WidgetProvider>
                    <StatusBar style="light" />
                    <Stack
                      screenOptions={{
                        headerShown: false,
                        animation: 'fade',
                        contentStyle: { backgroundColor: '#000000' },
                      }}
                    >
                      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                      <Stack.Screen name="auth/login" options={{ headerShown: false }} />
                      <Stack.Screen name="auth/register" options={{ headerShown: false }} />
                      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
                      <Stack.Screen name="formsheet" options={{ presentation: 'formSheet' }} />
                      <Stack.Screen name="transparent-modal" options={{ presentation: 'transparentModal' }} />
                    </Stack>
                  </WidgetProvider>
                </CameraEffectsProvider>
              </ModeratorsProvider>
            </VIPClubProvider>
          </LiveStreamStateMachineProvider>
        </StreamingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
