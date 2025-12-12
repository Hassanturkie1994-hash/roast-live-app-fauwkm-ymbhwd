
import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop, Filter, FeGaussianBlur, FeMerge, FeMergeNode } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
  theme?: 'light' | 'dark';
}

export default function PremiumStarFlameIcon({ size, color, theme = 'dark' }: IconProps) {
  const glowColor = theme === 'dark' ? '#FDC830' : '#F7931E';
  
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Defs>
        <LinearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FDC830" stopOpacity="1" />
          <Stop offset="50%" stopColor="#F7931E" stopOpacity="1" />
          <Stop offset="100%" stopColor="#FF6B35" stopOpacity="1" />
        </LinearGradient>
        <Filter id="starGlow">
          <FeGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <FeMerge>
            <FeMergeNode in="coloredBlur"/>
            <FeMergeNode in="SourceGraphic"/>
          </FeMerge>
        </Filter>
      </Defs>
      
      {/* Star */}
      <Path
        d="M16 2L19.5 12H30L21.5 18.5L25 28.5L16 22L7 28.5L10.5 18.5L2 12H12.5L16 2Z"
        fill="url(#starGradient)"
        filter="url(#starGlow)"
        strokeWidth="1.5"
        stroke={glowColor}
        strokeLinejoin="round"
      />
      
      {/* Inner star highlight */}
      <Path
        d="M16 8L17.5 13H22L18.5 15.5L20 20L16 17L12 20L13.5 15.5L10 13H14.5L16 8Z"
        fill="#FDC830"
        opacity="0.8"
      />
      
      {/* Flame wisps */}
      <Path d="M16 1C16 1 15 2 15 2.5C15 2.8 15.2 3 15.5 3C15.8 3 16 2.8 16 2.5C16 2 16 1 16 1Z" fill="#FF6B35" />
      <Path d="M12 4C12 4 11 5 11 5.5C11 5.8 11.2 6 11.5 6C11.8 6 12 5.8 12 5.5C12 5 12 4 12 4Z" fill="#F7931E" opacity="0.8" />
      <Path d="M20 4C20 4 19 5 19 5.5C19 5.8 19.2 6 19.5 6C19.8 6 20 5.8 20 5.5C20 5 20 4 20 4Z" fill="#F7931E" opacity="0.8" />
    </Svg>
  );
}