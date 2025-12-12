
import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
}

export default function PlayIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 5V19L19 12L8 5Z"
        fill={color}
      />
    </Svg>
  );
}