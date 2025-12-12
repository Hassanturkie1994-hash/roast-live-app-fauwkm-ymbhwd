
import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export default function CrowdFlameIcon({ size = 24, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M13.5 1C8.81 1 5 4.81 5 9.5S8.81 18 13.5 18s8.5-3.81 8.5-8.5S18.19 1 13.5 1zM16 8.5c0 .83-.67 1.5-1.5 1.5h-1v1c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5v-1h-1c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5h1v-1c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v1h1c.83 0 1.5.67 1.5 1.5z" fill={color} />
    </Svg>
  );
}
