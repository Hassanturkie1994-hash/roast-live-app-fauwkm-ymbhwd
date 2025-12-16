
/**
 * Central Icon Registry
 * 
 * This is the SINGLE SOURCE OF TRUTH for all icons used in the Roast Live app.
 * 
 * NO screen, component, config, or admin view may reference a raw string icon name.
 * ALL icons must be imported and resolved ONLY via this registry.
 * 
 * ARCHITECTURE:
 * - Roast Icons: Custom branded SVG icons for Roast Live identity
 * - System Icons: Platform-specific icons (SF Symbols on iOS, Material Icons on Android)
 * 
 * USAGE:
 * import { ROAST_ICONS, SYSTEM_ICONS } from '@/components/Icons/iconRegistry';
 * <AppIcon name={ROAST_ICONS.HOME} type="roast" />
 * <AppIcon type="system" iosName={SYSTEM_ICONS.CHEVRON_LEFT.ios} androidName={SYSTEM_ICONS.CHEVRON_LEFT.android} />
 */

import { UnifiedIconName } from './UnifiedRoastIcon';
import { Ionicons } from '@expo/vector-icons';

/**
 * Roast Live Branded Icons
 * All custom SVG icons with Roast Live brand identity
 */
export const ROAST_ICONS: Record<string, UnifiedIconName> = {
  // Navigation & Core
  HOME: 'flame-home',
  EXPLORE: 'roast-compass',
  CAMERA: 'fire-camera',
  INBOX: 'smoke-message',
  PROFILE: 'roast-badge',
  LIVE: 'live',
  
  // Notifications & Social
  NOTIFICATIONS: 'shockwave-bell',
  BELL: 'bell',
  PEOPLE: 'crowd-flame',
  PERSON: 'spotlight-person',
  FOLLOW: 'follow',
  HEART: 'heart',
  LIKE: 'like',
  COMMENT: 'comment',
  SHARE: 'share',
  SEND: 'send',
  
  // Media & Content
  VIDEO: 'hot-circle',
  GRID: 'burned-photo',
  BOOKMARK: 'bookmark',
  HISTORY: 'history',
  STREAM_HISTORY: 'stream-history',
  SAVED_STREAMS: 'saved-streams',
  ADD: 'add',
  EDIT: 'edit',
  SEARCH: 'search',
  
  // Wallet & Premium
  WALLET: 'lava-wallet',
  GIFT: 'roast-gift-box',
  GIFTS: 'gifts',
  PREMIUM: 'premium-star-flame',
  CROWN: 'crown-flame',
  VIP_DIAMOND: 'vip-diamond-flame',
  SUBSCRIPTIONS: 'subscriptions',
  WITHDRAW: 'withdraw',
  TRANSACTIONS: 'transactions',
  
  // Settings & Security
  SETTINGS: 'heated-gear',
  ACCOUNT_SECURITY: 'account-security',
  PASSWORD: 'password',
  SHIELD: 'shield-flame',
  BLOCKED_USERS: 'blocked-users',
  APPEARANCE: 'appearance',
  PRIVACY: 'privacy',
  TERMS: 'terms',
  RULES: 'rules',
  APPEALS: 'appeals',
  LOGOUT: 'logout',
  
  // Admin & Moderation
  ADMIN_DASHBOARD: 'admin-dashboard',
  STREAM_DASHBOARD: 'stream-dashboard',
  ACHIEVEMENTS: 'achievements',
  WARNING: 'fire-info',
  
  // Controls & Actions
  PLAY: 'play',
  PAUSE: 'pause',
  STOP: 'stop',
  MIC: 'mic',
  CLOSE: 'close',
  CHECK: 'check',
  CHEVRON_RIGHT: 'chevron-right',
  CHEVRON_LEFT: 'chevron-left',
  MORE: 'more',
} as const;

/**
 * System Icons (Platform-Specific)
 * SF Symbols on iOS, Material Icons on Android
 * 
 * These are validated to work on both platforms
 */
export interface SystemIconDefinition {
  ios: string;
  android: keyof typeof Ionicons.glyphMap;
  description: string;
}

export const SYSTEM_ICONS: Record<string, SystemIconDefinition> = {
  // Navigation
  CHEVRON_LEFT: {
    ios: 'chevron.left',
    android: 'chevron-back',
    description: 'Back navigation',
  },
  CHEVRON_RIGHT: {
    ios: 'chevron.right',
    android: 'chevron-forward',
    description: 'Forward navigation',
  },
  CHEVRON_UP: {
    ios: 'chevron.up',
    android: 'chevron-up',
    description: 'Up navigation',
  },
  CHEVRON_DOWN: {
    ios: 'chevron.down',
    android: 'chevron-down',
    description: 'Down navigation',
  },
  ARROW_BACK: {
    ios: 'arrow.left',
    android: 'arrow-back',
    description: 'Back arrow',
  },
  
  // Actions
  CLOSE: {
    ios: 'xmark',
    android: 'close',
    description: 'Close/dismiss',
  },
  CHECK: {
    ios: 'checkmark',
    android: 'checkmark',
    description: 'Confirm/success',
  },
  ADD: {
    ios: 'plus',
    android: 'add',
    description: 'Add/create',
  },
  REMOVE: {
    ios: 'minus',
    android: 'remove',
    description: 'Remove/delete',
  },
  EDIT: {
    ios: 'pencil',
    android: 'create',
    description: 'Edit',
  },
  DELETE: {
    ios: 'trash',
    android: 'trash',
    description: 'Delete',
  },
  
  // Social
  PERSON: {
    ios: 'person.fill',
    android: 'person',
    description: 'User profile',
  },
  PEOPLE: {
    ios: 'person.3.fill',
    android: 'people',
    description: 'Multiple users',
  },
  PERSON_ADD: {
    ios: 'person.badge.plus.fill',
    android: 'person-add',
    description: 'Add person',
  },
  HEART: {
    ios: 'heart.fill',
    android: 'heart',
    description: 'Like/favorite',
  },
  HEART_OUTLINE: {
    ios: 'heart',
    android: 'heart-outline',
    description: 'Like outline',
  },
  
  // Communication
  MESSAGE: {
    ios: 'message.fill',
    android: 'chatbubble',
    description: 'Message',
  },
  MAIL: {
    ios: 'envelope.fill',
    android: 'mail',
    description: 'Email',
  },
  NOTIFICATIONS: {
    ios: 'bell.fill',
    android: 'notifications',
    description: 'Notifications',
  },
  NOTIFICATIONS_OFF: {
    ios: 'bell.slash.fill',
    android: 'notifications-off',
    description: 'Notifications off',
  },
  
  // Media
  CAMERA: {
    ios: 'camera.fill',
    android: 'camera',
    description: 'Camera',
  },
  VIDEO: {
    ios: 'video.fill',
    android: 'videocam',
    description: 'Video',
  },
  PHOTO: {
    ios: 'photo.fill',
    android: 'image',
    description: 'Photo',
  },
  PLAY: {
    ios: 'play.fill',
    android: 'play-arrow',
    description: 'Play',
  },
  PAUSE: {
    ios: 'pause.fill',
    android: 'pause',
    description: 'Pause',
  },
  STOP: {
    ios: 'stop.fill',
    android: 'stop',
    description: 'Stop',
  },
  
  // Settings & System
  SETTINGS: {
    ios: 'gear',
    android: 'settings',
    description: 'Settings',
  },
  SEARCH: {
    ios: 'magnifyingglass',
    android: 'search',
    description: 'Search',
  },
  FILTER: {
    ios: 'line.3.horizontal.decrease.circle.fill',
    android: 'filter-list',
    description: 'Filter',
  },
  MORE: {
    ios: 'ellipsis',
    android: 'ellipsis-horizontal',
    description: 'More options',
  },
  INFO: {
    ios: 'info.circle.fill',
    android: 'information-circle',
    description: 'Information',
  },
  
  // Status & Indicators
  WARNING: {
    ios: 'exclamationmark.triangle.fill',
    android: 'warning',
    description: 'Warning',
  },
  ERROR: {
    ios: 'xmark.circle.fill',
    android: 'close-circle',
    description: 'Error',
  },
  SUCCESS: {
    ios: 'checkmark.circle.fill',
    android: 'checkmark-circle',
    description: 'Success',
  },
  SHIELD: {
    ios: 'shield.fill',
    android: 'shield',
    description: 'Security',
  },
  LOCK: {
    ios: 'lock.fill',
    android: 'lock-closed',
    description: 'Locked',
  },
  UNLOCK: {
    ios: 'lock.open.fill',
    android: 'lock-open',
    description: 'Unlocked',
  },
  
  // Admin & Moderation
  FLAG: {
    ios: 'flag.fill',
    android: 'flag',
    description: 'Report/flag',
  },
  BLOCK: {
    ios: 'hand.raised.fill',
    android: 'hand-left',
    description: 'Block',
  },
  BAN: {
    ios: 'nosign',
    android: 'ban',
    description: 'Ban',
  },
  
  // Time & Calendar
  CLOCK: {
    ios: 'clock.fill',
    android: 'time',
    description: 'Time',
  },
  CALENDAR: {
    ios: 'calendar',
    android: 'calendar',
    description: 'Calendar',
  },
  
  // Finance
  WALLET: {
    ios: 'creditcard.fill',
    android: 'wallet',
    description: 'Wallet',
  },
  GIFT: {
    ios: 'gift.fill',
    android: 'gift',
    description: 'Gift',
  },
  STAR: {
    ios: 'star.fill',
    android: 'star',
    description: 'Star/favorite',
  },
  
  // Documents
  DOCUMENT: {
    ios: 'doc.text.fill',
    android: 'document-text',
    description: 'Document',
  },
  FOLDER: {
    ios: 'folder.fill',
    android: 'folder',
    description: 'Folder',
  },
  
  // Misc
  HOME: {
    ios: 'house.fill',
    android: 'home',
    description: 'Home',
  },
  BOOKMARK: {
    ios: 'bookmark.fill',
    android: 'bookmark',
    description: 'Bookmark',
  },
  SHARE: {
    ios: 'square.and.arrow.up',
    android: 'share-social',
    description: 'Share',
  },
  DOWNLOAD: {
    ios: 'arrow.down.circle.fill',
    android: 'download',
    description: 'Download',
  },
  UPLOAD: {
    ios: 'arrow.up.circle.fill',
    android: 'cloud-upload',
    description: 'Upload',
  },
} as const;

/**
 * Icon validation helper
 * Checks if an icon exists in the registry
 */
export function isValidRoastIcon(name: string): name is UnifiedIconName {
  return Object.values(ROAST_ICONS).includes(name as UnifiedIconName);
}

/**
 * Icon validation helper
 * Checks if a system icon exists in the registry
 */
export function isValidSystemIcon(name: string): boolean {
  return Object.keys(SYSTEM_ICONS).includes(name);
}

/**
 * Get icon by key with fallback
 */
export function getRoastIcon(key: string): UnifiedIconName {
  const icon = ROAST_ICONS[key];
  if (!icon) {
    console.warn(`⚠️ Icon key "${key}" not found in ROAST_ICONS registry`);
    return ROAST_ICONS.HOME; // Fallback to home icon
  }
  return icon;
}

/**
 * Get system icon by key with fallback
 */
export function getSystemIcon(key: string): SystemIconDefinition {
  const icon = SYSTEM_ICONS[key];
  if (!icon) {
    console.warn(`⚠️ Icon key "${key}" not found in SYSTEM_ICONS registry`);
    return SYSTEM_ICONS.INFO; // Fallback to info icon
  }
  return icon;
}
