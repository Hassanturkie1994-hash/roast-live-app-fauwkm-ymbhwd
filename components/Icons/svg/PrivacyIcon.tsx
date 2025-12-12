
import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
}

export default function PrivacyIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 1L3 5V11C3 16.55 6.84 21.74 11 23C15.16 21.74 19 16.55 19 11V5L12 1ZM12 11.99H19C18.47 16.11 15.72 19.78 12 20.93V12H5V6.3L12 3.19V11.99Z"
        fill={color}
      />
    </Svg>
  );
}