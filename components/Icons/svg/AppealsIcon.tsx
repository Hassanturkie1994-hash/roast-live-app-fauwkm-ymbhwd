
import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
}

export default function AppealsIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20ZM10 19H8V15H10V19ZM14 19H12V12H14V19ZM10 10.5C10 9.67 10.67 9 11.5 9C12.33 9 13 9.67 13 10.5C13 11.33 12.33 12 11.5 12C10.67 12 10 11.33 10 10.5Z"
        fill={color}
      />
    </Svg>
  );
}