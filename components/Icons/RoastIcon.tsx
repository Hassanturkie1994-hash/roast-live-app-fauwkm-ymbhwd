
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

// Import all SVG icons
import AccountSecurityIcon from './svg/AccountSecurityIcon';
import PasswordIcon from './svg/PasswordIcon';
import BlockedUsersIcon from './svg/BlockedUsersIcon';
import StreamDashboardIcon from './svg/StreamDashboardIcon';
import SavedStreamsIcon from './svg/SavedStreamsIcon';
import StreamHistoryIcon from './svg/StreamHistoryIcon';
import PremiumIcon from './svg/PremiumIcon';
import WalletIcon from './svg/WalletIcon';
import GiftsIcon from './svg/GiftsIcon';
import SubscriptionsIcon from './svg/SubscriptionsIcon';
import WithdrawIcon from './svg/WithdrawIcon';
import TransactionsIcon from './svg/TransactionsIcon';
import RulesIcon from './svg/RulesIcon';
import AppealsIcon from './svg/AppealsIcon';
import TermsIcon from './svg/TermsIcon';
import PrivacyIcon from './svg/PrivacyIcon';
import ProfileIcon from './svg/ProfileIcon';
import CommentIcon from './svg/CommentIcon';
import NotificationsIcon from './svg/NotificationsIcon';
import AchievementsIcon from './svg/AchievementsIcon';
import AdminDashboardIcon from './svg/AdminDashboardIcon';
import AppearanceIcon from './svg/AppearanceIcon';
import LogoutIcon from './svg/LogoutIcon';
import HomeIcon from './svg/HomeIcon';
import ExploreIcon from './svg/ExploreIcon';
import InboxIcon from './svg/InboxIcon';
import LiveIcon from './svg/LiveIcon';
import SettingsIcon from './svg/SettingsIcon';
import EditIcon from './svg/EditIcon';
import ShareIcon from './svg/ShareIcon';
import BookmarkIcon from './svg/BookmarkIcon';
import VideoIcon from './svg/VideoIcon';
import GridIcon from './svg/GridIcon';
import HistoryIcon from './svg/HistoryIcon';
import AddIcon from './svg/AddIcon';
import HeartIcon from './svg/HeartIcon';
import LikeIcon from './svg/LikeIcon';
import FollowIcon from './svg/FollowIcon';
import BellIcon from './svg/BellIcon';
import GiftIcon from './svg/GiftIcon';
import WarningIcon from './svg/WarningIcon';
import CheckIcon from './svg/CheckIcon';
import ChevronRightIcon from './svg/ChevronRightIcon';
import ChevronLeftIcon from './svg/ChevronLeftIcon';
import SearchIcon from './svg/SearchIcon';
import PersonIcon from './svg/PersonIcon';
import PeopleIcon from './svg/PeopleIcon';
import ShieldIcon from './svg/ShieldIcon';
import CrownIcon from './svg/CrownIcon';
import CameraIcon from './svg/CameraIcon';
import MicIcon from './svg/MicIcon';
import SendIcon from './svg/SendIcon';
import MoreIcon from './svg/MoreIcon';
import CloseIcon from './svg/CloseIcon';
import PlayIcon from './svg/PlayIcon';
import PauseIcon from './svg/PauseIcon';
import StopIcon from './svg/StopIcon';

// Import new Roast-Theme icons
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

export type RoastIconName =
  | 'account-security'
  | 'password'
  | 'blocked-users'
  | 'stream-dashboard'
  | 'saved-streams'
  | 'stream-history'
  | 'premium'
  | 'wallet'
  | 'gifts'
  | 'subscriptions'
  | 'withdraw'
  | 'transactions'
  | 'rules'
  | 'appeals'
  | 'terms'
  | 'privacy'
  | 'profile'
  | 'comment'
  | 'notifications'
  | 'achievements'
  | 'admin-dashboard'
  | 'appearance'
  | 'logout'
  | 'home'
  | 'explore'
  | 'inbox'
  | 'live'
  | 'settings'
  | 'edit'
  | 'share'
  | 'bookmark'
  | 'video'
  | 'grid'
  | 'history'
  | 'add'
  | 'heart'
  | 'like'
  | 'follow'
  | 'bell'
  | 'gift'
  | 'warning'
  | 'check'
  | 'chevron-right'
  | 'chevron-left'
  | 'search'
  | 'person'
  | 'people'
  | 'shield'
  | 'crown'
  | 'camera'
  | 'mic'
  | 'send'
  | 'more'
  | 'close'
  | 'play'
  | 'pause'
  | 'stop'
  // New Roast-Theme icons
  | 'flame-home'
  | 'roast-compass'
  | 'fire-camera'
  | 'smoke-message'
  | 'roast-badge'
  | 'shockwave-bell'
  | 'crowd-flame'
  | 'spotlight-person'
  | 'burned-photo'
  | 'hot-circle'
  | 'lava-wallet'
  | 'heated-gear'
  | 'roast-gift-box'
  | 'fire-info'
  | 'shield-flame'
  | 'crown-flame'
  | 'vip-diamond-flame'
  | 'premium-star-flame';

interface RoastIconProps {
  name: RoastIconName;
  size?: number;
  color?: string;
  style?: any;
}

const iconMap: Record<RoastIconName, React.ComponentType<{ size: number; color: string; theme?: 'light' | 'dark' }>> = {
  // Map old icons to new Roast-Theme equivalents
  'home': FlameHomeIcon,
  'explore': RoastCompassIcon,
  'camera': FireCameraIcon,
  'inbox': SmokeMessageIcon,
  'profile': RoastBadgeIcon,
  'notifications': ShockwaveBellIcon,
  'bell': ShockwaveBellIcon,
  'people': CrowdFlameIcon,
  'follow': SpotlightPersonIcon,
  'person': SpotlightPersonIcon,
  'grid': BurnedPhotoIcon,
  'video': HotCircleIcon,
  'wallet': LavaWalletIcon,
  'settings': HeatedGearIcon,
  'gifts': RoastGiftBoxIcon,
  'gift': RoastGiftBoxIcon,
  'warning': FireInfoIcon,
  'shield': ShieldFlameIcon,
  'crown': CrownFlameIcon,
  'premium': PremiumStarFlameIcon,
  
  // Keep specific icons that don't have Roast-Theme equivalents yet
  'account-security': AccountSecurityIcon,
  'password': PasswordIcon,
  'blocked-users': BlockedUsersIcon,
  'stream-dashboard': StreamDashboardIcon,
  'saved-streams': SavedStreamsIcon,
  'stream-history': StreamHistoryIcon,
  'subscriptions': SubscriptionsIcon,
  'withdraw': WithdrawIcon,
  'transactions': TransactionsIcon,
  'rules': RulesIcon,
  'appeals': AppealsIcon,
  'terms': TermsIcon,
  'privacy': PrivacyIcon,
  'comment': CommentIcon,
  'achievements': AchievementsIcon,
  'admin-dashboard': AdminDashboardIcon,
  'appearance': AppearanceIcon,
  'logout': LogoutIcon,
  'live': LiveIcon,
  'edit': EditIcon,
  'share': ShareIcon,
  'bookmark': BookmarkIcon,
  'history': HistoryIcon,
  'add': AddIcon,
  'heart': HeartIcon,
  'like': LikeIcon,
  'check': CheckIcon,
  'chevron-right': ChevronRightIcon,
  'chevron-left': ChevronLeftIcon,
  'search': SearchIcon,
  'mic': MicIcon,
  'send': SendIcon,
  'more': MoreIcon,
  'close': CloseIcon,
  'play': PlayIcon,
  'pause': PauseIcon,
  'stop': StopIcon,
  
  // New Roast-Theme icons (direct mapping)
  'flame-home': FlameHomeIcon,
  'roast-compass': RoastCompassIcon,
  'fire-camera': FireCameraIcon,
  'smoke-message': SmokeMessageIcon,
  'roast-badge': RoastBadgeIcon,
  'shockwave-bell': ShockwaveBellIcon,
  'crowd-flame': CrowdFlameIcon,
  'spotlight-person': SpotlightPersonIcon,
  'burned-photo': BurnedPhotoIcon,
  'hot-circle': HotCircleIcon,
  'lava-wallet': LavaWalletIcon,
  'heated-gear': HeatedGearIcon,
  'roast-gift-box': RoastGiftBoxIcon,
  'fire-info': FireInfoIcon,
  'shield-flame': ShieldFlameIcon,
  'crown-flame': CrownFlameIcon,
  'vip-diamond-flame': VIPDiamondFlameIcon,
  'premium-star-flame': PremiumStarFlameIcon,
};

export default function RoastIcon({ name, size = 28, color, style }: RoastIconProps) {
  const { colors, theme } = useTheme();

  // Determine color based on theme if not provided
  const iconColor = color || (theme === 'dark' ? '#FFF' : '#111');

  // Get the icon component
  const IconComponent = iconMap[name];

  // If icon not found, render nothing (no fallback)
  if (!IconComponent) {
    console.warn(`RoastIcon: Icon "${name}" not found`);
    return null;
  }

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <IconComponent size={size} color={iconColor} theme={theme} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});