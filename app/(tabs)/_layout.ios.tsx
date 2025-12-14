
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { StreamingProvider, useStreaming } from '@/contexts/StreamingContext';

function TabLayoutContent() {
  const { isStreaming } = useStreaming();

  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'home',
      label: 'Home',
    },
    {
      name: 'explore',
      route: '/(tabs)/explore',
      icon: 'search',
      label: 'Explore',
    },
    {
      name: 'broadcaster',
      route: '/(tabs)/go-live-modal',
      icon: 'add-circle',
      label: 'Go Live',
      isCenter: true,
    },
    {
      name: 'inbox',
      route: '/(tabs)/inbox',
      icon: 'mail',
      label: 'Inbox',
    },
    {
      name: 'profile',
      route: '/(tabs)/profile',
      icon: 'person',
      label: 'Profile',
    },
  ];

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Stack.Screen key="home" name="(home)" />
        <Stack.Screen key="explore" name="explore" />
        <Stack.Screen key="go-live-modal" name="go-live-modal" options={{ presentation: 'transparentModal' }} />
        <Stack.Screen key="broadcast" name="broadcast" />
        <Stack.Screen key="inbox" name="inbox" />
        <Stack.Screen key="profile" name="profile" />
      </Stack>
      <FloatingTabBar tabs={tabs} isStreaming={isStreaming} />
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
