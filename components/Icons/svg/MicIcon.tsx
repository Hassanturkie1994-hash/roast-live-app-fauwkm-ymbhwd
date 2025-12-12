
import React from 'react';
import Svg, { Path} from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
}

export default function MicIcon({ size, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14ZM17.91 11C17.91 14.39 15.2 17.1 11.82 17.1C8.44 17.1 5.73 14.39 5.73 11H4C4 14.93 7.05 18.18 10.91 18.82V22H13.09V18.82C16.95 18.18 20 14.93 20 11H18.18C18.18 11 17.91 11 17.91 11Z"
        fill={color}
      />
    </Svg>
  );
}