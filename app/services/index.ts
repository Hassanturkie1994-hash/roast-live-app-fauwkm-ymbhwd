
// Export all services for easy importing
// 
// LEGACY SYSTEM SHUTDOWN:
// - All legacy services have been removed
// - Only NEW Roast systems are exported
// - Legacy service imports will cause build errors

export { achievementService } from './achievementService';
export { adminService } from './adminService';
export { aiModerationService } from './aiModerationService';
export { analyticsService } from './analyticsService';
export { appealsService } from './appealsService';
export { automatedSafetyService } from './automatedSafetyService';
export { banExpirationService } from './banExpirationService';
export { battleService } from './battleService';
export { behavioralSafetyService } from './behavioralSafetyService';
export { cdnService } from './cdnService';
export { agoraService } from './agoraService';
// Legacy export for backward compatibility
export { cloudflareService } from './agoraService';
export { clubSubscriptionService } from './clubSubscriptionService';
export { commentService } from './commentService';
export { communityGuidelinesService } from './communityGuidelinesService';
export { contentSafetyService } from './contentSafetyService';
export { creatorClubService } from './creatorClubService';
export { creatorEarningsService } from './creatorEarningsService';
export { creatorRevenueService } from './creatorRevenueService';
export { deviceBanService } from './deviceBanService';
export { enhancedContentSafetyService } from './enhancedContentSafetyService';
export { enhancedRecommendationService } from './enhancedRecommendationService';
export { escalationService } from './escalationService';
export { fanClubService } from './fanClubService';
export { followService } from './followService';
export { roastGiftService } from './roastGiftService'; // NEW: Roast Gift System
export { globalLeaderboardService } from './globalLeaderboardService'; // NEW: Global Roast Rankings
export { inboxService } from './inboxService';
export { leaderboardService } from './leaderboardService'; // NEW: Roast Season Rankings
export { leaderboardSnapshotService } from './leaderboardSnapshotService';
export { likeService } from './likeService';
export { liveStreamArchiveService } from './liveStreamArchiveService';
export { mediaService } from './mediaService';
export { messagingService } from './messagingService';
export { moderationService } from './moderationService';
export { networkStabilityService } from './networkStabilityService';
export { notificationService } from './notificationService';
export { payoutService } from './payoutService';
export { postService } from './postService';
export { premiumSubscriptionService } from './premiumSubscriptionService';
export { privateMessagingService } from './privateMessagingService';
export { pushNotificationService } from './pushNotificationService';
export { pushNotificationTestService } from './pushNotificationTestService';
export { queryCache } from './queryCache';
export { r2Service } from './r2Service';
export { recommendationService } from './recommendationService';
export { replayService } from './replayService';
export { replayWatchService } from './replayWatchService';
export { reportingService } from './reportingService';
export { retentionAnalyticsService } from './retentionAnalyticsService';
export { savedStreamService } from './savedStreamService';
export { searchService } from './searchService';
export { serviceRegistry } from './serviceRegistry';
export { storyService } from './storyService';
export { streamGuestService } from './streamGuestService';
export { streamService } from './streamService';
export { streamSettingsService } from './streamSettingsService';
export { stripeService } from './stripeService';
export { stripeVIPService } from './stripeVIPService'; // NEW: Roast VIP Stripe Integration
export { termsPrivacyService } from './termsPrivacyService';
export { twoFactorAuthService } from './twoFactorAuthService';
export { unifiedVIPClubService } from './unifiedVIPClubService'; // NEW: Unified VIP Club Service
export { userBlockingService } from './userBlockingService';
export { userReportingService } from './userReportingService';
export { viewerTrackingService } from './viewerTrackingService';
export { vipLevelService } from './vipLevelService'; // NEW: VIP Level Service
export { vipMembershipService } from './vipMembershipService'; // NEW: Roast VIP Membership
export { walletService } from './walletService';
export { walletTransactionService } from './walletTransactionService';
export { identityVerificationService } from './identityVerificationService'; // NEW: Identity Verification Service

// Export types that are commonly used
export type { AdminPenalty } from './adminService';
export type { MessageWithSender } from './privateMessagingService';
