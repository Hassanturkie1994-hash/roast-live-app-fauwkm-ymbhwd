
import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop, Filter, FeGaussianBlur, FeMerge, FeMergeNode } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
  theme?: 'light' | 'dark';
}

export default function CrownFlameIcon({ size, color, theme = 'dark' }: IconProps) {
  const glowColor = theme === 'dark' ? '#FDC830' : '#F7931E';
  
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Defs>
        <LinearGradient id="crownGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FDC830" stopOpacity="1" />
          <Stop offset="100%" stopColor="#F7931E" stopOpacity="1" />
        </LinearGradient>
        <Filter id="crownGlow">
          <FeGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <FeMerge>
            <FeMergeNode in="coloredBlur"/>
            <FeMergeNode in="SourceGraphic"/>
          </FeMerge>
        </Filter>
      </Defs>
      
      {/* Crown base */}
      <Path
        d="M4 24H28V26H4V24Z"
        fill="url(#crownGradient)"
        filter="url(#crownGlow)"
        strokeWidth="1"
        stroke={glowColor}
      />
      
      {/* Crown points */}
      <Path
        d="M6 10L10 16L16 8L22 16L26 10V24H6V10Z"
        fill="url(#crownGradient)"
        filter="url(#crownGlow)"
        strokeWidth="1.5"
        stroke={glowColor}
        strokeLinejoin="round"
      />
      
      {/* Flame accents on points */}
      <Path d="M6 8C6 8 5 10 5 11C5 11.6 5.4 12 6 12C6.6 12 7 11.6 7 11C7 10 6 8 6 8Z" fill="#FF6B35" />
      <Path d="M16 6C16 6 15 8 15 9C15 9.6 15.4 10 16 10C16.6 10 17 9.6 17 9C17 8 16 6 16 6Z" fill="#FF6B35" />
      <Path d="M26 8C26 8 25 10 25 11C25 11.6 25.4 12 26 12C26.6 12 27 11.6 27 11C27 10 26 8 26 8Z" fill="#FF6B35" />
    </Svg>
  );
}