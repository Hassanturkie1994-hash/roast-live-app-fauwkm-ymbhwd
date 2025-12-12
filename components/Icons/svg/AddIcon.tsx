
import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
}

export default function AddIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z"
        fill={color}
      />
    </Svg>
  );
}