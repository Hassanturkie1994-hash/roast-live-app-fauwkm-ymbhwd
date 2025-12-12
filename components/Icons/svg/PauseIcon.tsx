
import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
}

export default function PauseIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 19H10V5H6V19ZM14 5V19H18V5H14Z"
        fill={color}
      />
    </Svg>
  );
}