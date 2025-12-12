
import React from 'react';
import Svg, { Path, Rect, Circle, Defs, LinearGradient, Stop, Filter, FeGaussianBlur, FeMerge, FeMergeNode } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
  theme?: 'light' | 'dark';
}

export default function BurnedPhotoIcon({ size, color, theme = 'dark' }: IconProps) {
  const glowColor = theme === 'dark' ? '#FF6B35' : '#A40028';
  
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Defs>
        <LinearGradient id="photoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#A40028" stopOpacity="1" />
          <Stop offset="100%" stopColor="#E30052" stopOpacity="1" />
        </LinearGradient>
        <Filter id="photoGlow">
          <FeGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <FeMerge>
            <FeMergeNode in="coloredBlur"/>
            <FeMergeNode in="SourceGraphic"/>
          </FeMerge>
        </Filter>
      </Defs>
      
      {/* Photo frame */}
      <Rect x="4" y="6" width="24" height="20" rx="2" fill="url(#photoGradient)" filter="url(#photoGlow)" strokeWidth="1.5" stroke={glowColor} />
      
      {/* Mountain/landscape */}
      <Path d="M4 22L10 14L16 20L22 12L28 18V24C28 25.1 27.1 26 26 26H6C4.9 26 4 25.1 4 24V22Z" fill="#FDC830" opacity="0.7" />
      
      {/* Sun/moon */}
      <Circle cx="22" cy="12" r="3" fill="#FDC830" />
      
      {/* Burn marks (flame accents) */}
      <Path d="M26 28C26 28 25 29 25 29.5C25 29.8 25.2 30 25.5 30C25.8 30 26 29.8 26 29.5C26 29 26 28 26 28Z" fill="#FF6B35" opacity="0.9" />
      <Path d="M8 28C8 28 7 29 7 29.5C7 29.8 7.2 30 7.5 30C7.8 30 8 29.8 8 29.5C8 29 8 28 8 28Z" fill="#FF6B35" opacity="0.9" />
    </Svg>
  );
}