
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface DeviceBanGuardProps {
  children: React.ReactNode;
}

export default function DeviceBanGuard({ children }: DeviceBanGuardProps) {
  return <>{children}</>;
}
