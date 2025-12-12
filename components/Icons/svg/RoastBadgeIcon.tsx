
import React from 'react';
import Svg, { Path, Polygon, Defs, LinearGradient, Stop, Filter, FeGaussianBlur, FeMerge, FeMergeNode } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
  theme?: 'light' | 'dark';
}

export default function RoastBadgeIcon({ size, color, theme = 'dark' }: IconProps) {
  const glowColor = theme === 'dark' ? '#E30052' : '#A40028';
  
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Defs>
        <LinearGradient id="badgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#A40028" stopOpacity="1" />
          <Stop offset="100%" stopColor="#E30052" stopOpacity="1" />
        </LinearGradient>
        <Filter id="badgeGlow">
          <FeGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <FeMerge>
            <FeMergeNode in="coloredBlur"/>
            <FeMergeNode in="SourceGraphic"/>
          </FeMerge>
        </Filter>
      </Defs>
      
      {/* Badge shield */}
      <Path
        d="M16 3L4 8V14C4 21 9 27 16 29C23 27 28 21 28 14V8L16 3Z"
        fill="url(#badgeGradient)"
        filter="url(#badgeGlow)"
        strokeWidth="1.5"
        stroke={glowColor}
        strokeLinejoin="round"
      />
      
      {/* Person silhouette */}
      <Path
        d="M16 12C17.7 12 19 10.7 19 9C19 7.3 17.7 6 16 6C14.3 6 13 7.3 13 9C13 10.7 14.3 12 16 12ZM16 14C13.3 14 8 15.3 8 18V20H24V18C24 15.3 18.7 14 16 14Z"
        fill="#FDC830"
      />
    </Svg>
  );
}