
import React from 'react';
import Svg, { Path, Rect, Defs, LinearGradient, Stop, Filter, FeGaussianBlur, FeMerge, FeMergeNode } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
  theme?: 'light' | 'dark';
}

export default function RoastGiftBoxIcon({ size, color, theme = 'dark' }: IconProps) {
  const glowColor = theme === 'dark' ? '#E30052' : '#A40028';
  
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Defs>
        <LinearGradient id="giftGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#A40028" stopOpacity="1" />
          <Stop offset="100%" stopColor="#E30052" stopOpacity="1" />
        </LinearGradient>
        <Filter id="giftGlow">
          <FeGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <FeMerge>
            <FeMergeNode in="coloredBlur"/>
            <FeMergeNode in="SourceGraphic"/>
          </FeMerge>
        </Filter>
      </Defs>
      
      {/* Gift box */}
      <Rect x="6" y="12" width="20" height="16" rx="1" fill="url(#giftGradient)" filter="url(#giftGlow)" strokeWidth="1.5" stroke={glowColor} />
      
      {/* Ribbon horizontal */}
      <Rect x="6" y="10" width="20" height="4" rx="1" fill="#FDC830" />
      
      {/* Ribbon vertical */}
      <Rect x="14" y="10" width="4" height="18" fill="#FDC830" opacity="0.8" />
      
      {/* Bow */}
      <Path d="M12 4C12 4 10 6 10 7C10 7.6 10.4 8 11 8C11.6 8 12 7.6 12 7C12 6 12 4 12 4Z" fill="#FF6B35" />
      <Path d="M20 4C20 4 18 6 18 7C18 7.6 18.4 8 19 8C19.6 8 20 7.6 20 7C20 6 20 4 20 4Z" fill="#FF6B35" />
      <Path d="M16 3C16 3 14 5 14 6C14 6.6 14.4 7 15 7H17C17.6 7 18 6.6 18 6C18 5 16 3 16 3Z" fill="#F7931E" />
    </Svg>
  );
}