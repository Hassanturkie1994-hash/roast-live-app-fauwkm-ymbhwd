
import React from 'react';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Filter, FeGaussianBlur, FeMerge, FeMergeNode, Ellipse } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
  theme?: 'light' | 'dark';
}

export default function SpotlightPersonIcon({ size, color, theme = 'dark' }: IconProps) {
  const glowColor = theme === 'dark' ? '#FDC830' : '#F7931E';
  
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Defs>
        <LinearGradient id="spotlightGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FDC830" stopOpacity="1" />
          <Stop offset="100%" stopColor="#F7931E" stopOpacity="1" />
        </LinearGradient>
        <Filter id="spotlightGlow">
          <FeGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <FeMerge>
            <FeMergeNode in="coloredBlur"/>
            <FeMergeNode in="SourceGraphic"/>
          </FeMerge>
        </Filter>
      </Defs>
      
      {/* Spotlight beam */}
      <Ellipse cx="16" cy="28" rx="12" ry="3" fill={glowColor} opacity="0.3" />
      <Path d="M16 4L8 28H24L16 4Z" fill={glowColor} opacity="0.2" />
      
      {/* Person */}
      <Circle cx="16" cy="12" r="4" fill="url(#spotlightGradient)" filter="url(#spotlightGlow)" />
      <Path d="M16 17C12 17 8 18.5 8 21V24H24V21C24 18.5 20 17 16 17Z" fill="url(#spotlightGradient)" filter="url(#spotlightGlow)" />
    </Svg>
  );
}