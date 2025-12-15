
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

// Import all SVG icons
import FlameHomeIcon from './svg/FlameHomeIcon';
import RoastCompassIcon from './svg/RoastCompassIcon';
import FireCameraIcon from './svg/FireCameraIcon';
import SmokeMessageIcon from './svg/SmokeMessageIcon';
import RoastBadgeIcon from './svg/RoastBadgeIcon';
import ShockwaveBellIcon from './svg/ShockwaveBellIcon';
import CrowdFlameIcon from './svg/CrowdFlameIcon';
import SpotlightPersonIcon from './svg/SpotlightPersonIcon';
import BurnedPhotoIcon from './svg/BurnedPhotoIcon';
import HotCircleIcon from './svg/HotCircleIcon';
import LavaWalletIcon from './svg/LavaWalletIcon';
import HeatedGearIcon from './svg/HeatedGearIcon';
import RoastGiftBoxIcon from './svg/RoastGiftBoxIcon';
import FireInfoIcon from './svg/FireInfoIcon';
import ShieldFlameIcon from './svg/ShieldFlameIcon';
import CrownFlameIcon from './svg/CrownFlameIcon';
import VIPDiamondFlameIcon from './svg/VIPDiamondFlameIcon';
import PremiumStarFlameIcon from './svg/PremiumStarFlameIcon';
import AccountSecurityIcon from './svg/AccountSecurityIcon';
import PasswordIcon from './svg/PasswordIcon';
import BlockedUsersIcon from './svg/BlockedUsersIcon';
import StreamDashboardIcon from './svg/StreamDashboardIcon';
import SavedStreamsIcon from './svg/SavedStreamsIcon';
import StreamHistoryIcon from './svg/StreamHistoryIcon';
import SubscriptionsIcon from './svg/SubscriptionsIcon';
import WithdrawIcon from './svg/WithdrawIcon';
import TransactionsIcon from './svg/TransactionsIcon';
import RulesIcon from './svg/RulesIcon';
import AppealsIcon from './svg/AppealsIcon';
import TermsIcon from './svg/TermsIcon';
import PrivacyIcon from './svg/PrivacyIcon';
import CommentIcon from './svg/CommentIcon';
import AchievementsIcon from './svg/AchievementsIcon';
import AdminDashboardIcon from './svg/AdminDashboardIcon';
import AppearanceIcon from './svg/AppearanceIcon';
import LogoutIcon from './svg/LogoutIcon';
import LiveIcon from './svg/LiveIcon';
import EditIcon from './svg/EditIcon';
import ShareIcon from './svg/ShareIcon';
import BookmarkIcon from './svg/BookmarkIcon';
import HistoryIcon from './svg/HistoryIcon';
import AddIcon from './svg/AddIcon';
import HeartIcon from './svg/HeartIcon';
import LikeIcon from './svg/LikeIcon';
import CheckIcon from './svg/CheckIcon';
import ChevronRightIcon from './svg/ChevronRightIcon';
import ChevronLeftIcon from './svg/ChevronLeftIcon';
import SearchIcon from './svg/SearchIcon';
import MicIcon from './svg/MicIcon';
import SendIcon from './svg/SendIcon';
import MoreIcon from './svg/MoreIcon';
import CloseIcon from './svg/CloseIcon';
import PlayIcon from './svg/PlayIcon';
import PauseIcon from './svg/PauseIcon';
import StopIcon from './svg/StopIcon';
import VideoIcon from './svg/VideoIcon';
import GridIcon from './svg/GridIcon';
import CameraIcon from './svg/CameraIcon';
import WarningIcon from './svg/WarningIcon';
import PeopleIcon from './svg/PeopleIcon';
import PersonIcon from './svg/PersonIcon';
import ProfileIcon from './svg/ProfileIcon';
import PremiumIcon from './svg/PremiumIcon';
import WalletIcon from './svg/WalletIcon';
import GiftsIcon from './svg/GiftsIcon';
import GiftIcon from './svg/GiftIcon';
import SettingsIcon from './svg/SettingsIcon';
import NotificationsIcon from './svg/NotificationsIcon';
import BellIcon from './svg/BellIcon';
import FollowIcon from './svg/FollowIcon';
import HomeIcon from './svg/HomeIcon';
import ExploreIcon from './svg/ExploreIcon';
import InboxIcon from './svg/InboxIcon';
import CrownIcon from './svg/CrownIcon';
import ShieldIcon from './svg/ShieldIcon';

/**
 * Unified Roast Live Icon System
 * 
 * This is the centralized icon component for the entire app.
 * All icons are theme-aware and work perfectly in both light and dark modes.
 * 
 * Features:
 * - Automatic theme-aware coloring
 * - Consistent sizing and styling
 * - Premium Roast Live brand identity
 * - No broken "?" icons
 * - SVG-based for perfect scaling
 */

export type UnifiedIconName =
  // Navigation & Core
  | 'home'
  | 'flame-home'
  | 'explore'
  | 'roast-compass'
  | 'camera'
  | 'fire-camera'
  | 'inbox'
  | 'smoke-message'
  | 'profile'
  | 'roast-badge'
  | 'live'
  
  // Notifications & Social
  | 'notifications'
  | 'bell'
  | 'shockwave-bell'
  | 'people'
  | 'crowd-flame'
  | 'person'
  | 'spotlight-person'
  | 'follow'
  | 'heart'
  | 'like'
  | 'comment'
  | 'share'
  | 'send'
  
  // Media & Content
  | 'video'
  | 'hot-circle'
  | 'grid'
  | 'burned-photo'
  | 'bookmark'
  | 'history'
  | 'stream-history'
  | 'saved-streams'
  | 'add'
  | 'edit'
  | 'search'
  
  // Wallet & Premium
  | 'wallet'
  | 'lava-wallet'
  | 'gift'
  | 'gifts'
  | 'roast-gift-box'
  | 'premium'
  | 'premium-star-flame'
  | 'crown'
  | 'crown-flame'
  | 'vip-diamond-flame'
  | 'subscriptions'
  | 'withdraw'
  | 'transactions'
  
  // Settings & Security
  | 'settings'
  | 'heated-gear'
  | 'account-security'
  | 'password'
  | 'shield'
  | 'shield-flame'
  | 'blocked-users'
  | 'appearance'
  | 'privacy'
  | 'terms'
  | 'rules'
  | 'appeals'
  | 'logout'
  
  // Admin & Moderation
  | 'admin-dashboard'
  | 'stream-dashboard'
  | 'achievements'
  | 'warning'
  | 'fire-info'
  
  // Controls & Actions
  | 'play'
  | 'pause'
  | 'stop'
  | 'mic'
  | 'close'
  | 'check'
  | 'chevron-right'
  | 'chevron-left'
  | 'more';

interface UnifiedRoastIconProps {
  name: UnifiedIconName;
  size?: number;
  color?: string;
  style?: any;
  forceTheme?: 'light' | 'dark';
}

// Icon mapping with fallbacks
const iconMap: Record<UnifiedIconName, React.ComponentType<{ size: number; color: string; theme?: 'light' | 'dark' }>> = {
  // Navigation & Core - Use Roast-themed icons
  'home': FlameHomeIcon,
  'flame-home': FlameHomeIcon,
  'explore': RoastCompassIcon,
  'roast-compass': RoastCompassIcon,
  'camera': FireCameraIcon,
  'fire-camera': FireCameraIcon,
  'inbox': SmokeMessageIcon,
  'smoke-message': SmokeMessageIcon,
  'profile': RoastBadgeIcon,
  'roast-badge': RoastBadgeIcon,
  'live': LiveIcon,
  
  // Notifications & Social
  'notifications': ShockwaveBellIcon,
  'bell': ShockwaveBellIcon,
  'shockwave-bell': ShockwaveBellIcon,
  'people': CrowdFlameIcon,
  'crowd-flame': CrowdFlameIcon,
  'person': SpotlightPersonIcon,
  'spotlight-person': SpotlightPersonIcon,
  'follow': SpotlightPersonIcon,
  'heart': HeartIcon,
  'like': LikeIcon,
  'comment': CommentIcon,
  'share': ShareIcon,
  'send': SendIcon,
  
  // Media & Content
  'video': HotCircleIcon,
  'hot-circle': HotCircleIcon,
  'grid': BurnedPhotoIcon,
  'burned-photo': BurnedPhotoIcon,
  'bookmark': BookmarkIcon,
  'history': HistoryIcon,
  'stream-history': StreamHistoryIcon,
  'saved-streams': SavedStreamsIcon,
  'add': AddIcon,
  'edit': EditIcon,
  'search': SearchIcon,
  
  // Wallet & Premium
  'wallet': LavaWalletIcon,
  'lava-wallet': LavaWalletIcon,
  'gift': RoastGiftBoxIcon,
  'gifts': RoastGiftBoxIcon,
  'roast-gift-box': RoastGiftBoxIcon,
  'premium': PremiumStarFlameIcon,
  'premium-star-flame': PremiumStarFlameIcon,
  'crown': CrownFlameIcon,
  'crown-flame': CrownFlameIcon,
  'vip-diamond-flame': VIPDiamondFlameIcon,
  'subscriptions': SubscriptionsIcon,
  'withdraw': WithdrawIcon,
  'transactions': TransactionsIcon,
  
  // Settings & Security
  'settings': HeatedGearIcon,
  'heated-gear': HeatedGearIcon,
  'account-security': AccountSecurityIcon,
  'password': PasswordIcon,
  'shield': ShieldFlameIcon,
  'shield-flame': ShieldFlameIcon,
  'blocked-users': BlockedUsersIcon,
  'appearance': AppearanceIcon,
  'privacy': PrivacyIcon,
  'terms': TermsIcon,
  'rules': RulesIcon,
  'appeals': AppealsIcon,
  'logout': LogoutIcon,
  
  // Admin & Moderation
  'admin-dashboard': AdminDashboardIcon,
  'stream-dashboard': StreamDashboardIcon,
  'achievements': AchievementsIcon,
  'warning': FireInfoIcon,
  'fire-info': FireInfoIcon,
  
  // Controls & Actions
  'play': PlayIcon,
  'pause': PauseIcon,
  'stop': StopIcon,
  'mic': MicIcon,
  'close': CloseIcon,
  'check': CheckIcon,
  'chevron-right': ChevronRightIcon,
  'chevron-left': ChevronLeftIcon,
  'more': MoreIcon,
};

/**
 * UnifiedRoastIcon Component
 * 
 * The single source of truth for all icons in the Roast Live app.
 * Automatically adapts to the current theme and ensures consistent styling.
 * 
 * @param name - The icon name from the UnifiedIconName type
 * @param size - Icon size in pixels (default: 24)
 * @param color - Override color (optional, defaults to theme-aware color)
 * @param style - Additional styles
 * @param forceTheme - Force a specific theme (optional)
 */
export default function UnifiedRoastIcon({ 
  name, 
  size = 24, 
  color, 
  style,
  forceTheme 
}: UnifiedRoastIconProps) {
  const { colors, theme } = useTheme();

  // Determine the effective theme
  const effectiveTheme = forceTheme || theme;

  // Determine color based on theme if not provided
  // Use neutral colors that work in both themes
  const iconColor = color || (effectiveTheme === 'dark' ? colors.text : colors.text);

  // Get the icon component
  const IconComponent = iconMap[name];

  // If icon not found, render a fallback (no "?" character)
  if (!IconComponent) {
    console.warn(`⚠️ UnifiedRoastIcon: Icon "${name}" not found in icon map`);
    // Return a simple circle as fallback instead of "?"
    return (
      <View style={[styles.fallbackContainer, { width: size, height: size }, style]}>
        <View style={[styles.fallbackCircle, { 
          width: size * 0.8, 
          height: size * 0.8, 
          borderRadius: size * 0.4,
          backgroundColor: colors.backgroundAlt,
          borderColor: colors.border,
        }]} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <IconComponent size={size} color={iconColor} theme={effectiveTheme} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackCircle: {
    borderWidth: 2,
  },
});
