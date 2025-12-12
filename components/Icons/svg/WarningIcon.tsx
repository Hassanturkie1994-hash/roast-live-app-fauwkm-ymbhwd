
import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
}

export default function WarningIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 21H23L12 2L1 21ZM13 18H11V16H13V18ZM13 14H11V10H13V14Z"
        fill={color}
      />
    </Svg>
  );
}