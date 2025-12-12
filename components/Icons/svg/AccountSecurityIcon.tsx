
import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
}

export default function AccountSecurityIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L4 6V11C4 16.55 7.84 21.74 12 23C16.16 21.74 20 16.55 20 11V6L12 2ZM12 12C10.9 12 10 11.1 10 10C10 8.9 10.9 8 12 8C13.1 8 14 8.9 14 10C14 11.1 13.1 12 12 12ZM12 20C9.33 20 7.08 18.08 6.24 15.5C6.84 14.5 9.3 14 12 14C14.7 14 17.16 14.5 17.76 15.5C16.92 18.08 14.67 20 12 20Z"
        fill={color}
      />
    </Svg>
  );
}