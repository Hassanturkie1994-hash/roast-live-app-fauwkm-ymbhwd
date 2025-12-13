
import React, { useEffect, useRef } from 'react';
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
import { IconSymbol } from '@/components/IconSymbol';
import { BlurView } from 'expo-blur';
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import AnimatedView from 'react-native-reanimated';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Href } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';

const { width: screenWidth } = Dimensions.get('window');

export interface TabBarItem {
  name: string;
  route: Href;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  isCenter?: boolean;
}

interface FloatingTabBarProps {
  tabs: TabBarItem[];
  containerWidth?: number;
  borderRadius?: number;
  bottomMargin?: number;
  isStreaming?: boolean;
}

export default function FloatingTabBar({
  tabs,
  containerWidth = screenWidth / 2.5,
  borderRadius = 35,
  bottomMargin,
  isStreaming = false,
}: FloatingTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { colors, theme } = useTheme();
  const t = useTranslation();
  const animatedValue = useSharedValue(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const activeTabIndex = React.useMemo(() => {
    let bestMatch = -1;
    let bestMatchScore = 0;

    tabs.forEach((tab, index) => {
      let score = 0;

      if (pathname === tab.route) {
        score = 100;
      } else if (pathname.startsWith(tab.route as string)) {
        score = 80;
      } else if (pathname.includes(tab.name)) {
        score = 60;
      } else if (tab.route.includes('/(tabs)/') && pathname.includes(tab.route.split('/(tabs)/')[1])) {
        score = 40;
      }

      if (score > bestMatchScore) {
        bestMatchScore = score;
        bestMatch = index;
      }
    });

    return bestMatch >= 0 ? bestMatch : 0;
  }, [pathname, tabs]);

  React.useEffect(() => {
    if (activeTabIndex >= 0) {
      animatedValue.value = withSpring(activeTabIndex, {
        damping: 20,
        stiffness: 120,
        mass: 1,
      });
    }
  }, [activeTabIndex, animatedValue]);

  useEffect(() => {
    // Animate tab bar hiding/showing when streaming status changes
    if (isStreaming) {
      console.log('🚫 Döljer flikfält - användaren streamar (iOS)');
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 150,
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
      console.log('✅ Visar flikfält - användaren slutade streama (iOS)');
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

  const handleTabPress = (route: Href) => {
    router.push(route);
  };

  const tabWidthPercent = ((100 / tabs.length) - 1).toFixed(2);

  const indicatorStyle = useAnimatedStyle(() => {
    const tabWidth = (containerWidth - 8) / tabs.length;
    return {
      transform: [
        {
          translateX: interpolate(
            animatedValue.value,
            [0, tabs.length - 1],
            [0, tabWidth * (tabs.length - 1)]
          ),
        },
      ],
    };
  });

  const blurContainerStyle = {
    ...styles.blurContainer,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        backgroundColor: theme === 'dark' 
          ? 'rgba(22, 22, 22, 0.9)' 
          : 'rgba(255, 255, 255, 0.9)',
      },
      android: {
        backgroundColor: theme === 'dark'
          ? 'rgba(22, 22, 22, 0.95)'
          : 'rgba(255, 255, 255, 0.95)',
      },
      web: {
        backgroundColor: theme === 'dark'
          ? 'rgba(22, 22, 22, 0.95)'
          : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
      },
    }),
  };

  const indicatorDynamicStyle = {
    ...styles.indicator,
    backgroundColor: colors.backgroundAlt,
    width: `${tabWidthPercent}%` as `${number}%`,
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
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={[
          styles.container,
          {
            width: containerWidth,
            marginBottom: bottomMargin ?? 20
          }
        ]}>
          <BlurView
            intensity={80}
            style={[blurContainerStyle, { borderRadius }]}
          >
            <View style={styles.background} />
            <AnimatedView style={[indicatorDynamicStyle, indicatorStyle]} />
            <View style={styles.tabsContainer}>
              {tabs.map((tab, index) => {
                const isActive = activeTabIndex === index;

                return (
                  <React.Fragment key={index}>
                    <TouchableOpacity
                      style={styles.tab}
                      onPress={() => handleTabPress(tab.route)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.tabContent}>
                        <IconSymbol
                          android_material_icon_name={tab.icon}
                          ios_icon_name={tab.icon}
                          size={24}
                          color={isActive ? colors.brandPrimary : colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.tabLabel,
                            { color: isActive ? colors.brandPrimary : colors.textSecondary },
                            isActive && { fontWeight: '600' },
                          ]}
                        >
                          {tab.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </React.Fragment>
                );
              })}
            </View>
          </BlurView>
        </View>
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
    alignItems: 'center',
  },
  safeArea: {
    alignItems: 'center',
  },
  container: {
    marginHorizontal: 20,
    alignSelf: 'center',
  },
  blurContainer: {
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  indicator: {
    position: 'absolute',
    top: 4,
    left: 2,
    bottom: 4,
    borderRadius: 27,
  },
  tabsContainer: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '500',
    marginTop: 2,
  },
});
