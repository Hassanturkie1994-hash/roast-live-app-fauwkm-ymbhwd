
import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
}

export default function ChevronRightIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10 6L8.59 7.41L13.17 12L8.59 16.59L10 18L16 12L10 6Z"
        fill={color}
      />
    </Svg>
  );
}