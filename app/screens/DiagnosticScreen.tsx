
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import { supabase, testSupabaseConnection } from '@/app/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useStreaming } from '@/contexts/StreamingContext';
import { useLiveStreamState } from '@/contexts/LiveStreamStateMachine';
import { useCameraEffects } from '@/contexts/CameraEffectsContext';
import * as Device from 'expo-device';
import * as Network from 'expo-network';
import Constants from 'expo-constants';

interface DiagnosticResult {
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  message: string;
  details?: string;
}

export default function DiagnosticScreen() {
  const { user } = useAuth();
  const { isStreaming } = useStreaming();
  const liveStreamState = useLiveStreamState();
  const cameraEffects = useCameraEffects();

  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  useEffect(() => {
    loadDeviceInfo();
  }, []);

  const loadDeviceInfo = async () => {
    try {
      const networkState = await Network.getNetworkStateAsync();
      
      setDeviceInfo({
        platform: Platform.OS,
        version: Platform.Version,
        deviceName: Device.deviceName,
        modelName: Device.modelName,
        osName: Device.osName,
        osVersion: Device.osVersion,
        isDevice: Device.isDevice,
        manufacturer: Device.manufacturer,
        expoVersion: Constants.expoVersion,
        appVersion: Constants.expoConfig?.version,
        networkType: networkState.type,
        isConnected: networkState.isConnected,
        isInternetReachable: networkState.isInternetReachable,
      });
    } catch (error) {
      console.error('Failed to load device info:', error);
    }
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    const diagnosticResults: DiagnosticResult[] = [];

    // Test 1: Platform Check
    diagnosticResults.push({
      name: 'Platform Detection',
      status: 'pass',
      message: `Running on ${Platform.OS} ${Platform.Version}`,
    });

    // Test 2: Expo Go Check
    diagnosticResults.push({
      name: 'Expo Go Environment',
      status: Device.isDevice ? 'pass' : 'warning',
      message: Device.isDevice ? 'Running on physical device' : 'Running on simulator/emulator',
      details: `Device: ${Device.deviceName || 'Unknown'}`,
    });

    // Test 3: Network Connectivity
    try {
      const networkState = await Network.getNetworkStateAsync();
      diagnosticResults.push({
        name: 'Network Connectivity',
        status: networkState.isConnected ? 'pass' : 'fail',
        message: networkState.isConnected
          ? `Connected via ${networkState.type}`
          : 'No network connection',
        details: `Internet reachable: ${networkState.isInternetReachable}`,
      });
    } catch (error) {
      diagnosticResults.push({
        name: 'Network Connectivity',
        status: 'fail',
        message: 'Failed to check network',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Test 4: Supabase Client Initialization
    try {
      if (supabase) {
        diagnosticResults.push({
          name: 'Supabase Client',
          status: 'pass',
          message: 'Supabase client initialized',
        });
      } else {
        diagnosticResults.push({
          name: 'Supabase Client',
          status: 'fail',
          message: 'Supabase client is undefined',
        });
      }
    } catch (error) {
      diagnosticResults.push({
        name: 'Supabase Client',
        status: 'fail',
        message: 'Failed to access Supabase client',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Test 5: Supabase Connection
    try {
      const connectionSuccess = await testSupabaseConnection();
      diagnosticResults.push({
        name: 'Supabase Connection',
        status: connectionSuccess ? 'pass' : 'fail',
        message: connectionSuccess
          ? 'Successfully connected to Supabase'
          : 'Failed to connect to Supabase',
      });
    } catch (error) {
      diagnosticResults.push({
        name: 'Supabase Connection',
        status: 'fail',
        message: 'Connection test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Test 6: Auth Context
    try {
      diagnosticResults.push({
        name: 'Auth Context',
        status: 'pass',
        message: user ? `Logged in as ${user.email}` : 'Not logged in',
        details: user ? `User ID: ${user.id}` : undefined,
      });
    } catch (error) {
      diagnosticResults.push({
        name: 'Auth Context',
        status: 'fail',
        message: 'Failed to access Auth context',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Test 7: Streaming Context
    try {
      diagnosticResults.push({
        name: 'Streaming Context',
        status: 'pass',
        message: `Streaming state: ${isStreaming ? 'Active' : 'Inactive'}`,
      });
    } catch (error) {
      diagnosticResults.push({
        name: 'Streaming Context',
        status: 'fail',
        message: 'Failed to access Streaming context',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Test 8: Live Stream State Machine
    try {
      diagnosticResults.push({
        name: 'State Machine',
        status: 'pass',
        message: `Current state: ${liveStreamState.currentState}`,
        details: liveStreamState.error || undefined,
      });
    } catch (error) {
      diagnosticResults.push({
        name: 'State Machine',
        status: 'fail',
        message: 'Failed to access State Machine',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Test 9: Camera Effects Context
    try {
      diagnosticResults.push({
        name: 'Camera Effects',
        status: 'pass',
        message: 'Camera effects context accessible',
        details: `Filter: ${cameraEffects.activeFilter?.name || 'None'}, Effect: ${cameraEffects.activeEffect?.name || 'None'}`,
      });
    } catch (error) {
      diagnosticResults.push({
        name: 'Camera Effects',
        status: 'fail',
        message: 'Failed to access Camera Effects context',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Test 10: Polyfills
    try {
      const hasURL = typeof URL !== 'undefined';
      const hasURLSearchParams = typeof URLSearchParams !== 'undefined';
      
      diagnosticResults.push({
        name: 'URL Polyfills',
        status: hasURL && hasURLSearchParams ? 'pass' : 'fail',
        message: hasURL && hasURLSearchParams
          ? 'URL polyfills loaded correctly'
          : 'URL polyfills missing',
        details: `URL: ${hasURL}, URLSearchParams: ${hasURLSearchParams}`,
      });
    } catch (error) {
      diagnosticResults.push({
        name: 'URL Polyfills',
        status: 'fail',
        message: 'Failed to check polyfills',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Test 11: AsyncStorage
    try {
      const AsyncStorageModule = await import('@react-native-async-storage/async-storage');
      const AsyncStorage = AsyncStorageModule.default;
      await AsyncStorage.setItem('diagnostic_test', 'test_value');
      const value = await AsyncStorage.getItem('diagnostic_test');
      await AsyncStorage.removeItem('diagnostic_test');
      
      diagnosticResults.push({
        name: 'AsyncStorage',
        status: value === 'test_value' ? 'pass' : 'fail',
        message: value === 'test_value'
          ? 'AsyncStorage working correctly'
          : 'AsyncStorage read/write failed',
      });
    } catch (error) {
      diagnosticResults.push({
        name: 'AsyncStorage',
        status: 'fail',
        message: 'AsyncStorage test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Test 12: Camera Permissions
    try {
      const CameraModule = await import('expo-camera');
      const hasCameraView = typeof CameraModule.CameraView !== 'undefined';
      diagnosticResults.push({
        name: 'Camera Module',
        status: hasCameraView ? 'pass' : 'fail',
        message: hasCameraView ? 'Camera module loaded successfully' : 'Camera module missing',
      });
    } catch (error) {
      diagnosticResults.push({
        name: 'Camera Module',
        status: 'fail',
        message: 'Failed to load camera module',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    setResults(diagnosticResults);
    setIsRunning(false);

    // Show summary alert
    const failedTests = diagnosticResults.filter((r) => r.status === 'fail');
    const warningTests = diagnosticResults.filter((r) => r.status === 'warning');

    if (failedTests.length === 0 && warningTests.length === 0) {
      Alert.alert(
        '✅ All Tests Passed',
        'Your app is configured correctly and all systems are operational.',
        [{ text: 'OK' }]
      );
    } else if (failedTests.length > 0) {
      Alert.alert(
        '❌ Tests Failed',
        `${failedTests.length} test(s) failed. Please review the results below.`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        '⚠️ Warnings Detected',
        `${warningTests.length} warning(s) detected. App should still work.`,
        [{ text: 'OK' }]
      );
    }
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'pass':
        return { icon: 'checkmark.circle.fill', color: '#4CAF50' };
      case 'fail':
        return { icon: 'xmark.circle.fill', color: '#F44336' };
      case 'warning':
        return { icon: 'exclamationmark.triangle.fill', color: '#FF9800' };
      case 'pending':
        return { icon: 'clock.fill', color: colors.textSecondary };
    }
  };

  const copyDiagnostics = () => {
    const report = `
ROAST LIVE - DIAGNOSTIC REPORT
Generated: ${new Date().toISOString()}

DEVICE INFORMATION:
${deviceInfo ? Object.entries(deviceInfo).map(([key, value]) => `${key}: ${value}`).join('\n') : 'Not available'}

TEST RESULTS:
${results.map((r) => `
${r.status.toUpperCase()}: ${r.name}
Message: ${r.message}
${r.details ? `Details: ${r.details}` : ''}
`).join('\n')}
    `.trim();

    Alert.alert(
      'Diagnostic Report',
      'Copy this report and send it to support for assistance.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Copy',
          onPress: () => {
            // In a real app, you'd use Clipboard API here
            console.log(report);
            Alert.alert('Copied', 'Report copied to console. Check your logs.');
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'System Diagnostics',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <IconSymbol
              ios_icon_name="stethoscope"
              android_material_icon_name="healing"
              size={48}
              color={colors.brandPrimary}
            />
            <Text style={styles.headerTitle}>System Diagnostics</Text>
            <Text style={styles.headerSubtitle}>
              Run comprehensive tests to identify any issues with your app configuration
            </Text>
          </View>

          {/* Device Info */}
          {deviceInfo && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Device Information</Text>
              <View style={styles.infoCard}>
                <InfoRow label="Platform" value={`${deviceInfo.platform} ${deviceInfo.version}`} />
                <InfoRow label="Device" value={deviceInfo.deviceName || 'Unknown'} />
                <InfoRow label="Model" value={deviceInfo.modelName || 'Unknown'} />
                <InfoRow label="OS" value={`${deviceInfo.osName} ${deviceInfo.osVersion}`} />
                <InfoRow label="Expo Version" value={deviceInfo.expoVersion || 'Unknown'} />
                <InfoRow label="Network" value={deviceInfo.networkType || 'Unknown'} />
                <InfoRow
                  label="Internet"
                  value={deviceInfo.isInternetReachable ? 'Reachable' : 'Not reachable'}
                />
              </View>
            </View>
          )}

          {/* Run Diagnostics Button */}
          {results.length === 0 && (
            <View style={styles.section}>
              <GradientButton
                title={isRunning ? 'Running Tests...' : 'Run Diagnostics'}
                onPress={runDiagnostics}
                size="large"
                disabled={isRunning}
              />
            </View>
          )}

          {/* Results */}
          {results.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Test Results</Text>
                <TouchableOpacity onPress={runDiagnostics} disabled={isRunning}>
                  <Text style={styles.rerunButton}>
                    {isRunning ? 'Running...' : 'Re-run'}
                  </Text>
                </TouchableOpacity>
              </View>

              {results.map((result, index) => {
                const statusInfo = getStatusIcon(result.status);
                return (
                  <View key={index} style={styles.resultCard}>
                    <View style={styles.resultHeader}>
                      <IconSymbol
                        ios_icon_name={statusInfo.icon}
                        android_material_icon_name={
                          result.status === 'pass'
                            ? 'check_circle'
                            : result.status === 'fail'
                            ? 'cancel'
                            : 'warning'
                        }
                        size={24}
                        color={statusInfo.color}
                      />
                      <Text style={styles.resultName}>{result.name}</Text>
                    </View>
                    <Text style={styles.resultMessage}>{result.message}</Text>
                    {result.details && (
                      <Text style={styles.resultDetails}>{result.details}</Text>
                    )}
                  </View>
                );
              })}

              {/* Summary */}
              <View style={styles.summary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Passed:</Text>
                  <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
                    {results.filter((r) => r.status === 'pass').length}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Failed:</Text>
                  <Text style={[styles.summaryValue, { color: '#F44336' }]}>
                    {results.filter((r) => r.status === 'fail').length}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Warnings:</Text>
                  <Text style={[styles.summaryValue, { color: '#FF9800' }]}>
                    {results.filter((r) => r.status === 'warning').length}
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionButton} onPress={copyDiagnostics}>
                  <IconSymbol
                    ios_icon_name="doc.on.doc"
                    android_material_icon_name="content_copy"
                    size={20}
                    color={colors.text}
                  />
                  <Text style={styles.actionButtonText}>Copy Report</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  rerunButton: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.brandPrimary,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  resultCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  resultMessage: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
    marginBottom: 4,
  },
  resultDetails: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  summary: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  actions: {
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});
