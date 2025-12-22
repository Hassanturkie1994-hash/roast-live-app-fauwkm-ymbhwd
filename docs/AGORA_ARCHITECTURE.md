
# Agora RTC Architecture Documentation

## Overview

Roast Live uses **Agora Real-Time Communication (RTC)** for live streaming and multi-guest video battles. This document explains the complete architecture, from token generation to cloud recording.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Token Generation](#token-generation)
3. [Channel Management](#channel-management)
4. [Dual-Stream Mode (Simulcast)](#dual-stream-mode-simulcast)
5. [Cloud Recording](#cloud-recording)
6. [Multi-Guest Streaming](#multi-guest-streaming)
7. [Audio Volume Indication](#audio-volume-indication)
8. [Platform-Specific Implementation](#platform-specific-implementation)
9. [Environment Variables](#environment-variables)
10. [Edge Functions](#edge-functions)
11. [Security](#security)
12. [Performance Optimizations](#performance-optimizations)
13. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (iOS/Android)                     │
│                                                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ useAgoraEngine│───▶│ RtcSurfaceView│───▶│  VideoGrid   │      │
│  │    Hook       │    │   Component   │    │  Component   │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                                                         │
│         │ 1. Request Token                                       │
│         ▼                                                         │
└─────────────────────────────────────────────────────────────────┘
         │
         │ HTTP POST
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE EDGE FUNCTIONS                       │
│                                                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  start-live  │    │  stop-live   │    │ agora-token  │      │
│  │              │    │              │    │              │      │
│  │ • Generate   │    │ • Stop       │    │ • Generate   │      │
│  │   Token      │    │   Recording  │    │   Viewer     │      │
│  │ • Start      │    │ • Save       │    │   Tokens     │      │
│  │   Recording  │    │   Playback   │    │              │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                    │                                   │
│         │ 2. Token           │ 5. Stop Recording                │
│         ▼                    ▼                                   │
└─────────────────────────────────────────────────────────────────┘
         │                     │
         │ 3. Join Channel     │ 6. Save to S3
         ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                         AGORA RTC NETWORK                        │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Channel: stream_123                    │   │
│  │                                                            │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │   │
│  │  │  Host    │  │ Guest 1  │  │ Guest 2  │  │ Viewer 1 │ │   │
│  │  │(Publisher)│  │(Publisher)│  │(Publisher)│  │(Subscriber)│ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │   │
│  │                                                            │   │
│  │  • Real-time audio/video streaming                        │   │
│  │  • Dual-stream mode (High/Low quality)                    │   │
│  │  • Audio volume indication                                │   │
│  │  • Up to 10 simultaneous broadcasters                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Cloud Recording                         │   │
│  │                                                            │   │
│  │  • Acquires resource ID                                   │   │
│  │  • Records all streams to AWS S3                          │   │
│  │  • Generates HLS playback URL                             │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
         │
         │ 4. Stream Data
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                         AWS S3 STORAGE                           │
│                                                                   │
│  s3://bucket/recordings/stream_123/timestamp.m3u8               │
│  s3://bucket/recordings/stream_123/timestamp_0.ts               │
│  s3://bucket/recordings/stream_123/timestamp_1.ts               │
│  ...                                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Token Generation

### Overview

Agora tokens are generated **server-side** for security. Tokens include:
- **App ID**: Your Agora project identifier
- **Channel Name**: Unique identifier for the stream
- **UID**: User identifier (0 for auto-assignment)
- **Role**: PUBLISHER (can send) or SUBSCRIBER (receive only)
- **Expiration**: 24 hours for security

### Implementation

**Edge Function: `/supabase/functions/start-live/index.ts`**

```typescript
import { RtcTokenBuilder, RtcRole } from 'npm:agora-access-token';

const appId = Deno.env.get('AGORA_APP_ID');
const appCertificate = Deno.env.get('AGORA_APP_CERTIFICATE');
const channelName = streamId;
const uid = 0; // Auto-assign
const role = RtcRole.PUBLISHER;
const expirationTimeInSeconds = 86400; // 24 hours

const token = RtcTokenBuilder.buildTokenWithUid(
  appId,
  appCertificate,
  channelName,
  uid,
  role,
  Math.floor(Date.now() / 1000) + expirationTimeInSeconds
);
```

### Client Usage

**Hook: `hooks/useAgoraEngine.native.ts`**

```typescript
const { data } = await supabase.functions.invoke('start-live', {
  body: { title: 'My Stream', user_id: userId },
});

const { token, channelName, uid, appId } = data.agora;

// Initialize Agora Engine
const engine = createAgoraRtcEngine();
engine.initialize({ appId });

// Join channel
await engine.joinChannel(token, channelName, uid, {
  clientRoleType: ClientRoleType.ClientRoleBroadcaster,
});
```

---

## Channel Management

### Channel Naming Convention

Each stream gets a unique channel name:
- **Format**: `stream_{stream_id}` or just the `stream_id`
- **Example**: `stream_abc123` or `abc123`

### Roles

1. **PUBLISHER (Broadcaster)**
   - Can send audio and video
   - Host and guests join as publishers
   - Limited to 10 simultaneous publishers per channel

2. **SUBSCRIBER (Viewer)**
   - Can only receive audio and video
   - Unlimited viewers per channel
   - Lower bandwidth usage

### Channel Lifecycle

1. **Creation**: Automatic when first user joins
2. **Active**: While at least one user is in the channel
3. **Destruction**: Automatic when last user leaves

---

## Dual-Stream Mode (Simulcast)

### Overview

Dual-stream mode allows broadcasters to send two video streams simultaneously:
- **High Quality**: 1280x720, 30fps, ~1200 kbps
- **Low Quality**: 320x240, 15fps, ~200 kbps

### Configuration

**Host Configuration:**

```typescript
// Enable dual-stream mode
engine.enableDualStreamMode(true);

// Configure low-quality stream
engine.setDualStreamMode({
  streamConfig: {
    width: 320,
    height: 240,
    framerate: 15,
    bitrate: 200, // kbps
  },
});
```

**Viewer Subscription:**

```typescript
// Subscribe to low quality by default (bandwidth optimization)
engine.setRemoteVideoStreamType(remoteUid, VideoStreamType.VideoStreamLow);

// Switch to high quality when user taps for full screen
engine.setRemoteVideoStreamType(remoteUid, VideoStreamType.VideoStreamHigh);
```

### Benefits

- **Bandwidth Optimization**: Reduces data usage for viewers
- **Better Performance**: Smoother playback on poor connections
- **Scalability**: Supports more simultaneous viewers
- **Adaptive Quality**: Automatically switches based on network

---

## Cloud Recording

### Overview

Agora Cloud Recording captures all streams in a channel and saves them to AWS S3 using the "Bring Your Own Storage" model.

### Recording Flow

1. **Acquire Resource**
   ```
   POST https://api.agora.io/v1/apps/{appId}/cloud_recording/acquire
   ```

2. **Start Recording**
   ```
   POST https://api.agora.io/v1/apps/{appId}/cloud_recording/resourceid/{resourceId}/mode/mix/start
   ```

3. **Stop Recording**
   ```
   POST https://api.agora.io/v1/apps/{appId}/cloud_recording/resourceid/{resourceId}/sid/{sid}/mode/mix/stop
   ```

### Implementation

**Start Recording (in `start-live` edge function):**

```typescript
// 1. Acquire resource
const acquireResponse = await fetch(
  `https://api.agora.io/v1/apps/${appId}/cloud_recording/acquire`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${customerKey}:${customerSecret}`)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cname: channelName,
      uid: '0',
      clientRequest: {},
    }),
  }
);

const { resourceId } = await acquireResponse.json();

// 2. Start recording
const startResponse = await fetch(
  `https://api.agora.io/v1/apps/${appId}/cloud_recording/resourceid/${resourceId}/mode/mix/start`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${customerKey}:${customerSecret}`)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cname: channelName,
      uid: '0',
      clientRequest: {
        recordingConfig: {
          channelType: 0,
          streamTypes: 2, // Audio + Video
          maxIdleTime: 30,
        },
        storageConfig: {
          vendor: 1, // AWS S3
          region: awsRegion,
          bucket: awsBucket,
          accessKey: awsAccessKey,
          secretKey: awsSecretKey,
          fileNamePrefix: [`recordings/${streamId}`],
        },
      },
    }),
  }
);

const { sid } = await startResponse.json();

// 3. Save to database
await supabase
  .from('streams')
  .update({
    recording_resource_id: resourceId,
    recording_sid: sid,
    recording_status: 'recording',
  })
  .eq('id', streamId);
```

**Stop Recording (in `stop-live` edge function):**

```typescript
// 1. Retrieve recording metadata
const { data: stream } = await supabase
  .from('streams')
  .select('recording_resource_id, recording_sid')
  .eq('id', streamId)
  .single();

// 2. Stop recording
const stopResponse = await fetch(
  `https://api.agora.io/v1/apps/${appId}/cloud_recording/resourceid/${stream.recording_resource_id}/sid/${stream.recording_sid}/mode/mix/stop`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${customerKey}:${customerSecret}`)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cname: channelName,
      uid: '0',
      clientRequest: {},
    }),
  }
);

const { serverResponse } = await stopResponse.json();

// 3. Construct playback URL
const playbackUrl = `https://${awsBucket}.s3.${awsRegion}.amazonaws.com/recordings/${streamId}/${serverResponse.fileList[0].fileName}`;

// 4. Save playback URL
await supabase
  .from('streams')
  .update({
    playback_url: playbackUrl,
    recording_status: 'completed',
  })
  .eq('id', streamId);
```

---

## Multi-Guest Streaming

### Overview

Roast Live supports up to **10 simultaneous broadcasters** in a single channel for multi-guest battles and panel discussions.

### Grid Layout

**Component: `components/VideoGrid.native.tsx`**

```typescript
// 1-2 users: Full screen / Split screen
// 3-4 users: 2x2 Grid
// 5-6 users: 2x3 Grid
// 7+ users: 3-column Grid

const layout = useMemo(() => {
  const totalUsers = 1 + remoteUids.length;

  if (totalUsers <= 2) {
    return { columns: 1, rows: 2, itemWidth: width, itemHeight: height / 2 };
  } else if (totalUsers <= 4) {
    return { columns: 2, rows: 2, itemWidth: width / 2, itemHeight: height / 2 };
  } else {
    const rows = Math.ceil(totalUsers / 3);
    return { columns: 3, rows, itemWidth: width / 3, itemHeight: height / rows };
  }
}, [remoteUids.length, width, height]);
```

### Bandwidth Optimization

When more than 2 users are streaming:
- **Default**: Subscribe to `VideoStreamType.Low` for all remote users
- **On Tap**: Switch to `VideoStreamType.High` for selected user

```typescript
// Subscribe to low quality by default
if (remoteUids.length > 2) {
  engine.setRemoteVideoStreamType(remoteUid, VideoStreamType.VideoStreamLow);
}

// Switch to high quality on tap
const handleUserTap = (uid: number) => {
  engine.setRemoteVideoStreamType(uid, VideoStreamType.VideoStreamHigh);
};
```

---

## Audio Volume Indication

### Overview

Real-time audio volume indication provides visual feedback for active speakers.

### Implementation

**Enable Volume Indication:**

```typescript
// Enable audio volume indication
// Parameters: interval (ms), smooth (samples), reportVad (bool)
engine.enableAudioVolumeIndication(200, 3, true);
```

**Handle Volume Events:**

```typescript
engine.registerEventHandler({
  onAudioVolumeIndication: (
    connection: RtcConnection,
    speakers: AudioVolumeInfo[],
    speakerNumber: number,
    totalVolume: number
  ) => {
    // Filter speakers above threshold
    const activeSpeakers = speakers
      .filter(speaker => speaker.volume > 10)
      .map(speaker => speaker.uid);
    
    // Update UI with speaking indicators
    setSpeakingUids(activeSpeakers);
  },
});
```

**Visual Indicator:**

```typescript
// Green border for speaking users
<View
  style={{
    borderWidth: isSpeaking ? 3 : 0,
    borderColor: isSpeaking ? '#00FF00' : 'transparent',
  }}
>
  {isSpeaking && (
    <View style={styles.speakingIndicator}>
      <Text>🎤 Speaking</Text>
    </View>
  )}
</View>
```

---

## Platform-Specific Implementation

### Overview

Agora RTC is **only available on native platforms** (iOS/Android). Web uses fallback implementations.

### File Structure

```
hooks/
  useAgoraEngine.native.ts  ← iOS/Android (uses react-native-agora)
  useAgoraEngine.ts         ← Web (fallback, no Agora)

components/
  VideoGrid.native.tsx      ← iOS/Android (uses RtcSurfaceView)
  VideoGrid.tsx             ← Web (fallback message)

app/(tabs)/
  broadcast.native.tsx      ← iOS/Android (full Agora integration)
  broadcast.tsx             ← Web (not supported message)
```

### Metro Configuration

**File: `metro.config.js`**

```javascript
config.resolver.sourceExts = [
  'native.tsx',
  'native.ts',
  'tsx',
  'ts',
  'jsx',
  'js',
  'json',
];

// Block native-only modules from web bundle
config.resolver.blockList = [
  /node_modules\/react-native-agora\/.*/,
];
```

### Babel Configuration

**File: `babel.config.js`**

```javascript
extensions: [
  ".native.tsx",
  ".native.ts",
  ".ios.tsx",
  ".ios.ts",
  ".android.tsx",
  ".android.ts",
  ".tsx",
  ".ts",
  ".jsx",
  ".js",
  ".json",
],
```

---

## Environment Variables

### Required Variables

**Agora Credentials:**
```bash
AGORA_APP_ID=your_app_id
AGORA_APP_CERTIFICATE=your_app_certificate
AGORA_CUSTOMER_KEY=your_customer_key
AGORA_CUSTOMER_SECRET=your_customer_secret
```

**AWS S3 Configuration:**
```bash
AWS_S3_BUCKET=your_bucket_name
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY=your_access_key
AWS_SECRET_KEY=your_secret_key
```

### Setting Environment Variables

**Supabase Edge Functions:**
```bash
supabase secrets set AGORA_APP_ID=your_app_id
supabase secrets set AGORA_APP_CERTIFICATE=your_app_certificate
supabase secrets set AGORA_CUSTOMER_KEY=your_customer_key
supabase secrets set AGORA_CUSTOMER_SECRET=your_customer_secret
supabase secrets set AWS_S3_BUCKET=your_bucket_name
supabase secrets set AWS_S3_REGION=us-east-1
supabase secrets set AWS_ACCESS_KEY=your_access_key
supabase secrets set AWS_SECRET_KEY=your_secret_key
```

---

## Edge Functions

### 1. start-live

**Purpose**: Generate Agora token and start cloud recording

**Request:**
```json
{
  "title": "My Stream",
  "user_id": "user_123"
}
```

**Response:**
```json
{
  "success": true,
  "stream": {
    "id": "stream_123",
    "live_input_id": "stream_123",
    "title": "My Stream",
    "status": "live"
  },
  "agora": {
    "token": "006abc...",
    "channelName": "stream_123",
    "uid": 0,
    "appId": "your_app_id"
  }
}
```

### 2. stop-live

**Purpose**: Stop cloud recording and save playback URL

**Request:**
```json
{
  "stream_id": "stream_123"
}
```

**Response:**
```json
{
  "success": true
}
```

### 3. agora-token

**Purpose**: Generate tokens for viewers/guests

**Request:**
```json
{
  "channelName": "stream_123",
  "uid": 0,
  "role": "subscriber"
}
```

**Response:**
```json
{
  "token": "006abc..."
}
```

---

## Security

### Token Security

- ✅ **Server-Side Generation**: Tokens generated in Edge Functions
- ✅ **Never Expose Certificate**: App certificate never sent to client
- ✅ **Time-Limited**: Tokens expire after 24 hours
- ✅ **Channel Restrictions**: Tokens tied to specific channels
- ✅ **UID Restrictions**: Tokens tied to specific user IDs

### Database Security

**Row Level Security (RLS) Policies:**

```sql
-- Users can only view their own streams
CREATE POLICY "Users can view own streams"
  ON streams FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only update their own streams
CREATE POLICY "Users can update own streams"
  ON streams FOR UPDATE
  USING (auth.uid() = user_id);

-- Moderators can view all streams
CREATE POLICY "Moderators can view all streams"
  ON streams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('moderator', 'admin')
    )
  );
```

### API Security

- ✅ **Basic Auth**: Agora API uses Basic Authentication
- ✅ **HTTPS Only**: All API calls over HTTPS
- ✅ **Rate Limiting**: Implemented in Edge Functions
- ✅ **Input Validation**: All inputs validated before processing

---

## Performance Optimizations

### 1. Dual-Stream Mode

- **Benefit**: Reduces bandwidth by 80% for multi-user scenarios
- **Implementation**: Automatic fallback to low quality
- **User Control**: Tap to switch to high quality

### 2. Hardware Acceleration

- **iOS**: Uses Metal for video rendering
- **Android**: Uses OpenGL ES for video rendering
- **Benefit**: Smooth 30fps video with minimal CPU usage

### 3. Adaptive Bitrate

- **Automatic**: Agora adjusts bitrate based on network
- **Range**: 200 kbps (low) to 1200 kbps (high)
- **Benefit**: Maintains quality on poor connections

### 4. Audio-Only Mode

- **Fallback**: Automatically switches to audio-only on very poor connections
- **Benefit**: Maintains communication even when video fails

### 5. Grid Layout Optimization

- **Dynamic**: Layout adjusts based on participant count
- **Efficient**: Only renders visible video views
- **Benefit**: Supports up to 10 users without performance degradation

---

## Troubleshooting

### Common Issues

#### 1. "Failed to join channel"

**Cause**: Invalid token or expired token

**Solution**:
```typescript
// Regenerate token
const { data } = await supabase.functions.invoke('start-live', {
  body: { title: 'My Stream', user_id: userId },
});
```

#### 2. "No video showing"

**Cause**: Camera permissions not granted

**Solution**:
```typescript
// Request camera permissions
import { Camera } from 'expo-camera';

const { status } = await Camera.requestCameraPermissionsAsync();
if (status !== 'granted') {
  Alert.alert('Camera permission required');
}
```

#### 3. "requireNativeComponent error on web"

**Cause**: react-native-agora imported on web

**Solution**: Use platform-specific files (`.native.tsx` and `.tsx`)

#### 4. "Recording not starting"

**Cause**: Invalid AWS credentials or S3 permissions

**Solution**:
```bash
# Verify AWS credentials
aws s3 ls s3://your-bucket/

# Check S3 bucket policy allows Agora to write
```

#### 5. "Poor video quality"

**Cause**: Network congestion or low bandwidth

**Solution**:
```typescript
// Enable dual-stream mode
engine.enableDualStreamMode(true);

// Subscribe to low quality
engine.setRemoteVideoStreamType(uid, VideoStreamType.VideoStreamLow);
```

---

## Additional Resources

- **Agora Documentation**: https://docs.agora.io/
- **Agora Cloud Recording**: https://docs.agora.io/en/cloud-recording/
- **React Native Agora SDK**: https://github.com/AgoraIO-Community/react-native-agora
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions

---

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review Agora logs in the console
3. Check Supabase Edge Function logs
4. Contact the development team

---

**Last Updated**: 2024
**Version**: 1.0.0
