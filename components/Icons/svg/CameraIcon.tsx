
import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
}

export default function CameraIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 2L7.17 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4H16.83L15 2H9Z"
        fill={color}
      />
      <Circle cx="12" cy="12" r="3.5" fill="white" />
    </Svg>
  );
}