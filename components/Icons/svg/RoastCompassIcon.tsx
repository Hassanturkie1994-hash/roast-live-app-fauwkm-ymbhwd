
import React from 'react';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
  theme?: 'light' | 'dark';
}

export default function RoastCompassIcon({ size, color, theme = 'dark' }: IconProps) {
  const gradientStart = theme === 'dark' ? '#FF6B35' : '#E03052';
  const gradientEnd = theme === 'dark' ? '#FDC830' : '#A40028';
  
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Defs>
        <LinearGradient id={`compassGradient-${theme}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={gradientStart} stopOpacity="1" />
          <Stop offset="100%" stopColor={gradientEnd} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      
      {/* Compass circle */}
      <Circle
        cx="16"
        cy="16"
        r="13"
        fill="none"
        stroke={`url(#compassGradient-${theme})`}
        strokeWidth="2"
      />
      
      {/* Compass needle (North - flame colored) */}
      <Path
        d="M16 6L12 16L16 14L20 16L16 6Z"
        fill={`url(#compassGradient-${theme})`}
      />
      
      {/* Compass needle (South) */}
      <Path
        d="M16 26L20 16L16 18L12 16L16 26Z"
        fill={color}
        opacity="0.5"
      />
      
      {/* Center dot */}
      <Circle
        cx="16"
        cy="16"
        r="2"
        fill={gradientEnd}
      />
    </Svg>
  );
}
