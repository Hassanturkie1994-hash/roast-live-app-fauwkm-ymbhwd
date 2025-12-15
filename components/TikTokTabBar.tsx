
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import RoastIcon from '@/components/Icons/RoastIcon';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService } from '@/app/services/notificationService';

const { width: screenWidth } = Dimensions.get('window');

interface TikTokTabBarProps {
  isStreaming?: boolean;
}

export default function TikTokTabBar({ isStreaming = false }: TikTokTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { colors, themeOpacity } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    
    try {
      const result = await notificationService.getUnreadCount(user.id);
      if (result.success) {
        setUnreadCount(result.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchUnreadCount]);

  useEffect(() => {
    // Animate tab bar hiding/showing when streaming status changes
    if (isStreaming) {
      console.log('🚫 Hiding tab bar - user is streaming');
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      console.log('✅ Showing tab bar - user stopped streaming');
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isStreaming, slideAnim, opacityAnim]);

  const isActive = (route: string) => {
    if (route === '/(tabs)/(home)/' || route === '/(tabs)/(home)') {
      return pathname === '/(tabs)/(home)/' || pathname === '/(tabs)/(home)' || pathname === '/';
    }
    return pathname.includes(route);
  };

  const handleTabPress = (route: string) => {
    router.push(route as any);
    
    // Refresh unread count when navigating to inbox
    if (route === '/(tabs)/inbox') {
      setTimeout(fetchUnreadCount, 500);
    }
  };

  const handleGoLive = () => {
    console.log('🎬 Go Live button pressed - opening pre-live setup');
    router.push('/(tabs)/pre-live-setup');
  };

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
      pointerEvents={isStreaming ? 'none' : 'auto'}
    >
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background, borderTopColor: colors.border }]} edges={['bottom']}>
        <Animated.View style={[styles.container, { opacity: themeOpacity }]}>
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => handleTabPress('/(tabs)/(home)/')}
              activeOpacity={0.7}
            >
              <RoastIcon
                name="flame-home"
                size={32}
                color={isActive('/(tabs)/(home)') ? colors.tabIconActiveColor : colors.tabIconColor}
              />
              <Text style={[styles.tabLabel, { color: isActive('/(tabs)/(home)') ? colors.tabIconActiveColor : colors.tabIconColor }]}>
                Home
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tab}
              onPress={() => handleTabPress('/(tabs)/explore')}
              activeOpacity={0.7}
            >
              <RoastIcon
                name="roast-compass"
                size={32}
                color={isActive('/explore') ? colors.tabIconActiveColor : colors.tabIconColor}
              />
              <Text style={[styles.tabLabel, { color: isActive('/explore') ? colors.tabIconActiveColor : colors.tabIconColor }]}>
                Explore
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.centerButton}
              onPress={handleGoLive}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[colors.brandPrimary, colors.brandPrimary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.centerButtonGradient}
              >
                <RoastIcon
                  name="fire-camera"
                  size={28}
                  color="#FFFFFF"
                />
                <Text style={styles.centerButtonText}>Go Live</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tab}
              onPress={() => handleTabPress('/(tabs)/inbox')}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <RoastIcon
                  name="smoke-message"
                  size={32}
                  color={isActive('/inbox') ? colors.tabIconActiveColor : colors.tabIconColor}
                />
                {unreadCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.brandPrimary, borderColor: colors.background }]}>
                    <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.tabLabel, { color: isActive('/inbox') ? colors.tabIconActiveColor : colors.tabIconColor }]}>
                Inbox
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tab}
              onPress={() => handleTabPress('/(tabs)/profile')}
              activeOpacity={0.7}
            >
              <RoastIcon
                name="roast-badge"
                size={32}
                color={isActive('/profile') ? colors.tabIconActiveColor : colors.tabIconColor}
              />
              <Text style={[styles.tabLabel, { color: isActive('/profile') ? colors.tabIconActiveColor : colors.tabIconColor }]}>
                Profile
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  safeArea: {
    borderTopWidth: 1,
  },
  container: {
    width: '100%',
  },
  tabsContainer: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  centerButton: {
    marginHorizontal: 8,
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  centerButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 6,
  },
  centerButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
