
import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop, Filter, FeGaussianBlur, FeMerge, FeMergeNode } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
  theme?: 'light' | 'dark';
}

export default function ShieldFlameIcon({ size, color, theme = 'dark' }: IconProps) {
  const glowColor = theme === 'dark' ? '#E30052' : '#A40028';
  
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Defs>
        <LinearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#A40028" stopOpacity="1" />
          <Stop offset="100%" stopColor="#E30052" stopOpacity="1" />
        </LinearGradient>
        <Filter id="shieldGlow">
          <FeGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <FeMerge>
            <FeMergeNode in="coloredBlur"/>
            <FeMergeNode in="SourceGraphic"/>
          </FeMerge>
        </Filter>
      </Defs>
      
      {/* Shield */}
      <Path
        d="M16 3L4 8V14C4 21 9 27 16 29C23 27 28 21 28 14V8L16 3Z"
        fill="url(#shieldGradient)"
        filter="url(#shieldGlow)"
        strokeWidth="1.5"
        stroke={glowColor}
        strokeLinejoin="round"
      />
      
      {/* Flame in center */}
      <Path
        d="M16 10C16 10 13 14 13 16C13 17.7 14.3 19 16 19C17.7 19 19 17.7 19 16C19 14 16 10 16 10Z"
        fill="#FDC830"
      />
      
      {/* Inner flame */}
      <Path
        d="M16 13C16 13 14.5 15 14.5 16C14.5 16.8 15.2 17.5 16 17.5C16.8 17.5 17.5 16.8 17.5 16C17.5 15 16 13 16 13Z"
        fill="#FF6B35"
      />
    </Svg>
  );
}