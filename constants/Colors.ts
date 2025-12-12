
/**
 * Colors constants for the app
 * This file provides backward compatibility for components that import from @/constants/Colors
 * New code should use useTheme() hook from ThemeContext instead
 */

export const Colors = {
  light: {
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
  },
  dark: {
    background: '#000000',
    backgroundAlt: '#1A1A1A',
    card: '#1E1E1E',
    brandPrimary: '#A40028',
    gradientStart: '#A40028',
    gradientEnd: '#A40028',
    highlight: '#A40028',
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
    placeholder: '#606060',
    border: '#2A2A2A',
    divider: '#252525',
  },
};

export default Colors;
