
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
        <Stack.Screen key="broadcaster" name="broadcaster" />
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
