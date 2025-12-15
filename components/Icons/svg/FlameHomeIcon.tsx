
import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
  theme?: 'light' | 'dark';
}

export default function FlameHomeIcon({ size, color, theme = 'dark' }: IconProps) {
  // Theme-aware gradient colors
  const gradientStart = theme === 'dark' ? '#FF6B35' : '#E03052';
  const gradientMid = theme === 'dark' ? '#F7931E' : '#C41E3A';
  const gradientEnd = theme === 'dark' ? '#FDC830' : '#A40028';
  
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Defs>
        <LinearGradient id={`flameGradient-${theme}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={gradientStart} stopOpacity="1" />
          <Stop offset="50%" stopColor={gradientMid} stopOpacity="1" />
          <Stop offset="100%" stopColor={gradientEnd} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      
      {/* House base with flame styling */}
      <Path
        d="M16 4L4 14V28H12V20H20V28H28V14L16 4Z"
        fill={`url(#flameGradient-${theme})`}
        strokeWidth="1.5"
        stroke={color}
        strokeOpacity="0.3"
        strokeLinejoin="round"
      />
      
      {/* Flame accent on roof */}
      <Path
        d="M16 2C16 2 14 6 14 8C14 9.1 14.9 10 16 10C17.1 10 18 9.1 18 8C18 6 16 2 16 2Z"
        fill={gradientEnd}
        opacity="0.9"
      />
    </Svg>
  );
}
