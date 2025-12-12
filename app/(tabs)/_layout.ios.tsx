
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export default function TabLayout() {
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
      route: '/(tabs)/broadcaster',
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
        <Stack.Screen key="broadcaster" name="broadcaster" />
        <Stack.Screen key="broadcasterscreen" name="broadcasterscreen" />
        <Stack.Screen key="inbox" name="inbox" />
        <Stack.Screen key="profile" name="profile" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
