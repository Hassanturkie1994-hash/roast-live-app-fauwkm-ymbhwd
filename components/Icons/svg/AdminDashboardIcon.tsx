
import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
}

export default function AdminDashboardIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L2 7V17H6V22H18V17H22V7L12 2ZM16 20H8V14H16V20ZM20 15H18V12H6V15H4V8.03L12 4.19L20 8.03V15Z"
        fill={color}
      />
    </Svg>
  );
}