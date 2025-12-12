
import React from 'react';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Filter, FeGaussianBlur, FeMerge, FeMergeNode } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
  theme?: 'light' | 'dark';
}

export default function CrowdFlameIcon({ size, color, theme = 'dark' }: IconProps) {
  const glowColor = theme === 'dark' ? '#FF6B35' : '#A40028';
  
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Defs>
        <LinearGradient id="crowdGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FF6B35" stopOpacity="1" />
          <Stop offset="50%" stopColor="#F7931E" stopOpacity="1" />
          <Stop offset="100%" stopColor="#FDC830" stopOpacity="1" />
        </LinearGradient>
        <Filter id="crowdGlow">
          <FeGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <FeMerge>
            <FeMergeNode in="coloredBlur"/>
            <FeMergeNode in="SourceGraphic"/>
          </FeMerge>
        </Filter>
      </Defs>
      
      {/* Three people silhouettes */}
      <Circle cx="10" cy="10" r="3" fill="url(#crowdGradient)" filter="url(#crowdGlow)" />
      <Path d="M10 14C7 14 4 15 4 17V19H16V17C16 15 13 14 10 14Z" fill="url(#crowdGradient)" filter="url(#crowdGlow)" />
      
      <Circle cx="22" cy="10" r="3" fill="url(#crowdGradient)" filter="url(#crowdGlow)" />
      <Path d="M22 14C19 14 16 15 16 17V19H28V17C28 15 25 14 22 14Z" fill="url(#crowdGradient)" filter="url(#crowdGlow)" />
      
      <Circle cx="16" cy="7" r="3.5" fill="url(#crowdGradient)" filter="url(#crowdGlow)" />
      <Path d="M16 11.5C12.5 11.5 9 12.8 9 15V17.5H23V15C23 12.8 19.5 11.5 16 11.5Z" fill="url(#crowdGradient)" filter="url(#crowdGlow)" />
      
      {/* Flame accents */}
      <Path d="M16 22C16 22 14.5 24 14.5 25C14.5 25.8 15.2 26.5 16 26.5C16.8 26.5 17.5 25.8 17.5 25C17.5 24 16 22 16 22Z" fill="#FDC830" opacity="0.9" />
    </Svg>
  );
}