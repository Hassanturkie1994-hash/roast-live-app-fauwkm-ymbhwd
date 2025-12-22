
# Co-Hosting Architecture - Roast Live

## Overview

This document explains the co-hosting architecture for Roast Live, which allows multiple participants (Host + Guests) to appear in a single live stream.

## Architecture Decision

**OPTION B: Cloudflare Calls + Local Mixing**

We use a hybrid approach:
1. **Cloudflare Calls (WebRTC)** for real-time guest audio/video communication
2. **Local video compositing** on the host's device to mix host + guest feeds
3. **Cloudflare Stream** for broadcasting the composite feed to viewers

### Why This Approach?

- ✅ **Real-time communication**: WebRTC provides low-latency audio/video for guests
- ✅ **Scalable**: Cloudflare Stream handles viewer distribution
- ✅ **Cost-effective**: No server-side video mixing required
- ✅ **Flexible**: Host controls the composite layout
- ✅ **Existing infrastructure**: Leverages current Cloudflare Stream setup

## Components

### 1. Services

#### `cloudflareCallsService.ts`
Manages Cloudflare Calls sessions for WebRTC co-hosting.

**Methods:**
- `createSession(streamId)` - Creates a WebRTC session for the stream
- `generateToken(sessionId, userId, role)` - Generates auth token for participants
- `endSession(sessionId)` - Ends the WebRTC session

#### `webRTCService.ts`
Manages WebRTC peer connections and media streams.

**Methods:**
- `initialize(streamId, userId, isHost)` - Initializes WebRTC with local media
- `createPeerConnectionForGuest(guestUserId)` - Host creates connection for guest
- `joinAsGuest(hostUserId)` - Guest joins the host's session
- `getLocalStream()` - Returns local camera/mic stream
- `getRemoteStreams()` - Returns all guest streams (for host)
- `toggleAudio(enabled)` - Mute/unmute local audio
- `toggleVideo(enabled)` - Enable/disable local video
- `disconnectGuest(guestUserId)` - Host removes a guest
- `destroy()` - Cleanup all connections

#### `streamGuestService.ts` (Existing)
Manages guest seat database operations.

**Methods:**
- `inviteGuest(streamId, inviterId, inviteeId)` - Send invitation
- `acceptInvitation(invitationId, userId)` - Guest accepts invitation
- `leaveGuestSeat(streamId, userId)` - Guest leaves
- `removeGuest(streamId, userId, hostId)` - Host removes guest
- `updateMicStatus(streamId, userId, enabled)` - Update mic state
- `updateCameraStatus(streamId, userId, enabled)` - Update camera state

### 2. Edge Functions

#### `create-call-session`
Creates a Cloudflare Calls session when stream starts.

**Input:**
```json
{
  "streamId": "uuid"
}
```

**Output:**
```json
{
  "success": true,
  "session": {
    "sessionId": "call-uuid",
    "sessionDescription": "WebRTC session for co-hosting",
    "tracks": []
  }
}
```

#### `generate-call-token`
Generates authentication token for participants.

**Input:**
```json
{
  "sessionId": "call-uuid",
  "userId": "uuid",
  "role": "host" | "guest"
}
```

**Output:**
```json
{
  "success": true,
  "token": "jwt-token",
  "expiresAt": "2024-01-01T00:00:00Z"
}
```

#### `end-call-session`
Ends the WebRTC session when stream ends.

**Input:**
```json
{
  "sessionId": "call-uuid"
}
```

**Output:**
```json
{
  "success": true,
  "message": "Call session ended successfully"
}
```

### 3. Components

#### `WebRTCLivePublisher`
Manages WebRTC connections and renders video streams.

**Props:**
- `streamId` - Stream identifier
- `userId` - Current user ID
- `isHost` - Whether user is the host
- `guestUserIds` - Array of guest user IDs
- `onStreamReady` - Callback when WebRTC is ready
- `onStreamError` - Callback on error
- `onGuestConnected` - Callback when guest connects
- `onGuestDisconnected` - Callback when guest disconnects

**Behavior:**
- **For Host**: Captures local camera, creates peer connections for guests, receives guest streams
- **For Guest**: Captures local camera, connects to host, sends stream to host

#### `GuestSeatGrid` (Existing)
Displays host and guest participants in a grid layout.

**Features:**
- Dynamic grid layout (1x1, 1x2, 2x2, 2x3, 3x3)
- Shows mic/camera status for each participant
- Long-press for host to manage guests
- Empty seat indicators

## Flow Diagrams

### Host Starting Stream with Co-Hosting

```
1. Host taps "Go Live"
   ↓
2. start-live edge function creates Cloudflare Stream Live Input
   ↓
3. Stream record created in database
   ↓
4. Host starts broadcasting to Cloudflare Stream (RTMP)
   ↓
5. Viewers watch via Cloudflare Stream (HLS)
   ↓
6. Host invites Guest
   ↓
7. create-call-session creates WebRTC session
   ↓
8. Guest accepts invitation
   ↓
9. Guest joins WebRTC session
   ↓
10. Host receives guest video/audio via WebRTC
    ↓
11. Host composites local + guest feeds
    ↓
12. Composite feed sent to Cloudflare Stream
    ↓
13. Viewers see host + guest together
```

### Guest Joining Flow

```
1. Guest receives invitation notification
   ↓
2. Guest taps "Accept"
   ↓
3. streamGuestService.acceptInvitation() creates seat record
   ↓
4. generate-call-token creates auth token for guest
   ↓
5. webRTCService.joinAsGuest() initializes WebRTC
   ↓
6. Guest captures local camera/mic
   ↓
7. WebRTC signaling via Supabase Realtime
   ↓
8. Peer connection established (Guest ↔ Host)
   ↓
9. Guest sends video/audio to host
   ↓
10. Host composites guest feed into broadcast
    ↓
11. Viewers see guest on stream
```

### Signaling Flow (WebRTC)

```
Host                    Supabase Realtime              Guest
  |                            |                         |
  |-- createPeerConnection --->|                         |
  |                            |                         |
  |-- send OFFER ------------->|-- broadcast OFFER ----->|
  |                            |                         |
  |                            |<-- send ANSWER ---------|
  |<-- broadcast ANSWER -------|                         |
  |                            |                         |
  |-- send ICE_CANDIDATE ----->|-- broadcast ICE ------->|
  |                            |                         |
  |<-- broadcast ICE ----------|<-- send ICE_CANDIDATE --|
  |                            |                         |
  |<========== CONNECTED ===================>|
  |                            |                         |
  |<-- receive video/audio ----|-- send video/audio ---->|
```

## Database Schema

### `stream_guest_seats`
Tracks guest participants in streams.

**Columns:**
- `id` - UUID primary key
- `stream_id` - Reference to streams table
- `user_id` - Guest user ID
- `seat_index` - Position in grid (0-8)
- `joined_at` - When guest joined
- `left_at` - When guest left (null if active)
- `is_moderator` - Whether guest has mod powers
- `mic_enabled` - Mic status
- `camera_enabled` - Camera status
- `muted_by_host` - Host muted guest
- `camera_disabled_by_host` - Host disabled guest camera

### `stream_guest_invitations`
Tracks guest invitations.

**Columns:**
- `id` - UUID primary key
- `stream_id` - Reference to streams table
- `inviter_id` - Host user ID
- `invitee_id` - Guest user ID
- `seat_index` - Assigned seat position
- `status` - pending, accepted, declined, expired
- `expires_at` - Invitation expiration (20 seconds)
- `responded_at` - When guest responded

### `stream_guest_events`
Logs guest events for chat integration.

**Columns:**
- `id` - UUID primary key
- `stream_id` - Reference to streams table
- `user_id` - Guest user ID
- `event_type` - joined_live, left_live, muted_mic, etc.
- `display_name` - Guest display name
- `metadata` - Additional event data

## Implementation Status

### ✅ Completed

1. **Database Schema** - Guest tables exist and have RLS policies
2. **Guest Service** - Full CRUD operations for guest management
3. **Cloudflare Calls Service** - Session management (placeholder)
4. **WebRTC Service** - Peer connection management
5. **WebRTC Publisher Component** - Video rendering and compositing
6. **Edge Functions** - create-call-session, generate-call-token, end-call-session
7. **UI Integration** - Broadcast screen updated with WebRTC support
8. **Guest Seat Grid** - Visual representation of participants

### 🚧 TODO (Production)

1. **Cloudflare Calls API Integration**
   - Replace placeholder edge functions with actual Cloudflare Calls API calls
   - Add CF_CALLS_APP_ID and CF_CALLS_APP_SECRET to environment variables
   - Implement proper JWT token generation

2. **Video Compositing**
   - Implement canvas-based video mixing on host device
   - Add layout options (side-by-side, picture-in-picture, grid)
   - Optimize performance for multiple streams

3. **RTMP Encoding**
   - Encode composite video feed to RTMP
   - Send to Cloudflare Stream ingest endpoint
   - Handle encoding errors and fallbacks

4. **Guest UI**
   - Create guest view screen
   - Show host's composite feed
   - Add guest self-controls (mute, camera, leave)

5. **Error Handling**
   - Handle network disconnections
   - Implement reconnection logic
   - Fallback to solo streaming if WebRTC fails

6. **Testing**
   - Test with multiple guests (2-9 participants)
   - Test network conditions (poor connectivity)
   - Test on different devices (iOS, Android)

## Environment Variables

Add these to Supabase Edge Function secrets:

```bash
# Cloudflare Calls (for WebRTC)
CF_CALLS_APP_ID=your_app_id
CF_CALLS_APP_SECRET=your_app_secret

# Cloudflare Stream (existing)
CF_ACCOUNT_ID=your_account_id
CF_API_TOKEN=your_api_token
```

## Usage Example

### Host Inviting Guest

```typescript
import { streamGuestService } from '@/app/services/streamGuestService';

// Host invites a viewer
const result = await streamGuestService.inviteGuest(
  streamId,
  hostUserId,
  guestUserId
);

if (result.success) {
  console.log('Invitation sent!');
}
```

### Guest Accepting Invitation

```typescript
import { streamGuestService } from '@/app/services/streamGuestService';

// Guest accepts invitation
const result = await streamGuestService.acceptInvitation(
  invitationId,
  guestUserId
);

if (result.success) {
  console.log('Joined as guest!');
  // WebRTC connection will be established automatically
}
```

### Host Managing Guest

```typescript
import { streamGuestService } from '@/app/services/streamGuestService';

// Mute guest
await streamGuestService.updateMicStatus(streamId, guestUserId, false);

// Disable guest camera
await streamGuestService.updateCameraStatus(streamId, guestUserId, false);

// Remove guest
await streamGuestService.removeGuest(streamId, guestUserId, hostUserId);
```

## Performance Considerations

### Host Device Requirements

- **CPU**: Compositing multiple video feeds is CPU-intensive
- **Memory**: Each guest stream requires ~50-100MB RAM
- **Network**: Upload bandwidth = (bitrate × number of guests) + RTMP stream
- **Recommended**: Modern devices (iPhone 12+, Android flagship)

### Optimization Strategies

1. **Limit Guests**: Maximum 9 guests (3x3 grid)
2. **Reduce Resolution**: Guest feeds at 480p, composite at 720p
3. **Adaptive Bitrate**: Reduce quality on poor network
4. **Hardware Encoding**: Use device GPU for encoding
5. **Fallback**: Disable co-hosting if device struggles

## Security Considerations

1. **Authentication**: All WebRTC tokens are user-specific and time-limited
2. **Authorization**: Only host can invite/remove guests
3. **RLS Policies**: Database enforces guest seat permissions
4. **Signaling**: Supabase Realtime channels are private
5. **Media**: WebRTC uses DTLS-SRTP encryption

## Troubleshooting

### Guest Can't Connect

1. Check network connectivity
2. Verify invitation hasn't expired (20 seconds)
3. Check if seats are locked
4. Verify WebRTC permissions (camera/mic)
5. Check Supabase Realtime connection

### Poor Video Quality

1. Reduce number of guests
2. Lower video resolution
3. Check upload bandwidth
4. Disable guest cameras (audio-only)
5. Use wired connection if possible

### Audio Echo/Feedback

1. Ensure guests use headphones
2. Enable echo cancellation in WebRTC
3. Reduce audio gain
4. Mute guests when not speaking

## Future Enhancements

1. **Screen Sharing**: Allow guests to share screen
2. **Virtual Backgrounds**: Add background blur/replacement
3. **Audio Mixing**: Advanced audio processing (noise reduction, EQ)
4. **Recording**: Save co-hosted streams with all participants
5. **Analytics**: Track guest engagement and performance
6. **Layouts**: Multiple layout options (grid, spotlight, sidebar)

## References

- [Cloudflare Calls Documentation](https://developers.cloudflare.com/calls/)
- [Cloudflare Stream Documentation](https://developers.cloudflare.com/stream/)
- [WebRTC Documentation](https://webrtc.org/)
- [react-native-webrtc](https://github.com/react-native-webrtc/react-native-webrtc)
