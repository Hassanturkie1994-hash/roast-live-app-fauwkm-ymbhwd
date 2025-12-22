
# Agora Cloud Recording & Multi-Guest Streaming Implementation

## Overview

This document describes the implementation of Agora Cloud Recording with AWS S3 storage and multi-guest streaming capabilities (up to 10 simultaneous streamers) for the Roast Live app.

## Features Implemented

### 1. Agora Cloud Recording with AWS S3

#### Database Schema Changes
- Added columns to `streams` table:
  - `recording_resource_id`: Agora Cloud Recording resource ID from acquire endpoint
  - `recording_sid`: Agora Cloud Recording session ID from start endpoint
  - `recording_status`: Status of recording (not_started, recording, stopped, failed)
  - `recording_started_at`: Timestamp when recording started
  - `recording_stopped_at`: Timestamp when recording stopped

#### Edge Functions

**`/supabase/functions/agora-token/index.ts`** (NEW)
- Generates Agora RTC tokens securely
- Accepts: `channelName`, `uid`, `role` (publisher/subscriber)
- Returns: `{ token, channelName, uid, role, expiresAt }`
- Token expiration: 1 hour (3600 seconds)
- Uses `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE` from environment

**`/supabase/functions/start-live/index.ts`** (UPDATED)
- Generates Agora RTC token for publisher
- Acquires resource ID from Agora Cloud Recording API
- Starts recording to AWS S3 bucket
- Stores `recording_resource_id` and `recording_sid` in database
- Returns stream info with recording metadata

**`/supabase/functions/stop-live/index.ts`** (UPDATED)
- Retrieves `resource_id` and `sid` from database
- Stops Agora Cloud Recording
- Constructs S3 URL from recording file details
- Saves `playback_url` to database for replay functionality
- Updates recording status to 'stopped'

#### Environment Variables Required

```bash
# Agora RTC
AGORA_APP_ID=your_app_id
AGORA_APP_CERTIFICATE=your_app_certificate

# Agora Cloud Recording (REST API)
AGORA_CUSTOMER_KEY=your_customer_key
AGORA_CUSTOMER_SECRET=your_customer_secret

# AWS S3 Storage
AWS_S3_BUCKET=roast-live-recordings
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY=your_aws_access_key
AWS_SECRET_KEY=your_aws_secret_key
```

### 2. Multi-Guest Streaming (Up to 10 Users)

#### Dual-Stream Mode (Simulcast)
- Enabled dual-stream mode in Agora Engine
- High quality stream: Default resolution
- Low quality stream: 320x240, 15fps, 200kbps
- Automatic fallback for bandwidth optimization

#### VideoGrid Component (`components/VideoGrid.tsx`)
- Dynamic grid layout based on number of users:
  - **1 user**: Full screen
  - **2 users**: Split screen (vertical)
  - **3-4 users**: 2x2 Grid
  - **5-6 users**: 2x3 Grid
  - **7+ users**: 3-column Grid
- Tap to switch user to full screen
- Visual "Speaking Indicator" (green border) for active speakers
- "You" badge for local user

#### Bandwidth Optimization
- **Default behavior**: Subscribe to LOW quality streams when more than 2 users
- **Full screen mode**: Switch specific user to HIGH quality on tap
- **Automatic switching**: Revert to LOW quality when exiting full screen

#### Speaking Indicator
- Uses `onAudioVolumeIndication` event
- Threshold: Volume > 10
- Visual feedback: Green border + "🎤 Speaking" badge
- Auto-clears after 1 second of silence

#### Updated Hook (`hooks/useAgoraEngine.native.ts`)
- Tracks multiple remote users (`remoteUids: number[]`)
- Tracks speaking users (`speakingUids: number[]`)
- Provides `setRemoteVideoStreamType()` method to switch quality
- Automatically subscribes to LOW quality for 3+ users
- Enables audio volume indication for speaking detection

## Usage Examples

### Starting a Stream with Recording

```typescript
const { data, error } = await supabase.functions.invoke('start-live', {
  body: {
    title: 'My Live Stream',
    user_id: 'user-uuid',
  },
});

// Response:
// {
//   success: true,
//   stream: {
//     id: 'stream-id',
//     title: 'My Live Stream',
//     status: 'live',
//     channel_name: 'roast_user-uuid_1234567890',
//     recording: {
//       enabled: true,
//       resource_id: 'resource-id',
//       sid: 'session-id',
//     },
//   },
//   agora: {
//     token: 'agora-token',
//     channelName: 'roast_user-uuid_1234567890',
//     uid: 0,
//     appId: 'app-id',
//   },
// }
```

### Stopping a Stream and Retrieving Recording

```typescript
const { data, error } = await supabase.functions.invoke('stop-live', {
  body: {
    stream_id: 'stream-id',
  },
});

// Response:
// {
//   success: true,
//   message: 'Stream ended successfully',
//   playback_url: 'https://my-bucket.s3.amazonaws.com/recordings/channel_name/file.mp4',
// }
```

### Using VideoGrid Component

```typescript
import { VideoGrid } from '@/components/VideoGrid';
import { useAgoraEngine } from '@/hooks/useAgoraEngine';
import { VideoStreamType } from 'react-native-agora';

function BroadcastScreen() {
  const {
    remoteUids,
    speakingUids,
    setRemoteVideoStreamType,
  } = useAgoraEngine({
    streamTitle: 'My Stream',
    userId: 'user-id',
  });

  const [fullScreenUid, setFullScreenUid] = useState<number | null>(null);

  const handleUserTap = (uid: number) => {
    if (fullScreenUid === uid) {
      // Exit full screen
      setFullScreenUid(null);
      // Revert to LOW quality
      setRemoteVideoStreamType(uid, VideoStreamType.VideoStreamLow);
    } else {
      // Enter full screen
      setFullScreenUid(uid);
      // Switch to HIGH quality
      setRemoteVideoStreamType(uid, VideoStreamType.VideoStreamHigh);
    }
  };

  return (
    <VideoGrid
      localUid={0}
      remoteUids={remoteUids}
      onUserTap={handleUserTap}
      fullScreenUid={fullScreenUid}
      speakingUids={speakingUids}
    />
  );
}
```

### Generating Tokens (Alternative Method)

```typescript
const { data, error } = await supabase.functions.invoke('agora-token', {
  body: {
    channelName: 'my-channel',
    uid: 12345,
    role: 'publisher', // or 'subscriber'
  },
});

// Response:
// {
//   success: true,
//   token: 'agora-token',
//   channelName: 'my-channel',
//   uid: 12345,
//   role: 'publisher',
//   expiresAt: '2024-01-01T12:00:00.000Z',
// }
```

## Architecture

### Cloud Recording Flow

```
1. Client calls start-live edge function
   ↓
2. Edge function generates RTC token
   ↓
3. Edge function calls Agora API to acquire resource ID
   ↓
4. Edge function calls Agora API to start recording
   ↓
5. Recording metadata saved to database
   ↓
6. Client receives token and starts streaming
   ↓
7. Agora records stream to AWS S3
   ↓
8. Client calls stop-live edge function
   ↓
9. Edge function calls Agora API to stop recording
   ↓
10. Edge function retrieves file details and constructs S3 URL
    ↓
11. Playback URL saved to database
```

### Multi-Guest Streaming Flow

```
1. Host starts stream with useAgoraEngine hook
   ↓
2. Engine enables dual-stream mode
   ↓
3. Guest joins channel as broadcaster
   ↓
4. onUserJoined event fires
   ↓
5. Hook adds guest to remoteUids array
   ↓
6. If 3+ users, subscribe to LOW quality stream
   ↓
7. VideoGrid renders all users in dynamic layout
   ↓
8. User taps on guest to view full screen
   ↓
9. Switch guest to HIGH quality stream
   ↓
10. VideoGrid renders guest in full screen
    ↓
11. User taps again to exit full screen
    ↓
12. Revert guest to LOW quality stream
```

## Performance Considerations

### Bandwidth Optimization
- **Low quality stream**: 200 kbps per user
- **High quality stream**: ~1-2 Mbps per user
- **10 users (all low quality)**: ~2 Mbps total
- **10 users (1 high, 9 low)**: ~3-4 Mbps total

### Battery Optimization
- Dual-stream mode reduces CPU usage
- Low quality streams require less decoding
- Speaking indicator uses minimal resources

### Network Stability
- Agora automatically adjusts quality based on network conditions
- Dual-stream mode provides fallback options
- Recording continues even if client disconnects

## Testing Checklist

- [ ] Start stream and verify recording starts
- [ ] Stop stream and verify playback URL is saved
- [ ] Join stream with 2 users and verify split screen
- [ ] Join stream with 4 users and verify 2x2 grid
- [ ] Join stream with 10 users and verify 3-column grid
- [ ] Tap user to switch to full screen and verify HIGH quality
- [ ] Exit full screen and verify LOW quality
- [ ] Speak into microphone and verify speaking indicator
- [ ] Verify recording file appears in S3 bucket
- [ ] Verify playback URL works for replay

## Troubleshooting

### Recording Not Starting
- Check `AGORA_CUSTOMER_KEY` and `AGORA_CUSTOMER_SECRET` are set
- Check `AWS_ACCESS_KEY` and `AWS_SECRET_KEY` are set
- Check S3 bucket permissions allow Agora to write
- Check Agora Cloud Recording is enabled in console

### Poor Video Quality
- Check network bandwidth
- Verify dual-stream mode is enabled
- Check if subscribing to correct stream type
- Verify Agora SDK version is up to date

### Speaking Indicator Not Working
- Check `enableAudioVolumeIndication` is called
- Verify microphone permissions are granted
- Check volume threshold (default: 10)
- Verify audio is enabled in engine

## Future Enhancements

- [ ] Add recording quality settings (720p, 1080p)
- [ ] Add recording format options (HLS, MP4, FLV)
- [ ] Add recording pause/resume functionality
- [ ] Add recording thumbnail generation
- [ ] Add recording transcription
- [ ] Add recording analytics (watch time, engagement)
- [ ] Add recording monetization (pay-per-view)
- [ ] Add recording sharing (social media)
- [ ] Add recording editing (trim, merge, effects)
- [ ] Add recording live chat replay

## References

- [Agora Cloud Recording REST API](https://docs.agora.io/en/cloud-recording/restfulapi/)
- [Agora Dual-Stream Mode](https://docs.agora.io/en/video-calling/develop/product-workflow?platform=react-native#dual-stream-mode)
- [Agora Audio Volume Indication](https://docs.agora.io/en/video-calling/develop/product-workflow?platform=react-native#audio-volume-indication)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
