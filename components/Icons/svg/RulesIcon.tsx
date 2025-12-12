
import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
}

export default function RulesIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16.54 11L13 7.46L14.41 6.05L16.54 8.18L20.77 3.95L22.18 5.36L16.54 11ZM11 7H2V9H11V7ZM21 13.41L19.59 12L17 14.59L14.41 12L13 13.41L15.59 16L13 18.59L14.41 20L17 17.41L19.59 20L21 18.59L18.41 16L21 13.41ZM11 15H2V17H11V15Z"
        fill={color}
      />
    </Svg>
  );
}