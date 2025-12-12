
import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop, Filter, FeGaussianBlur, FeMerge, FeMergeNode } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
  theme?: 'light' | 'dark';
}

export default function SmokeMessageIcon({ size, color, theme = 'dark' }: IconProps) {
  const glowColor = theme === 'dark' ? '#9D4EDD' : '#7209B7';
  
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Defs>
        <LinearGradient id="messageGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#7209B7" stopOpacity="1" />
          <Stop offset="50%" stopColor="#9D4EDD" stopOpacity="1" />
          <Stop offset="100%" stopColor="#C77DFF" stopOpacity="1" />
        </LinearGradient>
        <Filter id="messageGlow">
          <FeGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <FeMerge>
            <FeMergeNode in="coloredBlur"/>
            <FeMergeNode in="SourceGraphic"/>
          </FeMerge>
        </Filter>
      </Defs>
      
      {/* Message bubble */}
      <Path
        d="M28 4H4C2.9 4 2 4.9 2 6V22C2 23.1 2.9 24 4 24H8L12 28L16 24H28C29.1 24 30 23.1 30 22V6C30 4.9 29.1 4 28 4Z"
        fill="url(#messageGradient)"
        filter="url(#messageGlow)"
        strokeWidth="1.5"
        stroke={glowColor}
        strokeLinejoin="round"
      />
      
      {/* Smoke wisps */}
      <Path
        d="M8 11H24M8 15H20M8 19H16"
        stroke="#C77DFF"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.8"
      />
    </Svg>
  );
}