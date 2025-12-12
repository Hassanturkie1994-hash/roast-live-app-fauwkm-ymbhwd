
import React from 'react';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Filter, FeGaussianBlur, FeMerge, FeMergeNode } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
  theme?: 'light' | 'dark';
}

export default function HeatedGearIcon({ size, color, theme = 'dark' }: IconProps) {
  const glowColor = theme === 'dark' ? '#E30052' : '#A40028';
  
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Defs>
        <LinearGradient id="gearGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#A40028" stopOpacity="1" />
          <Stop offset="100%" stopColor="#E30052" stopOpacity="1" />
        </LinearGradient>
        <Filter id="gearGlow">
          <FeGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <FeMerge>
            <FeMergeNode in="coloredBlur"/>
            <FeMergeNode in="SourceGraphic"/>
          </FeMerge>
        </Filter>
      </Defs>
      
      {/* Gear teeth */}
      <Path
        d="M19 4H13L12 7H20L19 4ZM28 13V19L25 20V12L28 13ZM19 28H13L12 25H20L19 28ZM4 19V13L7 12V20L4 19ZM22 7L25 10L23 12L20 9L22 7ZM10 7L7 10L9 12L12 9L10 7ZM22 25L25 22L23 20L20 23L22 25ZM10 25L7 22L9 20L12 23L10 25Z"
        fill="url(#gearGradient)"
        filter="url(#gearGlow)"
        strokeWidth="1"
        stroke={glowColor}
      />
      
      {/* Center circle */}
      <Circle cx="16" cy="16" r="6" fill="url(#gearGradient)" filter="url(#gearGlow)" stroke={glowColor} strokeWidth="1.5" />
      
      {/* Inner circle */}
      <Circle cx="16" cy="16" r="3" fill="#FDC830" />
    </Svg>
  );
}