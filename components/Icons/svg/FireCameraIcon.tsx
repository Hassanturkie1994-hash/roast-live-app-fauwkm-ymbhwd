
import React from 'react';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Filter, FeGaussianBlur, FeMerge, FeMergeNode } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
  theme?: 'light' | 'dark';
}

export default function FireCameraIcon({ size, color, theme = 'dark' }: IconProps) {
  const glowColor = theme === 'dark' ? '#FF6B35' : '#A40028';
  
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Defs>
        <LinearGradient id="cameraGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FF6B35" stopOpacity="1" />
          <Stop offset="50%" stopColor="#F7931E" stopOpacity="1" />
          <Stop offset="100%" stopColor="#FDC830" stopOpacity="1" />
        </LinearGradient>
        <Filter id="cameraGlow">
          <FeGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <FeMerge>
            <FeMergeNode in="coloredBlur"/>
            <FeMergeNode in="SourceGraphic"/>
          </FeMerge>
        </Filter>
      </Defs>
      
      {/* Camera body */}
      <Path
        d="M12 4L10 7H5C3.9 7 3 7.9 3 9V25C3 26.1 3.9 27 5 27H27C28.1 27 29 26.1 29 25V9C29 7.9 28.1 7 27 7H22L20 4H12Z"
        fill="url(#cameraGradient)"
        filter="url(#cameraGlow)"
        strokeWidth="1.5"
        stroke={glowColor}
        strokeLinejoin="round"
      />
      
      {/* Lens */}
      <Circle
        cx="16"
        cy="17"
        r="6"
        fill="none"
        stroke="#FDC830"
        strokeWidth="2"
      />
      
      {/* Flame accent */}
      <Path
        d="M26 10C26 10 25 12 25 13C25 13.6 25.4 14 26 14C26.6 14 27 13.6 27 13C27 12 26 10 26 10Z"
        fill="#FDC830"
        opacity="0.9"
      />
    </Svg>
  );
}