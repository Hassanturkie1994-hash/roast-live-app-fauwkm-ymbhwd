
import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
  theme?: 'light' | 'dark';
}

export default function SmokeMessageIcon({ size, color, theme = 'dark' }: IconProps) {
  const gradientStart = theme === 'dark' ? '#FF6B35' : '#E03052';
  const gradientEnd = theme === 'dark' ? '#FDC830' : '#A40028';
  
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Defs>
        <LinearGradient id={`messageGradient-${theme}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={gradientStart} stopOpacity="1" />
          <Stop offset="100%" stopColor={gradientEnd} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      
      {/* Message bubble */}
      <Path
        d="M28 4H4C2.9 4 2 4.9 2 6V22C2 23.1 2.9 24 4 24H8L12 28L16 24H28C29.1 24 30 23.1 30 22V6C30 4.9 29.1 4 28 4Z"
        fill={`url(#messageGradient-${theme})`}
        strokeWidth="1.5"
        stroke={color}
        strokeOpacity="0.3"
      />
      
      {/* Smoke/heat waves inside */}
      <Path
        d="M8 10C8 10 10 8 12 10C14 12 14 10 16 10C18 10 18 12 20 10C22 8 24 10 24 10"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
      
      <Path
        d="M8 16C8 16 10 14 12 16C14 18 14 16 16 16C18 16 18 18 20 16C22 14 24 16 24 16"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
    </Svg>
  );
}
