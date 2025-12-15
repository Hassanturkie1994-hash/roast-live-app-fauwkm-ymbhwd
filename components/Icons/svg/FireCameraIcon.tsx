
import React from 'react';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
  theme?: 'light' | 'dark';
}

export default function FireCameraIcon({ size, color, theme = 'dark' }: IconProps) {
  const gradientStart = theme === 'dark' ? '#FF6B35' : '#E03052';
  const gradientEnd = theme === 'dark' ? '#FDC830' : '#A40028';
  
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Defs>
        <LinearGradient id={`cameraGradient-${theme}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={gradientStart} stopOpacity="1" />
          <Stop offset="100%" stopColor={gradientEnd} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      
      {/* Camera body */}
      <Path
        d="M9 8L11 5H21L23 8H28C29.1 8 30 8.9 30 10V26C30 27.1 29.1 28 28 28H4C2.9 28 2 27.1 2 26V10C2 8.9 2.9 8 4 8H9Z"
        fill={`url(#cameraGradient-${theme})`}
        strokeWidth="1.5"
        stroke={color}
        strokeOpacity="0.3"
      />
      
      {/* Camera lens */}
      <Circle
        cx="16"
        cy="18"
        r="6"
        fill="none"
        stroke={color}
        strokeWidth="2"
      />
      
      {/* Flame accent */}
      <Path
        d="M16 12C16 12 15 14 15 15C15 15.6 15.4 16 16 16C16.6 16 17 15.6 17 15C17 14 16 12 16 12Z"
        fill={gradientEnd}
        opacity="0.9"
      />
    </Svg>
  );
}
