
import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
}

export default function LiveIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" fill={color} />
      <Path
        d="M16.24 7.76C17.32 8.84 18 10.34 18 12C18 13.66 17.32 15.16 16.24 16.24L17.66 17.66C19.11 16.21 20 14.21 20 12C20 9.79 19.11 7.79 17.66 6.34L16.24 7.76ZM7.76 16.24C6.68 15.16 6 13.66 6 12C6 10.34 6.68 8.84 7.76 7.76L6.34 6.34C4.89 7.79 4 9.79 4 12C4 14.21 4.89 16.21 6.34 17.66L7.76 16.24ZM19.07 4.93L20.49 3.51C22.72 5.74 24 8.77 24 12C24 15.23 22.72 18.26 20.49 20.49L19.07 19.07C20.88 17.26 22 14.76 22 12C22 9.24 20.88 6.74 19.07 4.93ZM4.93 19.07L3.51 20.49C1.28 18.26 0 15.23 0 12C0 8.77 1.28 5.74 3.51 3.51L4.93 4.93C3.12 6.74 2 9.24 2 12C2 14.76 3.12 17.26 4.93 19.07Z"
        fill={color}
      />
    </Svg>
  );
}