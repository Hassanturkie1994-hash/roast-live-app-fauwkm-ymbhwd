
import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export default function WithdrawIcon({ size = 24, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M11 16h2V7h3l-4-4-4 4h3v9zm-6 2h14v2H5v-2z" fill={color} />
    </Svg>
  );
}
