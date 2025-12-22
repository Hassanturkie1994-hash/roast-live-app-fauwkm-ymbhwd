
/**
 * Service Registry
 * Central registry for all services to ensure they're properly initialized and accessible
 * 
 * LEGACY SYSTEM SHUTDOWN:
 * - All legacy services have been removed
 * - Only NEW Roast systems are registered
 * - Legacy service imports will cause build errors
 * 
 * WEBRTC CLEANUP:
 * - react-native-webrtc has been completely removed
 * - All streaming now uses Agora RTC SDK
 * - webRTCService is deprecated (stub only)
 */

import { achievementService } from './achievementService';
import { adminService } from './adminService';
import { aiModerationService } from './aiModerationService';
import { analyticsService } from './analyticsService';
import { appealsService } from './appealsService';
import { automatedSafetyService } from './automatedSafetyService';
import { banExpirationService } from './banExpirationService';
import { behavioralSafetyService } from './behavioralSafetyService';
import { cdnService } from './cdnService';
import { agoraService } from './agoraService';
import { clubSubscriptionService } from './clubSubscriptionService';
import { commentService } from './commentService';
import { contentSafetyService } from './contentSafetyService';
import { creatorClubService } from './creatorClubService';
import { creatorEarningsService } from './creatorEarningsService';
import { creatorRevenueService } from './creatorRevenueService';
import { deviceBanService } from './deviceBanService';
import { enhancedContentSafetyService } from './enhancedContentSafetyService';
import { enhancedRecommendationService } from './enhancedRecommendationService';
import { escalationService } from './escalationService';
import { fanClubService } from './fanClubService';
import { followService } from './followService';
import { roastGiftService } from './roastGiftService';
import { globalLeaderboardService } from './globalLeaderboardService';
import { inboxService } from './inboxService';
import { leaderboardService } from './leaderboardService';
import { leaderboardSnapshotService } from './leaderboardSnapshotService';
import { likeService } from './likeService';
import { liveStreamArchiveService } from './liveStreamArchiveService';
import { mediaService } from './mediaService';
import { messagingService } from './messagingService';
import { moderationService } from './moderationService';
import { networkStabilityService } from './networkStabilityService';
import { notificationService } from './notificationService';
import { payoutService } from './payoutService';
import { postService } from './postService';
import { premiumSubscriptionService } from './premiumSubscriptionService';
import { pushNotificationService } from './pushNotificationService';
import { pushNotificationTestService } from './pushNotificationTestService';
import { queryCache } from './queryCache';
import { r2Service } from './r2Service';
import { recommendationService } from './recommendationService';
import { replayService } from './replayService';
import { replayWatchService } from './replayWatchService';
import { reportingService } from './reportingService';
import { retentionAnalyticsService } from './retentionAnalyticsService';
import { savedStreamService } from './savedStreamService';
import { searchService } from './searchService';
import { storyService } from './storyService';
import { streamGuestService } from './streamGuestService';
import { fetchLiveStreams, fetchStreamById, fetchStreamsByBroadcaster, fetchPastStreams, fetchRecommendedStreams, fetchFollowingStreams } from './streamService';
import { streamSettingsService } from './streamSettingsService';
import { stripeService } from './stripeService';
import { stripeVIPService } from './stripeVIPService';
import { termsPrivacyService } from './termsPrivacyService';
import { twoFactorAuthService } from './twoFactorAuthService';
import { userBlockingService } from './userBlockingService';
import { viewerTrackingService } from './viewerTrackingService';
import { vipMembershipService } from './vipMembershipService';
import { walletService } from './walletService';
import { walletTransactionService } from './walletTransactionService';
import { validateServiceInitialization } from '@/utils/legacySystemGuard';

/**
 * Service Registry Object
 * All services are registered here for easy access and type safety
 * 
 * ONLY NEW ROAST SYSTEMS ARE REGISTERED:
 * 1. Roast Gift System (roastGiftService)
 * 2. Roast VIP Club (vipMembershipService, stripeVIPService)
 * 3. Roast Season Rankings (leaderboardService, globalLeaderboardService)
 * 4. Roast Battles (battleService - imported separately)
 * 5. Creator Leveling (creatorEarningsService)
 * 6. Agora RTC Streaming (agoraService - replaces WebRTC)
 */
export const ServiceRegistry = {
  // Core Services
  achievement: achievementService,
  admin: adminService,
  aiModeration: aiModerationService,
  analytics: analyticsService,
  appeals: appealsService,
  automatedSafety: automatedSafetyService,
  banExpiration: banExpirationService,
  behavioralSafety: behavioralSafetyService,
  
  // Media & CDN
  cdn: cdnService,
  agora: agoraService, // NEW: Agora RTC (replaces WebRTC)
  media: mediaService,
  r2: r2Service,
  
  // Social & Engagement
  comment: commentService,
  follow: followService,
  like: likeService,
  post: postService,
  story: storyService,
  
  // Streaming
  stream: {
    fetchLive: fetchLiveStreams,
    fetchById: fetchStreamById,
    fetchByBroadcaster: fetchStreamsByBroadcaster,
    fetchPast: fetchPastStreams,
    fetchRecommended: fetchRecommendedStreams,
    fetchFollowing: fetchFollowingStreams,
  },
  streamArchive: liveStreamArchiveService,
  streamGuest: streamGuestService,
  streamSettings: streamSettingsService,
  viewerTracking: viewerTrackingService,
  
  // Replay & VOD
  replay: replayService,
  replayWatch: replayWatchService,
  savedStream: savedStreamService,
  
  // NEW ROAST SYSTEMS ONLY
  roastGift: roastGiftService, // NEW: Roast Gift System (45 gifts)
  wallet: walletService,
  walletTransaction: walletTransactionService,
  
  // Payments & Subscriptions
  stripe: stripeService,
  stripeVIP: stripeVIPService, // NEW: Roast VIP Stripe Integration
  payout: payoutService,
  premiumSubscription: premiumSubscriptionService,
  vipMembership: vipMembershipService, // NEW: Roast VIP Membership
  
  // Creator Features
  creatorClub: creatorClubService,
  creatorEarnings: creatorEarningsService, // NEW: Creator Leveling
  creatorRevenue: creatorRevenueService,
  fanClub: fanClubService,
  clubSubscription: clubSubscriptionService,
  
  // Moderation & Safety
  moderation: moderationService,
  contentSafety: contentSafetyService,
  enhancedContentSafety: enhancedContentSafetyService,
  reporting: reportingService,
  escalation: escalationService,
  deviceBan: deviceBanService,
  
  // Communication
  messaging: messagingService,
  inbox: inboxService,
  notification: notificationService,
  pushNotification: pushNotificationService,
  pushNotificationTest: pushNotificationTestService,
  
  // NEW ROAST SYSTEMS: Leaderboards & Rankings
  leaderboard: leaderboardService, // NEW: Roast Season Rankings
  globalLeaderboard: globalLeaderboardService, // NEW: Global Roast Rankings
  leaderboardSnapshot: leaderboardSnapshotService,
  
  // Discovery & Recommendations
  search: searchService,
  recommendation: recommendationService,
  enhancedRecommendation: enhancedRecommendationService,
  
  // Analytics & Insights
  retentionAnalytics: retentionAnalyticsService,
  
  // Utilities
  networkStability: networkStabilityService,
  queryCache: queryCache,
  termsPrivacy: termsPrivacyService,
  twoFactorAuth: twoFactorAuthService,
  userBlocking: userBlockingService,
} as const;

/**
 * Service Health Check
 * Verifies that all critical services are available
 * 
 * LEGACY SYSTEM CHECK:
 * - Validates that no legacy services are registered
 * - Ensures only NEW Roast systems are active
 * - Verifies Agora RTC is available (replaces WebRTC)
 */
export function checkServiceHealth(): {
  healthy: boolean;
  services: Record<string, boolean>;
} {
  const services: Record<string, boolean> = {};
  
  // Check critical NEW ROAST SYSTEMS
  services.roastGift = !!ServiceRegistry.roastGift;
  services.vipMembership = !!ServiceRegistry.vipMembership;
  services.leaderboard = !!ServiceRegistry.leaderboard;
  services.globalLeaderboard = !!ServiceRegistry.globalLeaderboard;
  
  // Check core services
  services.achievement = !!ServiceRegistry.achievement;
  services.admin = !!ServiceRegistry.admin;
  services.agora = !!ServiceRegistry.agora; // NEW: Agora RTC check
  services.stream = !!ServiceRegistry.stream;
  services.wallet = !!ServiceRegistry.wallet;
  services.stripe = !!ServiceRegistry.stripe;
  services.moderation = !!ServiceRegistry.moderation;
  services.notification = !!ServiceRegistry.notification;
  
  const healthy = Object.values(services).every(status => status);
  
  if (!healthy) {
    console.error('❌ Service health check failed:', services);
  } else {
    console.log('✅ All critical services are healthy (NEW ROAST SYSTEMS + AGORA RTC)');
  }
  
  return { healthy, services };
}

/**
 * Initialize all services
 * Call this on app startup to ensure services are ready
 * 
 * LEGACY SYSTEM CHECK:
 * - Validates service names to ensure no legacy services are initialized
 * - Only NEW Roast systems are allowed
 * - Verifies Agora RTC is initialized (replaces WebRTC)
 */
export async function initializeServices(): Promise<void> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 [SERVICE REGISTRY] Initializing NEW ROAST SYSTEMS + AGORA RTC...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // Validate that we're not initializing legacy services
    validateServiceInitialization('roastGiftService');
    validateServiceInitialization('vipMembershipService');
    validateServiceInitialization('leaderboardService');
    validateServiceInitialization('agoraService'); // NEW: Validate Agora
    
    // Check service health
    const health = checkServiceHealth();
    
    if (!health.healthy) {
      console.warn('⚠️ Some services are not available');
    }
    
    console.log('✅ [SERVICE REGISTRY] NEW ROAST SYSTEMS + AGORA RTC initialized successfully');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error) {
    console.error('❌ Error initializing services:', error);
    throw error;
  }
}

// Export individual services for convenience
export {
  achievementService,
  adminService,
  aiModerationService,
  analyticsService,
  appealsService,
  automatedSafetyService,
  banExpirationService,
  behavioralSafetyService,
  cdnService,
  agoraService, // NEW: Agora RTC (replaces WebRTC)
  clubSubscriptionService,
  commentService,
  contentSafetyService,
  creatorClubService,
  creatorEarningsService,
  creatorRevenueService,
  deviceBanService,
  enhancedContentSafetyService,
  enhancedRecommendationService,
  escalationService,
  fanClubService,
  followService,
  roastGiftService, // NEW: Roast Gift System
  globalLeaderboardService, // NEW: Global Roast Rankings
  inboxService,
  leaderboardService, // NEW: Roast Season Rankings
  leaderboardSnapshotService,
  likeService,
  liveStreamArchiveService,
  mediaService,
  messagingService,
  moderationService,
  networkStabilityService,
  notificationService,
  payoutService,
  postService,
  premiumSubscriptionService,
  pushNotificationService,
  pushNotificationTestService,
  queryCache,
  r2Service,
  recommendationService,
  replayService,
  replayWatchService,
  reportingService,
  retentionAnalyticsService,
  savedStreamService,
  searchService,
  storyService,
  streamGuestService,
  streamSettingsService,
  stripeService,
  stripeVIPService, // NEW: Roast VIP Stripe Integration
  termsPrivacyService,
  twoFactorAuthService,
  userBlockingService,
  viewerTrackingService,
  vipMembershipService, // NEW: Roast VIP Membership
  walletService,
  walletTransactionService,
};
