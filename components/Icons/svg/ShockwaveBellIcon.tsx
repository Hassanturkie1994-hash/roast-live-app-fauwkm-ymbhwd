
import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
  theme?: 'light' | 'dark';
}

export default function ShockwaveBellIcon({ size, color, theme = 'dark' }: IconProps) {
  const gradientStart = theme === 'dark' ? '#FF6B35' : '#E03052';
  const gradientEnd = theme === 'dark' ? '#FDC830' : '#A40028';
  
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Defs>
        <LinearGradient id={`bellGradient-${theme}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={gradientStart} stopOpacity="1" />
          <Stop offset="100%" stopColor={gradientEnd} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      
      {/* Shockwave rings */}
      <Path
        d="M8 10C8 6 11.6 2.5 16 2.5C20.4 2.5 24 6 24 10"
        fill="none"
        stroke={gradientStart}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      
      <Path
        d="M5 10C5 4.5 9.9 0 16 0C22.1 0 27 4.5 27 10"
        fill="none"
        stroke={gradientStart}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.3"
      />
      
      {/* Bell body */}
      <Path
        d="M16 6C13.8 6 12 7.8 12 10V18L9 21V23H23V21L20 18V10C20 7.8 18.2 6 16 6Z"
        fill={`url(#bellGradient-${theme})`}
        strokeWidth="1.5"
        stroke={color}
        strokeOpacity="0.3"
      />
      
      {/* Bell clapper */}
      <Path
        d="M14 26C14 27.1 14.9 28 16 28C17.1 28 18 27.1 18 26"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}
