
import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop, Filter, FeGaussianBlur, FeMerge, FeMergeNode } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
  theme?: 'light' | 'dark';
}

export default function VIPDiamondFlameIcon({ size, color, theme = 'dark' }: IconProps) {
  const glowColor = theme === 'dark' ? '#9D4EDD' : '#7209B7';
  
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Defs>
        <LinearGradient id="vipGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#7209B7" stopOpacity="1" />
          <Stop offset="50%" stopColor="#9D4EDD" stopOpacity="1" />
          <Stop offset="100%" stopColor="#C77DFF" stopOpacity="1" />
        </LinearGradient>
        <Filter id="vipGlow">
          <FeGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <FeMerge>
            <FeMergeNode in="coloredBlur"/>
            <FeMergeNode in="SourceGraphic"/>
          </FeMerge>
        </Filter>
      </Defs>
      
      {/* Diamond shape */}
      <Path
        d="M16 4L6 12L16 28L26 12L16 4Z"
        fill="url(#vipGradient)"
        filter="url(#vipGlow)"
        strokeWidth="1.5"
        stroke={glowColor}
        strokeLinejoin="round"
      />
      
      {/* Diamond facets */}
      <Path d="M16 4L10 12H22L16 4Z" fill="#C77DFF" opacity="0.6" />
      <Path d="M10 12L16 28L22 12H10Z" fill="#9D4EDD" opacity="0.4" />
      
      {/* Flame accents */}
      <Path d="M16 2C16 2 14.5 4 14.5 5C14.5 5.6 15 6 15.5 6C16 6 16.5 5.6 16.5 5C16.5 4 16 2 16 2Z" fill="#FDC830" />
      <Path d="M10 10C10 10 9 11 9 11.5C9 11.8 9.2 12 9.5 12C9.8 12 10 11.8 10 11.5C10 11 10 10 10 10Z" fill="#FF6B35" opacity="0.8" />
      <Path d="M22 10C22 10 21 11 21 11.5C21 11.8 21.2 12 21.5 12C21.8 12 22 11.8 22 11.5C22 11 22 10 22 10Z" fill="#FF6B35" opacity="0.8" />
    </Svg>
  );
}