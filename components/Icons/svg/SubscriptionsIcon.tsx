
import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
}

export default function SubscriptionsIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 8H4V6H20V8ZM18 2H6V4H18V2ZM22 12V20C22 21.1 21.1 22 20 22H4C2.9 22 2 21.1 2 20V12C2 10.9 2.9 10 4 10H20C21.1 10 22 10.9 22 12ZM15 16L9 12.5V19.5L15 16Z"
        fill={color}
      />
    </Svg>
  );
}