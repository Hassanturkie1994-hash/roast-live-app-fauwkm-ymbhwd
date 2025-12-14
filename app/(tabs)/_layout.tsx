
import React from 'react';
import { Stack } from 'expo-router';
import TikTokTabBar from '@/components/TikTokTabBar';
import { useTheme } from '@/contexts/ThemeContext';
import { StreamingProvider, useStreaming } from '@/contexts/StreamingContext';

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
  return (
    <StreamingProvider>
      <TabLayoutContent />
    </StreamingProvider>
  );
}
