
import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop, Filter, FeGaussianBlur, FeMerge, FeMergeNode } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
  theme?: 'light' | 'dark';
}

export default function FlameHomeIcon({ size, color, theme = 'dark' }: IconProps) {
  const glowColor = theme === 'dark' ? '#FF6B35' : '#A40028';
  
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Defs>
        <LinearGradient id="flameGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FF6B35" stopOpacity="1" />
          <Stop offset="50%" stopColor="#F7931E" stopOpacity="1" />
          <Stop offset="100%" stopColor="#FDC830" stopOpacity="1" />
        </LinearGradient>
        <Filter id="glow">
          <FeGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <FeMerge>
            <FeMergeNode in="coloredBlur"/>
            <FeMergeNode in="SourceGraphic"/>
          </FeMerge>
        </Filter>
      </Defs>
      
      {/* House base */}
      <Path
        d="M16 4L4 14V28H12V20H20V28H28V14L16 4Z"
        fill="url(#flameGradient)"
        filter="url(#glow)"
        strokeWidth="1.5"
        stroke={glowColor}
        strokeLinejoin="round"
      />
      
      {/* Flame accent on roof */}
      <Path
        d="M16 2C16 2 14 6 14 8C14 9.1 14.9 10 16 10C17.1 10 18 9.1 18 8C18 6 16 2 16 2Z"
        fill="#FDC830"
        opacity="0.9"
      />
    </Svg>
  );
}