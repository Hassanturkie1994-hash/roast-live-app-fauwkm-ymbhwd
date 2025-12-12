
import React from 'react';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Filter, FeGaussianBlur, FeMerge, FeMergeNode } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
  theme?: 'light' | 'dark';
}

export default function ShockwaveBellIcon({ size, color, theme = 'dark' }: IconProps) {
  const glowColor = theme === 'dark' ? '#FF6B35' : '#A40028';
  
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Defs>
        <LinearGradient id="bellGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FF6B35" stopOpacity="1" />
          <Stop offset="100%" stopColor="#F7931E" stopOpacity="1" />
        </LinearGradient>
        <Filter id="bellGlow">
          <FeGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <FeMerge>
            <FeMergeNode in="coloredBlur"/>
            <FeMergeNode in="SourceGraphic"/>
          </FeMerge>
        </Filter>
      </Defs>
      
      {/* Shockwave rings */}
      <Circle cx="16" cy="14" r="14" fill="none" stroke={glowColor} strokeWidth="1" opacity="0.3" />
      <Circle cx="16" cy="14" r="11" fill="none" stroke={glowColor} strokeWidth="1" opacity="0.5" />
      
      {/* Bell body */}
      <Path
        d="M16 6C13.8 6 12 7.8 12 10V16L9 19V21H23V19L20 16V10C20 7.8 18.2 6 16 6ZM18 24C18 25.1 17.1 26 16 26C14.9 26 14 25.1 14 24"
        fill="url(#bellGradient)"
        filter="url(#bellGlow)"
        strokeWidth="1.5"
        stroke={glowColor}
        strokeLinejoin="round"
      />
    </Svg>
  );
}