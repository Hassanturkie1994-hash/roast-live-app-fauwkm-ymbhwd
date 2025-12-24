
/**
 * ⚠️ DEPRECATED - WebRTC Service Removed
 * 
 * This file has been removed as part of the migration to Agora RTC SDK.
 * 
 * MIGRATION COMPLETE:
 * ✅ All WebRTC peer connection logic removed
 * ✅ Agora SDK is now the sole streaming/media engine
 * ✅ Supabase Realtime used only for co-host signaling (requests/accept/reject/kick)
 * ✅ No more ICE candidates, offers, or answers via WebRTC
 * 
 * REPLACEMENT:
 * - For streaming: Use `useAgoraEngine` hook from `@/hooks/useAgoraEngine`
 * - For co-host signaling: Use `streamGuestService` from `@/app/services/streamGuestService`
 * - For remote users: Access `remoteUids` from `useAgoraEngine` hook
 * 
 * DO NOT RE-ENABLE THIS SERVICE.
 * If you need peer-to-peer features, implement them via Agora RTC SDK.
 */

export const webRTCService = {
  initialize: async () => {
    throw new Error('webRTCService is deprecated and native-only. Use Agora SDK instead.');
  },
  destroy: () => {
    console.warn('⚠️ webRTCService is deprecated. Use Agora SDK instead.');
  },
  getLocalStream: () => null,
  getRemoteStreams: () => [],
  toggleAudio: () => console.warn('⚠️ webRTCService is deprecated. Use Agora SDK instead.'),
  toggleVideo: () => console.warn('⚠️ webRTCService is deprecated. Use Agora SDK instead.'),
};
