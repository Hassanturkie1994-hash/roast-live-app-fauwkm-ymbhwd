
import React from 'react';
import UnifiedRoastIcon, { UnifiedIconName } from './UnifiedRoastIcon';

/**
 * RoastIcon Component (Legacy Wrapper)
 * 
 * This component maintains backward compatibility with existing code
 * while using the new UnifiedRoastIcon system under the hood.
 * 
 * All new code should use UnifiedRoastIcon directly for better type safety.
 */

export type RoastIconName = UnifiedIconName;

interface RoastIconProps {
  name: RoastIconName;
  size?: number;
  color?: string;
  style?: any;
}

export default function RoastIcon({ name, size = 28, color, style }: RoastIconProps) {
  return (
    <UnifiedRoastIcon 
      name={name} 
      size={size} 
      color={color} 
      style={style} 
    />
  );
}
