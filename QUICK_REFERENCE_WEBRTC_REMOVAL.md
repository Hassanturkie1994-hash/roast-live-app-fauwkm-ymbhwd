
# Quick Reference: WebRTC Removal

## TL;DR

✅ **WebRTC is GONE**  
✅ **Agora SDK is the ONLY streaming engine**  
✅ **Supabase Realtime is for co-host signaling ONLY**

---

## What Was Removed

### Files Deprecated
1. `app/services/webRTCService.ts` - WebRTC peer connection service
2. `components/WebRTCLivePublisher.tsx` - WebRTC publisher component

### Dependencies Removed
- ❌ `react-native-webrtc` (was never in package.json)

### Code Patterns Removed
- ❌ `RTCPeerConnection`
- ❌ `RTCSessionDescription`
- ❌ `RTCIceCandidate`
- ❌ `mediaDevices.getUserMedia()`
- ❌ WebRTC signaling via Supabase Realtime

---

## What To Use Instead

### For Streaming
```typescript
// OLD (WebRTC) ❌
import { webRTCService } from '@/app/services/webRTCService';
await webRTCService.initialize(streamId, userId, isHost);
const localStream = webRTCService.getLocalStream();

// NEW (Agora) ✅
import { useAgoraEngine } from '@/hooks/useAgoraEngine';
const { engine, isJoined, remoteUids } = useAgoraEngine({
  streamTitle: 'My Stream',
  userId: user.id,
});
```

### For Video Rendering
```typescript
// OLD (WebRTC) ❌
import { RTCView } from 'react-native-webrtc';
<RTCView streamURL={stream.toURL()} />

// NEW (Agora) ✅
import { RtcSurfaceView, VideoSourceType } from 'react-native-agora';
<RtcSurfaceView
  canvas={{
    uid: 0,
    sourceType: VideoSourceType.VideoSourceCamera,
  }}
/>
```

### For Co-Host Signaling
```typescript
// OLD (WebRTC) ❌
// Signaling via Supabase Realtime with offers/answers/ICE candidates
channel.send({ event: 'offer', payload: { offer, targetUserId } });

// NEW (Supabase Realtime) ✅
// Signaling via streamGuestService (no WebRTC)
import { streamGuestService } from '@/app/services/streamGuestService';
await streamGuestService.inviteGuest(streamId, guestUserId, hostId);
await streamGuestService.acceptInvitation(streamId, guestUserId);
```

### For Remote Users
```typescript
// OLD (WebRTC) ❌
const remoteStreams = webRTCService.getRemoteStreams();
remoteStreams.forEach(stream => {
  // Render stream
});

// NEW (Agora) ✅
const { remoteUids } = useAgoraEngine({ ... });
remoteUids.map(uid => (
  <RtcSurfaceView
    key={uid}
    canvas={{
      uid,
      sourceType: VideoSourceType.VideoSourceRemote,
    }}
  />
));
```

---

## Common Errors & Solutions

### Error: "Unable to resolve module react-native-webrtc"
**Solution**: This error should NOT occur. If it does:
1. Search for `react-native-webrtc` in your code
2. Replace with Agora SDK equivalents
3. Clear Metro cache: `npm start -- --clear`

### Error: "webRTCService is not defined"
**Solution**: Replace with `useAgoraEngine` hook:
```typescript
// Before
import { webRTCService } from '@/app/services/webRTCService';

// After
import { useAgoraEngine } from '@/hooks/useAgoraEngine';
```

### Error: "RTCPeerConnection is not defined"
**Solution**: You're trying to use WebRTC. Use Agora instead:
```typescript
// Before
const pc = new RTCPeerConnection(config);

// After
const { engine } = useAgoraEngine({ ... });
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     STREAMING LAYER                         │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Agora RTC SDK (ONLY)                    │  │
│  │  - Video/Audio capture                               │  │
│  │  - Real-time streaming                               │  │
│  │  - Remote user management                            │  │
│  │  - Token-based authentication                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    SIGNALING LAYER                          │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Supabase Realtime (Co-Host Only)             │  │
│  │  - Guest invitation requests                         │  │
│  │  - Guest accept/reject responses                     │  │
│  │  - Guest kick notifications                          │  │
│  │  - Guest seat updates                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     BACKEND LAYER                           │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Supabase Edge Functions                      │  │
│  │  - start-live: Generate Agora token                  │  │
│  │  - stop-live: End stream                             │  │
│  │  - agora-token: Refresh token                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
app/
├── services/
│   ├── webRTCService.ts          ❌ DEPRECATED (stub only)
│   ├── streamGuestService.ts     ✅ Co-host signaling
│   └── agoraService.ts            ✅ Agora helpers (if needed)
│
├── hooks/
│   ├── useAgoraEngine.ts          ✅ Agora engine hook
│   ├── useAgoraEngine.native.ts   ✅ Native Agora hook
│   └── useStreamConnection.ts     ✅ Network monitoring
│
├── (tabs)/
│   ├── broadcast.tsx              ✅ Agora broadcast screen
│   └── broadcast.native.tsx       ✅ Native broadcast screen
│
└── components/
    ├── WebRTCLivePublisher.tsx    ❌ DEPRECATED (stub only)
    ├── VideoGrid.tsx              ✅ Agora video grid
    └── SafeAgoraView.tsx          ✅ Expo Go compatible view
```

---

## Testing Commands

```bash
# Clear cache and start
npm start -- --clear

# Build dev client (iOS)
npm run eas:dev:ios

# Build dev client (Android)
npm run eas:dev:android

# Run in Expo Go (mock mode)
npm start
# Scan QR code with Expo Go app
```

---

## Expo Go vs Dev Client

### Expo Go (Mock Mode)
- ✅ App boots without crashes
- ✅ Shows mock video preview
- ✅ Clear message: "Running in Expo Go - Mock mode active"
- ❌ No real streaming (Agora SDK not available)

### Dev Client (Full Functionality)
- ✅ Full Agora SDK functionality
- ✅ Real video/audio streaming
- ✅ Remote user tracking
- ✅ Token generation and channel join

---

## Need Help?

1. **Read the docs**:
   - [WEBRTC_REMOVAL_COMPLETE.md](./WEBRTC_REMOVAL_COMPLETE.md)
   - [WEBRTC_CLEANUP_VERIFICATION.md](./WEBRTC_CLEANUP_VERIFICATION.md)

2. **Search the codebase**:
   ```bash
   grep -r "react-native-webrtc" .
   grep -r "webRTCService" .
   ```

3. **Check the examples**:
   - `app/(tabs)/broadcast.tsx` - Full Agora implementation
   - `hooks/useAgoraEngine.ts` - Agora hook implementation

4. **Ask for help**:
   - Include error messages
   - Include relevant code snippets
   - Mention if you're using Expo Go or Dev Client

---

**Last Updated**: ${new Date().toISOString()}  
**Status**: ✅ COMPLETE
