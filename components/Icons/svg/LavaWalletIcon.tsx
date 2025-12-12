
import React from 'react';
import Svg, { Path, Rect, Defs, LinearGradient, Stop, Filter, FeGaussianBlur, FeMerge, FeMergeNode } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
  theme?: 'light' | 'dark';
}

export default function LavaWalletIcon({ size, color, theme = 'dark' }: IconProps) {
  const glowColor = theme === 'dark' ? '#FF6B35' : '#A40028';
  
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Defs>
        <LinearGradient id="walletGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FF6B35" stopOpacity="1" />
          <Stop offset="50%" stopColor="#F7931E" stopOpacity="1" />
          <Stop offset="100%" stopColor="#FDC830" stopOpacity="1" />
        </LinearGradient>
        <Filter id="walletGlow">
          <FeGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <FeMerge>
            <FeMergeNode in="coloredBlur"/>
            <FeMergeNode in="SourceGraphic"/>
          </FeMerge>
        </Filter>
      </Defs>
      
      {/* Wallet body */}
      <Rect x="4" y="8" width="24" height="18" rx="2" fill="url(#walletGradient)" filter="url(#walletGlow)" strokeWidth="1.5" stroke={glowColor} />
      
      {/* Card slot */}
      <Rect x="7" y="12" width="18" height="3" rx="1" fill="#FDC830" opacity="0.6" />
      
      {/* Lava drips */}
      <Path d="M12 26C12 26 11 28 11 29C11 29.6 11.4 30 12 30C12.6 30 13 29.6 13 29C13 28 12 26 12 26Z" fill="#FF6B35" opacity="0.9" />
      <Path d="M20 26C20 26 19 28 19 29C19 29.6 19.4 30 20 30C20.6 30 21 29.6 21 29C21 28 20 26 20 26Z" fill="#F7931E" opacity="0.9" />
      
      {/* Money symbol */}
      <Path d="M16 16C17.1 16 18 16.9 18 18C18 19.1 17.1 20 16 20C14.9 20 14 19.1 14 18C14 16.9 14.9 16 16 16Z" fill="#FDC830" />
    </Svg>
  );
}