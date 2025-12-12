
import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export default function VIPDiamondFlameIcon({ size = 24, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 3H5L2 9l10 12L22 9l-3-6zM9.62 8l1.5-3h1.76l1.5 3H9.62zM11 10h2v7l-1 1-1-1v-7z" fill={color} />
    </Svg>
  );
}
