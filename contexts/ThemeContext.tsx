
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Animated } from 'react-native';

export type ThemeMode = 'light' | 'dark';

interface ThemeColors {
  // Background Colors
  background: string;
  backgroundAlt: string;
  card: string;
  
  // Brand Colors
  brandPrimary: string;
  gradientStart: string;
  gradientEnd: string;
  highlight: string;
  
  // Text Colors
  text: string;
  textSecondary: string;
  placeholder: string;
  
  // Border & Divider
  border: string;
  divider: string;
  
  // Status Bar
  statusBarStyle: 'light' | 'dark';
  
  // Tab Icons
  tabIconColor: string;
  tabIconActiveColor: string;
}

interface ThemeImages {
  logo: any;
}

interface ThemeContextType {
  theme: ThemeMode;
  colors: ThemeColors;
  images: ThemeImages;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  themeOpacity: Animated.Value;
  isTransitioning: boolean;
}

const lightTheme: ThemeColors = {
  background: '#FFFFFF',
  backgroundAlt: '#F7F7F7',
  card: '#FBFBFB',
  brandPrimary: '#A40028',
  gradientStart: '#A40028',
  gradientEnd: '#A40028',
  highlight: '#A40028',
  text: '#000000',
  textSecondary: '#505050',
  placeholder: '#A0A0A0',
  border: '#D4D4D4',
  divider: '#E5E5E5',
  statusBarStyle: 'dark',
  tabIconColor: '#000000',
  tabIconActiveColor: '#A40028',
};

const darkTheme: ThemeColors = {
  background: '#000000',
  backgroundAlt: '#0A0A0A',
  card: '#161616',
  brandPrimary: '#A40028',
  gradientStart: '#A40028',
  gradientEnd: '#A40028',
  highlight: '#A40028',
  text: '#FFFFFF',
  textSecondary: '#DADADA',
  placeholder: '#888888',
  border: '#2A2A2A',
  divider: '#2A2A2A',
  statusBarStyle: 'light',
  tabIconColor: '#FFFFFF',
  tabIconActiveColor: '#A40028',
};

const lightImages: ThemeImages = {
  logo: require('@/assets/images/86a2dea9-db4b-404b-b353-38433ace329f.png'), // LOGO-LIGHT-THEME.png (black ROAST)
};

const darkImages: ThemeImages = {
  logo: require('@/assets/images/eb4234cd-94d4-45c6-9b52-1dde651790e0.png'), // NEW LOGO-DARK-THEME.png (LIVE badge logo)
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@roastlive_theme';
const THEME_TRANSITION_DURATION = 500; // 500ms fade animation

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const themeOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let mounted = true;

    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (mounted) {
          if (savedTheme === 'light' || savedTheme === 'dark') {
            setThemeState(savedTheme);
            console.log('✅ Theme loaded from storage:', savedTheme);
          } else {
            console.log('ℹ️ No saved theme, using default: light');
          }
        }
      } catch (error) {
        console.error('❌ Error loading theme:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadTheme();

    return () => {
      mounted = false;
    };
  }, []);

  const saveTheme = async (newTheme: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      console.log('✅ Theme saved to storage:', newTheme);
    } catch (error) {
      console.error('❌ Error saving theme:', error);
    }
  };

  const setTheme = (newTheme: ThemeMode) => {
    if (theme === newTheme) return;

    console.log('🎨 Theme changing to:', newTheme);
    setIsTransitioning(true);

    // Fade out animation
    Animated.timing(themeOpacity, {
      toValue: 0,
      duration: THEME_TRANSITION_DURATION / 2,
      useNativeDriver: true,
    }).start(() => {
      // Change theme at the midpoint
      setThemeState(newTheme);
      saveTheme(newTheme);

      // Fade in animation
      Animated.timing(themeOpacity, {
        toValue: 1,
        duration: THEME_TRANSITION_DURATION / 2,
        useNativeDriver: true,
      }).start(() => {
        setIsTransitioning(false);
      });
    });
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const colors = theme === 'light' ? lightTheme : darkTheme;
  const images = theme === 'light' ? lightImages : darkImages;

  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, colors, images, toggleTheme, setTheme, themeOpacity, isTransitioning }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}