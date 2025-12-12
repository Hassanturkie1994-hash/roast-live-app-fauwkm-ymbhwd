
import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
}

export default function WithdrawIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 13V11H7.83L10.41 8.41L9 7L4 12L9 17L10.41 15.59L7.83 13H16ZM20 3H12C10.9 3 10 3.9 10 5V7H12V5H20V19H12V17H10V19C10 20.1 10.9 21 12 21H20C21.1 21 22 20.1 22 19V5C22 3.9 21.1 3 20 3Z"
        fill={color}
      />
    </Svg>
  );
}