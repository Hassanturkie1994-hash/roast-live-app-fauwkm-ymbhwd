
/**
 * Service Registry
 * Central registry for all services to ensure they're properly initialized and accessible
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
import { cloudflareService } from './cloudflareService';
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
import { fetchGifts, purchaseGift, fetchGiftEvents } from './giftService';
import { giftTransactionService } from './giftTransactionService';
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

/**
 * Service Registry Object
 * All services are registered here for easy access and type safety
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
  cloudflare: cloudflareService,
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
  
  // Gifts & Monetization
  gift: {
    fetch: fetchGifts,
    purchase: purchaseGift,
    fetchEvents: fetchGiftEvents,
  },
  giftTransaction: giftTransactionService,
  wallet: walletService,
  walletTransaction: walletTransactionService,
  
  // Payments & Subscriptions
  stripe: stripeService,
  stripeVIP: stripeVIPService,
  payout: payoutService,
  premiumSubscription: premiumSubscriptionService,
  vipMembership: vipMembershipService,
  
  // Creator Features
  creatorClub: creatorClubService,
  creatorEarnings: creatorEarningsService,
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
  
  // Leaderboards & Rankings
  leaderboard: leaderboardService,
  globalLeaderboard: globalLeaderboardService,
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
 */
export function checkServiceHealth(): {
  healthy: boolean;
  services: Record<string, boolean>;
} {
  const services: Record<string, boolean> = {};
  
  // Check critical services
  services.achievement = !!ServiceRegistry.achievement;
  services.admin = !!ServiceRegistry.admin;
  services.cloudflare = !!ServiceRegistry.cloudflare;
  services.stream = !!ServiceRegistry.stream;
  services.wallet = !!ServiceRegistry.wallet;
  services.stripe = !!ServiceRegistry.stripe;
  services.moderation = !!ServiceRegistry.moderation;
  services.notification = !!ServiceRegistry.notification;
  
  const healthy = Object.values(services).every(status => status);
  
  if (!healthy) {
    console.error('❌ Service health check failed:', services);
  } else {
    console.log('✅ All critical services are healthy');
  }
  
  return { healthy, services };
}

/**
 * Initialize all services
 * Call this on app startup to ensure services are ready
 */
export async function initializeServices(): Promise<void> {
  console.log('🚀 Initializing services...');
  
  try {
    // Check service health
    const health = checkServiceHealth();
    
    if (!health.healthy) {
      console.warn('⚠️ Some services are not available');
    }
    
    console.log('✅ Services initialized successfully');
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
  cloudflareService,
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
  giftTransactionService,
  globalLeaderboardService,
  inboxService,
  leaderboardService,
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
  stripeVIPService,
  termsPrivacyService,
  twoFactorAuthService,
  userBlockingService,
  viewerTrackingService,
  vipMembershipService,
  walletService,
  walletTransactionService,
};
