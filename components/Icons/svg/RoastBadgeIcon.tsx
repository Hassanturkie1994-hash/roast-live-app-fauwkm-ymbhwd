
import React from 'react';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
  theme?: 'light' | 'dark';
}

export default function RoastBadgeIcon({ size, color, theme = 'dark' }: IconProps) {
  const gradientStart = theme === 'dark' ? '#FF6B35' : '#E03052';
  const gradientEnd = theme === 'dark' ? '#FDC830' : '#A40028';
  
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Defs>
        <LinearGradient id={`badgeGradient-${theme}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={gradientStart} stopOpacity="1" />
          <Stop offset="100%" stopColor={gradientEnd} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      
      {/* Badge/Shield shape */}
      <Path
        d="M16 2L6 6V12C6 19 10 25 16 28C22 25 26 19 26 12V6L16 2Z"
        fill={`url(#badgeGradient-${theme})`}
        strokeWidth="1.5"
        stroke={color}
        strokeOpacity="0.3"
      />
      
      {/* Person silhouette */}
      <Circle
        cx="16"
        cy="12"
        r="3.5"
        fill={color}
        opacity="0.9"
      />
      
      <Path
        d="M10 22C10 19 12.7 17 16 17C19.3 17 22 19 22 22"
        fill={color}
        opacity="0.9"
      />
    </Svg>
  );
}
