
/**
 * Roast Live Icon System - Central Export
 * 
 * This file exports all icon-related components for easy importing.
 * 
 * USAGE:
 * import { AppIcon, ROAST_ICONS, SYSTEM_ICONS } from '@/components/Icons';
 * 
 * <AppIcon name={ROAST_ICONS.HOME} type="roast" size={24} color={colors.text} />
 * <AppIcon type="system" iosName={SYSTEM_ICONS.CHEVRON_LEFT.ios} androidName={SYSTEM_ICONS.CHEVRON_LEFT.android} />
 */

// Main icon components
export { default as AppIcon } from './AppIcon';
export { default as UnifiedRoastIcon } from './UnifiedRoastIcon';
export { default as RoastIcon } from './RoastIcon';

// Icon registry
export { 
  ROAST_ICONS, 
  SYSTEM_ICONS,
  isValidRoastIcon,
  isValidSystemIcon,
  getRoastIcon,
  getSystemIcon,
} from './iconRegistry';

// Type exports
export type { UnifiedIconName } from './UnifiedRoastIcon';
export type { RoastIconName } from './RoastIcon';
export type { AppIconType } from './AppIcon';
export type { SystemIconDefinition } from './iconRegistry';

// Individual SVG icon exports (for advanced use cases)
export { default as FlameHomeIcon } from './svg/FlameHomeIcon';
export { default as RoastCompassIcon } from './svg/RoastCompassIcon';
export { default as FireCameraIcon } from './svg/FireCameraIcon';
export { default as SmokeMessageIcon } from './svg/SmokeMessageIcon';
export { default as RoastBadgeIcon } from './svg/RoastBadgeIcon';
export { default as ShockwaveBellIcon } from './svg/ShockwaveBellIcon';
export { default as CrowdFlameIcon } from './svg/CrowdFlameIcon';
export { default as SpotlightPersonIcon } from './svg/SpotlightPersonIcon';
export { default as BurnedPhotoIcon } from './svg/BurnedPhotoIcon';
export { default as HotCircleIcon } from './svg/HotCircleIcon';
export { default as LavaWalletIcon } from './svg/LavaWalletIcon';
export { default as HeatedGearIcon } from './svg/HeatedGearIcon';
export { default as RoastGiftBoxIcon } from './svg/RoastGiftBoxIcon';
export { default as FireInfoIcon } from './svg/FireInfoIcon';
export { default as ShieldFlameIcon } from './svg/ShieldFlameIcon';
export { default as CrownFlameIcon } from './svg/CrownFlameIcon';
export { default as VIPDiamondFlameIcon } from './svg/VIPDiamondFlameIcon';
export { default as PremiumStarFlameIcon } from './svg/PremiumStarFlameIcon';
