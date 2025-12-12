
import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
}

export default function GridIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 11H10V5H4V11ZM4 19H10V13H4V19ZM12 19H18V13H12V19ZM12 5V11H18V5H12Z"
        fill={color}
      />
    </Svg>
  );
}