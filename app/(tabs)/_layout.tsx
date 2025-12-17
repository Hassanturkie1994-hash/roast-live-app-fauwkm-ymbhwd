
import React from 'react';
import { Stack } from 'expo-router';
import TikTokTabBar from '@/components/TikTokTabBar';
import { useTheme } from '@/contexts/ThemeContext';
import { useStreaming } from '@/contexts/StreamingContext';

/**
 * TabLayout
 * 
 * CRITICAL FIX: Removed duplicate StreamingProvider
 * 
 * All providers are now mounted at the root level in app/_layout.tsx
 * This ensures consistent provider hierarchy and prevents context errors.
 * 
 * Provider hierarchy (from app/_layout.tsx):
 * - AuthProvider
 * - LiveStreamStateMachineProvider ← NOW AVAILABLE
 * - StreamingProvider ← NOW AVAILABLE
 * - CameraEffectsProvider ← NOW AVAILABLE
 * - ModeratorsProvider
 * - VIPClubProvider
 * - WidgetProvider
 */
function TabLayoutContent() {
  const { isStreaming } = useStreaming();
  const { colors } = useTheme();

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen key="home" name="(home)" />
        <Stack.Screen key="explore" name="explore" />
        <Stack.Screen 
          key="pre-live-setup" 
          name="pre-live-setup" 
          options={{ 
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
          }} 
        />
        <Stack.Screen 
          key="go-live-modal" 
          name="go-live-modal" 
          options={{ 
            presentation: 'transparentModal',
          }} 
        />
        <Stack.Screen key="broadcast" name="broadcast" />
        <Stack.Screen key="inbox" name="inbox" />
        <Stack.Screen key="profile" name="profile" />
      </Stack>
      <TikTokTabBar isStreaming={isStreaming} />
    </>
  );
}

export default function TabLayout() {
  // No need to wrap with StreamingProvider - it's already in root layout
  return <TabLayoutContent />;
}
