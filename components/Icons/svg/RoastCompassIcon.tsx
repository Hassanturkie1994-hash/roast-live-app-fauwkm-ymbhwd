
import React from 'react';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Filter, FeGaussianBlur, FeMerge, FeMergeNode } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
  theme?: 'light' | 'dark';
}

export default function RoastCompassIcon({ size, color, theme = 'dark' }: IconProps) {
  const glowColor = theme === 'dark' ? '#E30052' : '#A40028';
  
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Defs>
        <LinearGradient id="compassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#A40028" stopOpacity="1" />
          <Stop offset="100%" stopColor="#E30052" stopOpacity="1" />
        </LinearGradient>
        <Filter id="compassGlow">
          <FeGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <FeMerge>
            <FeMergeNode in="coloredBlur"/>
            <FeMergeNode in="SourceGraphic"/>
          </FeMerge>
        </Filter>
      </Defs>
      
      {/* Outer circle */}
      <Circle
        cx="16"
        cy="16"
        r="13"
        fill="none"
        stroke="url(#compassGradient)"
        strokeWidth="2"
        filter="url(#compassGlow)"
      />
      
      {/* Compass needle */}
      <Path
        d="M16 6L10 20L16 17L22 20L16 6Z"
        fill="url(#compassGradient)"
        filter="url(#compassGlow)"
      />
      
      {/* Center dot */}
      <Circle
        cx="16"
        cy="16"
        r="2"
        fill={glowColor}
      />
    </Svg>
  );
}