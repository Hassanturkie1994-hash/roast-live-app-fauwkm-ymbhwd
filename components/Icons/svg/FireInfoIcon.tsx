
import React from 'react';
import { Svg, Path, Circle, Rect, Defs, LinearGradient, Stop, Filter, FeGaussianBlur, FeMerge, FeMergeNode } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
  theme?: 'light' | 'dark';
}

export default function FireInfoIcon({ size, color, theme = 'dark' }: IconProps) {
  const glowColor = theme === 'dark' ? '#FF6B35' : '#A40028';
  
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Defs>
        <LinearGradient id="infoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FF6B35" stopOpacity="1" />
          <Stop offset="100%" stopColor="#F7931E" stopOpacity="1" />
        </LinearGradient>
        <Filter id="infoGlow">
          <FeGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <FeMerge>
            <FeMergeNode in="coloredBlur"/>
            <FeMergeNode in="SourceGraphic"/>
          </FeMerge>
        </Filter>
      </Defs>
      
      {/* Circle */}
      <Circle cx="16" cy="16" r="13" fill="url(#infoGradient)" filter="url(#infoGlow)" strokeWidth="1.5" stroke={glowColor} />
      
      {/* i dot */}
      <Circle cx="16" cy="10" r="2" fill="#FDC830" />
      
      {/* i stem */}
      <Rect x="14" y="14" width="4" height="10" rx="1" fill="#FDC830" />
      
      {/* Flame accent */}
      <Path d="M16 26C16 26 14.5 28 14.5 29C14.5 29.6 15 30 15.5 30C16 30 16.5 29.6 16.5 29C16.5 28 16 26 16 26Z" fill="#FDC830" opacity="0.9" />
    </Svg>
  );
}