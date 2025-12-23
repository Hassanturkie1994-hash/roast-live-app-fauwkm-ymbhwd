
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { cloudflareService } from '@/app/services/cloudflareService';

interface DiagnosticResult {
  timestamp: string;
  checks: {
    serviceExists: boolean;
    serviceIsObject: boolean;
    hasCreateLiveStream: boolean;
    createLiveStreamIsFunction: boolean;
    hasStartLive: boolean;
    startLiveIsFunction: boolean;
    hasStopLive: boolean;
    stopLiveIsFunction: boolean;
    hasVerifyService: boolean;
    verifyServiceResult: boolean | null;
  };
  availableMethods: string[];
  serviceType: string;
}

export function ServiceDiagnostic() {
  const [result, setResult] = useState<DiagnosticResult | null>(null);

  useEffect(() => {
    console.log('🔍 [ServiceDiagnostic] Running diagnostic...');

    const checks = {
      serviceExists: typeof cloudflareService !== 'undefined',
      serviceIsObject: typeof cloudflareService === 'object' && cloudflareService !== null,
      hasCreateLiveStream: cloudflareService && 'createLiveStream' in cloudflareService,
      createLiveStreamIsFunction: cloudflareService && typeof cloudflareService.createLiveStream === 'function',
      hasStartLive: cloudflareService && 'startLive' in cloudflareService,
      startLiveIsFunction: cloudflareService && typeof cloudflareService.startLive === 'function',
      hasStopLive: cloudflareService && 'stopLive' in cloudflareService,
      stopLiveIsFunction: cloudflareService && typeof cloudflareService.stopLive === 'function',
      hasVerifyService: cloudflareService && 'verifyService' in cloudflareService,
      verifyServiceResult: null as boolean | null,
    };

    // Run verifyService if available
    if (checks.hasVerifyService && typeof cloudflareService.verifyService === 'function') {
      try {
        checks.verifyServiceResult = cloudflareService.verifyService();
      } catch (error) {
        console.error('Error running verifyService:', error);
        checks.verifyServiceResult = false;
      }
    }

    const availableMethods = cloudflareService ? Object.keys(cloudflareService) : [];
    const serviceType = typeof cloudflareService;

    const diagnosticResult: DiagnosticResult = {
      timestamp: new Date().toISOString(),
      checks,
      availableMethods,
      serviceType,
    };

    setResult(diagnosticResult);

    console.log('📊 [ServiceDiagnostic] Results:', diagnosticResult);
  }, []);

  if (!result) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Running diagnostic...</Text>
      </View>
    );
  }

  const allChecksPassed = Object.entries(result.checks)
    .filter(([key]) => key !== 'verifyServiceResult')
    .every(([, value]) => value === true);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Service Diagnostic</Text>
      <Text style={styles.timestamp}>{result.timestamp}</Text>

      <View style={[styles.statusBadge, allChecksPassed ? styles.statusSuccess : styles.statusError]}>
        <Text style={styles.statusText}>
          {allChecksPassed ? '✅ All Checks Passed' : '❌ Some Checks Failed'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service Type</Text>
        <Text style={styles.value}>{result.serviceType}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Checks</Text>
        {Object.entries(result.checks).map(([key, value]) => (
          <View key={key} style={styles.checkRow}>
            <Text style={styles.checkIcon}>{value ? '✅' : '❌'}</Text>
            <Text style={styles.checkLabel}>{key}</Text>
            <Text style={styles.checkValue}>{String(value)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Methods ({result.availableMethods.length})</Text>
        {result.availableMethods.map((method) => (
          <Text key={method} style={styles.methodItem}>• {method}</Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    color: '#000000',
  },
  timestamp: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 20,
  },
  statusBadge: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusSuccess: {
    backgroundColor: '#4CAF50',
  },
  statusError: {
    backgroundColor: '#F44336',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#000000',
  },
  value: {
    fontSize: 14,
    color: '#333333',
    fontFamily: 'monospace',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  checkIcon: {
    fontSize: 16,
    width: 24,
  },
  checkLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
  },
  checkValue: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'monospace',
  },
  methodItem: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});
