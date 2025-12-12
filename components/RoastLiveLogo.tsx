
import React from 'react';
import { ViewStyle } from 'react-native';
import AppLogo from './AppLogo';

interface RoastLiveLogoProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  style?: ViewStyle;
  opacity?: number;
  withShadow?: boolean;
}

/**
 * @deprecated Use AppLogo component instead for better flexibility
 * This component is kept for backward compatibility
 */
export default function RoastLiveLogo({ 
  size = 'medium', 
  style, 
  opacity = 1,
  withShadow = false 
}: RoastLiveLogoProps) {
  return (
    <AppLogo
      size={size}
      style={style}
      opacity={opacity}
      alignment="center"
      withShadow={withShadow}
    />
  );
}
