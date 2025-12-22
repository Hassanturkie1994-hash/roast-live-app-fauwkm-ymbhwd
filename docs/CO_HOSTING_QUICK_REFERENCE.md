
# Co-Hosting Quick Reference

## Services

### cloudflareCallsService
```typescript
import { cloudflareCallsService } from '@/app/services/cloudflareCallsService';

// Create session
const result = await cloudflareCallsService.createSession(streamId);

// Generate token
const token = await cloudflareCallsService.generateToken(sessionId, userId, 'host');

// End session
await cloudflareCallsService.endSession(sessionId);
```

### webRTCService
```typescript
import { webRTCService } from '@/app/services/webRTCService';

// Initialize (host)
await webRTCService.initialize(streamId, userId, true);

// Create peer connection for guest
await webRTCService.createPeerConnectionForGuest(guestUserId);

// Get remote streams
const streams = webRTCService.getRemoteStreams();

// Toggle audio/video
webRTCService.toggleAudio(false); // mute
webRTCService.toggleVideo(false); // disable camera

// Cleanup
webRTCService.destroy();
```

### streamGuestService
```typescript
import { streamGuestService } from '@/app/services/streamGuestService';

// Invite guest
const result = await streamGuestService.inviteGuest(streamId, hostId, guestId);

// Accept invitation
const result = await streamGuestService.acceptInvitation(invitationId, userId);

// Leave seat
await streamGuestService.leaveGuestSeat(streamId, userId);

// Remove guest (host only)
await streamGuestService.removeGuest(streamId, guestId, hostId);

// Update mic status
await streamGuestService.updateMicStatus(streamId, userId, false);

// Update camera status
await streamGuestService.updateCameraStatus(streamId, userId, false);

// Get active guests
const guests = await streamGuestService.getActiveGuestSeats(streamId);

// Subscribe to guest events
const channel = streamGuestService.subscribeToGuestEvents(streamId, (payload) => {
  console.log('Guest event:', payload);
});
```

## Components

### WebRTCLivePublisher
```typescript
import WebRTCLivePublisher from '@/components/WebRTCLivePublisher';

<WebRTCLivePublisher
  streamId={streamId}
  userId={userId}
  isHost={true}
  guestUserIds={['guest-1', 'guest-2']}
  onStreamReady={() => console.log('Ready')}
  onStreamError={(error) => console.error(error)}
  onGuestConnected={(id) => console.log('Guest connected:', id)}
  onGuestDisconnected={(id) => console.log('Guest disconnected:', id)}
/>
```

### GuestSeatGrid
```typescript
import GuestSeatGrid from '@/components/GuestSeatGrid';

<GuestSeatGrid
  hostName="John Doe"
  hostAvatarUrl="https://..."
  guests={activeGuests}
  streamId={streamId}
  hostId={hostId}
  isHost={true}
  onRefresh={loadActiveGuests}
  onEmptySeatPress={() => setShowInviteModal(true)}
/>
```

## Edge Functions

### create-call-session
```bash
curl -X POST https://your-project.supabase.co/functions/v1/create-call-session \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"streamId": "uuid"}'
```

### generate-call-token
```bash
curl -X POST https://your-project.supabase.co/functions/v1/generate-call-token \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "call-uuid", "userId": "uuid", "role": "host"}'
```

### end-call-session
```bash
curl -X POST https://your-project.supabase.co/functions/v1/end-call-session \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "call-uuid"}'
```

## Database Queries

### Get Active Guests
```sql
SELECT * FROM stream_guest_seats
WHERE stream_id = 'uuid'
  AND left_at IS NULL
ORDER BY seat_index ASC;
```

### Get Pending Invitations
```sql
SELECT * FROM stream_guest_invitations
WHERE invitee_id = 'uuid'
  AND status = 'pending'
  AND expires_at > NOW()
ORDER BY created_at DESC;
```

### Get Guest Events
```sql
SELECT * FROM stream_guest_events
WHERE stream_id = 'uuid'
ORDER BY created_at DESC
LIMIT 50;
```

## Realtime Channels

### Guest Events Channel
```typescript
const channel = supabase
  .channel(`stream:${streamId}:guest_events`)
  .on('broadcast', { event: 'guest_joined' }, (payload) => {
    console.log('Guest joined:', payload);
  })
  .on('broadcast', { event: 'guest_left' }, (payload) => {
    console.log('Guest left:', payload);
  })
  .subscribe();
```

### WebRTC Signaling Channel
```typescript
const channel = supabase
  .channel(`stream:${streamId}:webrtc_signaling`)
  .on('broadcast', { event: 'offer' }, (payload) => {
    // Handle WebRTC offer
  })
  .on('broadcast', { event: 'answer' }, (payload) => {
    // Handle WebRTC answer
  })
  .on('broadcast', { event: 'ice_candidate' }, (payload) => {
    // Handle ICE candidate
  })
  .subscribe();
```

## Common Patterns

### Host Flow
```typescript
// 1. Start stream
const { streamId } = await startStream(title, contentLabel);

// 2. Create call session
const session = await cloudflareCallsService.createSession(streamId);

// 3. Initialize WebRTC
await webRTCService.initialize(streamId, userId, true);

// 4. Invite guest
await streamGuestService.inviteGuest(streamId, hostId, guestId);

// 5. Create peer connection when guest accepts
await webRTCService.createPeerConnectionForGuest(guestId);

// 6. Composite video feeds locally
const remoteStreams = webRTCService.getRemoteStreams();
// Mix local + remote streams

// 7. Send composite to Cloudflare Stream via RTMP
// (handled by WebRTCLivePublisher)
```

### Guest Flow
```typescript
// 1. Receive invitation
// (via Supabase Realtime notification)

// 2. Accept invitation
const result = await streamGuestService.acceptInvitation(invitationId, userId);

// 3. Initialize WebRTC
await webRTCService.initialize(streamId, userId, false);

// 4. Join as guest
await webRTCService.joinAsGuest(hostUserId);

// 5. Wait for WebRTC connection
// (handled automatically via signaling)

// 6. You're live!
// Your video/audio is sent to host
```

## Error Codes

| Code | Message | Solution |
|------|---------|----------|
| `SEATS_LOCKED` | Seats are currently locked | Wait for host to unlock |
| `SEATS_FULL` | All guest seats are full | Wait for a seat to open |
| `INVITATION_EXPIRED` | Invitation has expired | Request new invitation |
| `WEBRTC_FAILED` | WebRTC connection failed | Check network and retry |
| `PERMISSION_DENIED` | Camera/mic permission denied | Grant permissions in settings |
| `NOT_AUTHORIZED` | Not authorized to perform action | Only host can do this |

## Performance Tips

### For Hosts
- Limit to 2-3 guests for best quality
- Use WiFi instead of cellular
- Close other apps to free up resources
- Use a modern device (iPhone 12+, flagship Android)
- Monitor stream health dashboard

### For Guests
- Use headphones to prevent echo
- Ensure good lighting
- Stable internet connection (5+ Mbps upload)
- Mute when not speaking
- Disable camera if connection is poor

## Testing Checklist

- [ ] Host can invite guest
- [ ] Guest receives invitation notification
- [ ] Guest can accept invitation
- [ ] Guest can decline invitation
- [ ] Guest appears on stream
- [ ] Guest audio is synchronized
- [ ] Guest video is clear
- [ ] Host can mute guest
- [ ] Host can disable guest camera
- [ ] Host can remove guest
- [ ] Guest can leave voluntarily
- [ ] Multiple guests work simultaneously
- [ ] Seats lock/unlock correctly
- [ ] Invitation expires after 20 seconds
- [ ] WebRTC reconnects on network issues
