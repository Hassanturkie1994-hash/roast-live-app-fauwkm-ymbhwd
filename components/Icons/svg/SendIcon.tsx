
import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
}

export default function SendIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z"
        fill={color}
      />
    </Svg>
  );
}