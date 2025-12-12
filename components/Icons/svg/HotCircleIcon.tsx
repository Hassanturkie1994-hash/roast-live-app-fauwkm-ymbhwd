
import React from 'react';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Filter, FeGaussianBlur, FeMerge, FeMergeNode } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
  theme?: 'light' | 'dark';
}

export default function HotCircleIcon({ size, color, theme = 'dark' }: IconProps) {
  const glowColor = theme === 'dark' ? '#FF6B35' : '#A40028';
  
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Defs>
        <LinearGradient id="hotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FF6B35" stopOpacity="1" />
          <Stop offset="50%" stopColor="#F7931E" stopOpacity="1" />
          <Stop offset="100%" stopColor="#FDC830" stopOpacity="1" />
        </LinearGradient>
        <Filter id="hotGlow">
          <FeGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <FeMerge>
            <FeMergeNode in="coloredBlur"/>
            <FeMergeNode in="SourceGraphic"/>
          </FeMerge>
        </Filter>
      </Defs>
      
      {/* Outer ring */}
      <Circle cx="16" cy="16" r="13" fill="none" stroke="url(#hotGradient)" strokeWidth="2.5" filter="url(#hotGlow)" />
      
      {/* Inner ring */}
      <Circle cx="16" cy="16" r="9" fill="none" stroke="url(#hotGradient)" strokeWidth="2" opacity="0.6" />
      
      {/* Flame in center */}
      <Path d="M16 8C16 8 13 13 13 15.5C13 17.4 14.3 19 16 19C17.7 19 19 17.4 19 15.5C19 13 16 8 16 8Z" fill="url(#hotGradient)" filter="url(#hotGlow)" />
      
      {/* Heat waves */}
      <Path d="M16 4C16 4 15 5 15 5.5C15 5.8 15.2 6 15.5 6C15.8 6 16 5.8 16 5.5C16 5 16 4 16 4Z" fill="#FDC830" opacity="0.8" />
      <Path d="M10 8C10 8 9 9 9 9.5C9 9.8 9.2 10 9.5 10C9.8 10 10 9.8 10 9.5C10 9 10 8 10 8Z" fill="#FDC830" opacity="0.8" />
      <Path d="M22 8C22 8 21 9 21 9.5C21 9.8 21.2 10 21.5 10C21.8 10 22 9.8 22 9.5C22 9 22 8 22 8Z" fill="#FDC830" opacity="0.8" />
    </Svg>
  );
}