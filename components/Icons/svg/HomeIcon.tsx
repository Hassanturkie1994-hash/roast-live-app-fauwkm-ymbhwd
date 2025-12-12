
import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
}

export default function HomeIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z"
        fill={color}
      />
    </Svg>
  );
}