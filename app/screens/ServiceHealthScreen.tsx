
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { checkServiceHealth, ServiceRegistry } from '@/app/services/serviceRegistry';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'unhealthy' | 'checking';
  message?: string;
}

export default function ServiceHealthScreen() {
  const { colors } = useTheme();
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [overallHealth, setOverallHealth] = useState<'healthy' | 'unhealthy'>('healthy');

  useEffect(() => {
    checkServices();
  }, []);

  const checkServices = async () => {
    setIsLoading(true);

    const serviceList: ServiceStatus[] = [
      { name: 'Achievement Service', status: 'checking' },
      { name: 'Admin Service', status: 'checking' },
      { name: 'Cloudflare Service', status: 'checking' },
      { name: 'Stream Service', status: 'checking' },
      { name: 'Wallet Service', status: 'checking' },
      { name: 'Stripe Service', status: 'checking' },
      { name: 'Moderation Service', status: 'checking' },
      { name: 'Notification Service', status: 'checking' },
      { name: 'Gift Service', status: 'checking' },
      { name: 'Replay Service', status: 'checking' },
      { name: 'Analytics Service', status: 'checking' },
      { name: 'Content Safety Service', status: 'checking' },
    ];

    setServices(serviceList);

    // Perform health check
    const health = checkServiceHealth();

    // Update service statuses
    const updatedServices = serviceList.map((service) => {
      const serviceName = service.name.toLowerCase().replace(' service', '');
      const isHealthy = health.services[serviceName] !== false;

      return {
        ...service,
        status: isHealthy ? 'healthy' : 'unhealthy',
        message: isHealthy ? 'Service is operational' : 'Service unavailable',
      } as ServiceStatus;
    });

    setServices(updatedServices);
    setOverallHealth(health.healthy ? 'healthy' : 'unhealthy');
    setIsLoading(false);
  };

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy':
        return '#4CAF50';
      case 'unhealthy':
        return '#F44336';
      case 'checking':
        return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy':
        return 'checkmark.circle.fill';
      case 'unhealthy':
        return 'xmark.circle.fill';
      case 'checking':
        return 'clock.fill';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Service Health</Text>
        <TouchableOpacity onPress={checkServices} style={styles.refreshButton}>
          <IconSymbol
            ios_icon_name="arrow.clockwise"
            android_material_icon_name="refresh"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Checking services...
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          {/* Overall Health Card */}
          <View
            style={[
              styles.overallCard,
              {
                backgroundColor: colors.card,
                borderColor: overallHealth === 'healthy' ? '#4CAF50' : '#F44336',
              },
            ]}
          >
            <IconSymbol
              ios_icon_name={
                overallHealth === 'healthy' ? 'checkmark.circle.fill' : 'xmark.circle.fill'
              }
              android_material_icon_name={overallHealth === 'healthy' ? 'check_circle' : 'error'}
              size={48}
              color={overallHealth === 'healthy' ? '#4CAF50' : '#F44336'}
            />
            <Text style={[styles.overallTitle, { color: colors.text }]}>
              {overallHealth === 'healthy' ? 'All Systems Operational' : 'Service Issues Detected'}
            </Text>
            <Text style={[styles.overallSubtitle, { color: colors.textSecondary }]}>
              {services.filter((s) => s.status === 'healthy').length} / {services.length} services
              healthy
            </Text>
          </View>

          {/* Service List */}
          <View style={styles.serviceList}>
            {services.map((service, index) => (
              <View
                key={index}
                style={[
                  styles.serviceItem,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.serviceLeft}>
                  <IconSymbol
                    ios_icon_name={getStatusIcon(service.status)}
                    android_material_icon_name={
                      service.status === 'healthy'
                        ? 'check_circle'
                        : service.status === 'unhealthy'
                        ? 'error'
                        : 'schedule'
                    }
                    size={24}
                    color={getStatusColor(service.status)}
                  />
                  <View style={styles.serviceInfo}>
                    <Text style={[styles.serviceName, { color: colors.text }]}>
                      {service.name}
                    </Text>
                    {service.message && (
                      <Text style={[styles.serviceMessage, { color: colors.textSecondary }]}>
                        {service.message}
                      </Text>
                    )}
                  </View>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${getStatusColor(service.status)}20` },
                  ]}
                >
                  <Text style={[styles.statusText, { color: getStatusColor(service.status) }]}>
                    {service.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Info Card */}
          <View style={[styles.infoCard, { backgroundColor: colors.backgroundAlt }]}>
            <IconSymbol
              ios_icon_name="info.circle.fill"
              android_material_icon_name="info"
              size={24}
              color={colors.brandPrimary}
            />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              This screen shows the health status of all critical services in the app. If any
              service is unhealthy, some features may not work correctly.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  refreshButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
    gap: 20,
  },
  overallCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    gap: 12,
  },
  overallTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  overallSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  serviceList: {
    gap: 12,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  serviceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  serviceInfo: {
    flex: 1,
    gap: 4,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
  },
  serviceMessage: {
    fontSize: 12,
    fontWeight: '400',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  infoCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
});
